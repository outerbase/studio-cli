export interface ResultHeader {
  name: string;
  displayName: string;
  originalType: string | null;
  type: ColumnType;
}

export interface Result {
  rows: Record<string, unknown>[];
  headers: ResultHeader[];
  stat: {
    rowsAffected: number;
    rowsRead: number | null;
    rowsWritten: number | null;
    queryDurationMs: number | null;
  };
  lastInsertRowid?: number;
}

export enum ColumnType {
  TEXT = 1,
  INTEGER = 2,
  REAL = 3,
  BLOB = 4,
}

export default abstract class BaseDriver {
  abstract name: string;
  abstract connectionName(): string;
  abstract init(): Promise<void>;
  abstract batch(statements: string[]): Promise<Result[]>;
  abstract query(statement: string): Promise<Result>;
}
