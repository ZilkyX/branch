import "server-only";

import { MongoClient } from "mongodb";

// Kept on globalThis so dev reloads and serverless calls share one connection pool.
const globalForMongo = globalThis as unknown as {
  mongoClient?: Promise<MongoClient>;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function getDatabase() {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(requireEnv("MONGODB_URI"))
      .connect()
      .catch((error) => {
        // Don't cache a failed connection, so the next request can retry.
        globalForMongo.mongoClient = undefined;
        throw error;
      });
  }

  const client = await globalForMongo.mongoClient;
  return client.db(requireEnv("MONGODB_DB"));
}
