#!/usr/bin/env node
import { program } from "commander";
import BaseDriver from "./drivers/base";
import {
  createConnectionFromConfig,
  parseFromConnectionString,
} from "./connection";
import fs from "fs";
import { JsonConnectionConfig } from "./type";
import { serve } from "./studio";
const STUDIO_PATH = "https://libsqlstudio.com/embed";

program
  .name("@outerbase/studio")
  .version("0.1.0")
  .option("--port <port>", "Set port to serve", "4000")
  .option("--user <username>", "Set basic authentication username")
  .option("--pass <password>", "Set basic authentication password")
  .option("--config <config-file>", "Launch studio using configuration file")
  .option("-l --log", "Enable log that show all the SQL executed")
  .argument("[connection]", "Serve database from connection string", null)
  .action(
    (
      arg,
      flags: {
        pass?: string;
        user?: string;
        port?: number;
        config?: string;
        log?: boolean;
      }
    ) => {
      let driver: BaseDriver | null = null;
      let port = flags?.port ?? 4000;
      let studio = STUDIO_PATH;
      let user = flags?.user;
      let password = flags?.pass;
      let enabledLog = flags?.log ?? false;

      if (arg) {
        // Parse connection from connection string
        driver = parseFromConnectionString(arg);
      } else {
        const configFile = flags.config ?? "outerbase.json";

        if (!fs.existsSync(configFile)) {
          console.log("We cannot find " + configFile);
          return;
        }

        try {
          const configContent: JsonConnectionConfig = JSON.parse(
            fs.readFileSync(configFile, "utf-8")
          );

          port = configContent.port ?? port;
          user = configContent.auth?.username ?? user;
          password = configContent.auth?.password ?? password;
          studio = configContent.studio ?? studio;

          driver = createConnectionFromConfig(configFile, configContent);
        } catch (e) {
          console.log(e);
          console.log("The configuration is not a valid JSON file");
          return;
        }
      }

      if (!driver) {
        console.log("We couldn't find the right driver for this database");
      }

      const driverSuffix: Record<JsonConnectionConfig["driver"], string> = {
        mysql: "mysql",
        sqlite: "sqlite",
        turso: "sqlite",
        postgres: "postgres",
      };

      serve(driver, {
        port,
        studio: studio + "/" + driverSuffix[driver.name],
        username: user,
        password: password,
        log: enabledLog,
      });
    }
  );

program.parse();
