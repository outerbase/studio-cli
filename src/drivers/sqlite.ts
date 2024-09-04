import { Client, createClient, ResultSet } from "@libsql/client";
import BaseDriver, { ColumnType, Result, ResultHeader } from "./base";

function convertSqliteType(type: string | undefined): ColumnType {
  // https://www.sqlite.org/datatype3.html
  if (type === undefined) return ColumnType.BLOB;

  type = type.toUpperCase();

  if (type.includes("CHAR")) return ColumnType.TEXT;
  if (type.includes("TEXT")) return ColumnType.TEXT;
  if (type.includes("CLOB")) return ColumnType.TEXT;
  if (type.includes("STRING")) return ColumnType.TEXT;

  if (type.includes("INT")) return ColumnType.INTEGER;

  if (type.includes("BLOB")) return ColumnType.BLOB;

  if (
    type.includes("REAL") ||
    type.includes("DOUBLE") ||
    type.includes("FLOAT")
  )
    return ColumnType.REAL;

  return ColumnType.TEXT;
}

function transformRawResult(raw: ResultSet): Result {
  const headerSet = new Set();

  const headers: ResultHeader[] = raw.columns.map((colName, colIdx) => {
    const colType = raw.columnTypes[colIdx];
    let renameColName = colName;

    for (let i = 0; i < 20; i++) {
      if (!headerSet.has(renameColName)) break;
      renameColName = `__${colName}_${i}`;
    }

    headerSet.add(renameColName);

    return {
      name: renameColName,
      displayName: colName,
      originalType: colType,
      type: convertSqliteType(colType),
    };
  });

  const rows = raw.rows.map((r) =>
    headers.reduce((a, b, idx) => {
      const cellValue = r[idx];

      if (cellValue instanceof Uint8Array || cellValue instanceof ArrayBuffer) {
        a[b.name] = Array.from(new Uint8Array(cellValue));
      } else {
        a[b.name] = r[idx];
      }
      return a;
    }, {} as Record<string, unknown>)
  );

  return {
    rows,
    stat: {
      rowsAffected: raw.rowsAffected,
      rowsRead: null,
      rowsWritten: null,
      queryDurationMs: 0,
    },
    headers,
    lastInsertRowid:
      raw.lastInsertRowid === undefined
        ? undefined
        : Number(raw.lastInsertRowid),
  };
}

function escapeSqlString(str: string) {
  return `'${str.replace(/'/g, `''`)}'`;
}

export default class TursoDriver implements BaseDriver {
  name = "sqlite";
  protected db: Client;
  protected attach?: Record<string, string>;

  constructor(config: {
    url: string;
    token?: string;
    attach?: Record<string, string>;
  }) {
    this.attach = config.attach;

    this.db = createClient({
      url: config.url,
      authToken: config.token,
      intMode: "number",
    });
  }

  async init() {
    if (this.attach) {
      for (const [alias, file] of Object.entries(this.attach)) {
        await this.db.execute(
          `ATTACH DATABASE ${escapeSqlString(file)} AS ${escapeSqlString(
            alias
          )}`
        );
      }
    }

    return;
  }

  async query(statement: string): Promise<Result> {
    return transformRawResult(await this.db.execute(statement));
  }

  async batch(statements: string[]): Promise<Result[]> {
    return (await this.db.batch(statements)).map(transformRawResult);
  }
}
