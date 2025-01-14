import { ClientConfig } from "pg";

interface StudioOption {
  port?: number;
  studio?: string;
  auth?: {
    username: string;
    password: string;
  };
}

interface TursoConfig extends StudioOption {
  driver: "turso";
  connection: {
    url: string;
    token?: string;
    attach?: Record<string, string>;
  };
}

interface MySqlConfig extends StudioOption {
  driver: "mysql";
  connection: {
    database: string;
    host: string;
    port: number;
    user: string;
    password: string;
  };
}

interface SqliteConfig extends StudioOption {
  driver: "sqlite";
  connection: {
    file: string;
    attach?: Record<string, string>;
  };
}

interface PostgresConfig extends StudioOption {
  driver: "postgres";
  connection: ClientConfig;
}
export type JsonConnectionConfig =
  | TursoConfig
  | SqliteConfig
  | MySqlConfig
  | PostgresConfig;
