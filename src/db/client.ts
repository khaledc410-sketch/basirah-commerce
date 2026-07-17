import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/config/env";

import * as schema from "./schema";

function createSqlClient() {
  const databaseUrl = getServerEnv().DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before accessing the database.");
  }

  return postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 5,
    prepare: false,
  });
}

type SqlClient = ReturnType<typeof createSqlClient>;

let sqlClient: SqlClient | undefined;

function getSqlClient(): SqlClient {
  sqlClient ??= createSqlClient();
  return sqlClient;
}

function createDatabase() {
  return drizzle(getSqlClient(), { schema });
}

export type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

export function getDb(): Database {
  database ??= createDatabase();
  return database;
}

export async function closeDb(): Promise<void> {
  if (!sqlClient) {
    return;
  }

  await sqlClient.end({ timeout: 5 });
  sqlClient = undefined;
  database = undefined;
}
