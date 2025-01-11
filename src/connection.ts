import fs from "fs";
import path from "path";
import BaseDriver from "./drivers/base";
import MySQLDriver from "./drivers/mysql";
import TursoDriver from "./drivers/sqlite";
import { JsonConnectionConfig } from "./type";
import PostgresDriver from "./drivers/postgres";

export function createConnectionFromConfig(
  configFile: string,
  config: JsonConnectionConfig
) {
  const configPath = path.dirname(configFile);

  if (config.driver === "sqlite") {
    return new TursoDriver({
      url: "file:" + path.join(configPath, config.connection.file),
      attach: config.connection.attach
        ? Object.entries(config.connection.attach).reduce((a, [key, value]) => {
            a[key] = path.join(configPath, value);
            return a;
          }, {})
        : undefined,
    });
  } else if (config.driver === "turso") {
    return new TursoDriver({
      url: config.connection.url,
      attach: config.connection.attach,
      token: config.connection.token,
    });
  } else if (config.driver === "mysql") {
    return new MySQLDriver(config.connection);
  } else if (config.driver === "postgres") {
    return new PostgresDriver(config.connection);
  }
}

export function parseFromConnectionString(conn: string): BaseDriver | null {
  try {
    const url = new URL(conn);

    if (url.protocol === "mysql:") {
      return new MySQLDriver({
        host: url.hostname,
        port: Number(url.port),
        database: url.pathname.replace("/", ""),
        password: url.password,
        user: url.username,
      });
    }
  } catch {}

  // Let try to check from the file
  if (fs.existsSync(conn)) {
    return new TursoDriver({ url: "file:" + conn });
  }
}
