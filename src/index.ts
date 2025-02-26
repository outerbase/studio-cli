#!/usr/bin/env node
import { program } from "commander";
import { glob } from 'glob';
import {
  createConnectionFromConfig,
  parseFromConnectionString,
} from "./connection";
import fs from "fs";
import { JsonConnectionConfig } from "./type";
import { serve, ServeOptions } from "./studio";

const STUDIO_PATH = "https://studio.outerbase.com/embed";

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
      let options: ServeOptions = {
        driver: null,
        port: flags?.port ?? 4000,
        studio: STUDIO_PATH,
        username: flags?.user,
        password: flags?.pass,
        log: flags?.log ?? false,
      }

      // Attempt to load from connection string
      if (arg) {
        return serve({
          ...options,
          driver: parseFromConnectionString(arg)
        })
      }

      // If config file is specified, load from it
      if (flags.config) {
        return serve(loadConfigFromFile(options, flags.config))
      }

      if (detectCloudflareD1(options)) {
        return;
      }

      // Attempt to load from "outerbase.json"
      console.log("No configuration specified. Attempt to load config from outerbase.json")
      if (fs.existsSync("outerbase.json")) {
        console.log("outerbase.json found. Loading from it");
        serve(loadConfigFromFile(options, "outerbase.json"));
      }
    }
  );

function loadConfigFromFile(defaultOptions: ServeOptions, configFile: string): ServeOptions | null {
  try {
    if (!fs.existsSync(configFile)) {
      console.log(configFile, "configuration file does not exist");
      return;
    }


    const configContent: JsonConnectionConfig = JSON.parse(
      fs.readFileSync(configFile, "utf-8")
    );


    return {
      port: configContent.port ?? defaultOptions.port,
      username: configContent.auth?.username ?? defaultOptions.username,
      password: configContent.auth?.password ?? defaultOptions.password,
      studio: configContent.studio ?? defaultOptions.studio,
      driver: createConnectionFromConfig(configFile, configContent),
    }
  } catch (e) {
    console.log(e);
    console.log("The configuration is not a valid JSON file");
    return null;
  }
}

function detectCloudflareD1(defaultOptions: ServeOptions): boolean {
  // Check if .wrangler folder exists
  if (!fs.existsSync(".wrangler")) {
    return false;
  }

  console.log("Cloudflare Worker projects detected because .wrangler folder exists");
  console.log("Finding local D1 file")

  // Find all the file that end with .sqlite inside the
  // .wrangler/state folder
  const found = glob.sync(".wrangler/state/**/*.sqlite", { ignore: "node_modules/**", });

  if (found.length === 0) {
    console.log("No local D1 file found");
  }

  serve({
    ...defaultOptions,
    driver: createConnectionFromConfig("cloudflare", {
      driver: "sqlite",
      connection: {
        file: found[0],
      }
    })
  })

  return true;
}

program.parse();
