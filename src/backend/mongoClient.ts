import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
let client: MongoClient | null = null;
let authDb: Db | null = null;

export async function connectMongo(): Promise<{ authDb: Db }> {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log(' Connected successfully to MongoDB server');
    authDb = client.db(process.env.AUTH_DB_NAME || 'aiops_auth_db');
  }
  return { authDb: authDb! };
}