import { MongoClient } from "mongodb";
import { ensureWorkingDns } from "@/lib/ensure-dns";

ensureWorkingDns();

const uri = process.env.MONGODB_URI;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }
  const client = new MongoClient(uri);
  return client.connect();
}

const clientPromise = global._mongoClientPromise ?? createClientPromise();
global._mongoClientPromise = clientPromise;

export default clientPromise;
