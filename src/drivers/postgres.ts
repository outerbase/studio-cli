import { transformArrayBasedResult } from "../utils";
import BaseDriver, { ColumnType, Result } from "./base";
import pg, { type ConnectionConfig, type FieldDef, type PoolClient } from "pg";

pg.types.setTypeParser(pg.types.builtins.TIME, (timeStr) => timeStr);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, (timeStr) => timeStr);
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, (timeStr) => timeStr);
pg.types.setTypeParser(pg.types.builtins.DATE, (timeStr) => timeStr);
pg.types.setTypeParser(pg.types.builtins.TIME, (timeStr) => timeStr);
pg.types.setTypeParser(pg.types.builtins.JSON, (json) => json);
pg.types.setTypeParser(pg.types.builtins.JSONB, (json) => json);

export default class PostgresDriver extends BaseDriver {
  name = "postgres";
  protected db: pg.Pool;

  constructor(config: ConnectionConfig) {
    super();
    this.db = new pg.Pool(config);
  }

  async close() {
    await this.db.end();
  }

  connectionName(): string {
    const poolConfig = this.db.options;
    const host = poolConfig.host || "localhost";
    const database = poolConfig.database || "unknown";
    return `[PostgreSQL] ${host} - ${database}`;
  }

  async execute(tx: PoolClient | pg.Pool, statement: string): Promise<Result> {
    const r = await tx.query({
      text: statement,
      rowMode: "array",
    });
    return {
      ...transformArrayBasedResult<FieldDef>(
        r.fields,
        (header) => {
          return {
            name: header.name,
            type: ColumnType.TEXT,
            originalType: header.dataTypeID.toString(),
          };
        },
        r.rows
      ),
      stat: {
        queryDurationMs: 0,
        rowsAffected: r.rowCount,
        rowsRead: r.rowCount,
        rowsWritten: 0,
      },
    };
  }

  async query(statement: string): Promise<Result> {
    return this.execute(this.db, statement);
  }

  async batch(statements: string[]): Promise<Result[]> {
    const results: Result[] = [];
    let error: unknown;

    const tx = await this.db.connect();

    try {
      await tx.query("BEGIN");

      for (const statement of statements) {
        results.push(await this.execute(tx, statement));
      }

      await tx.query("COMMIT");
    } catch (e) {
      await tx.query("ROLLBACK");
      error = e;
    } finally {
      tx.release();
    }

    if (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("Unexpected error");
      }
    }

    return results;
  }

  async init() {
    return;
  }
}
