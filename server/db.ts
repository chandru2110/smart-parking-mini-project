import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as sqliteSchema from "../shared/schema-sqlite.js";
import * as pgSchema from "../shared/schema.js";

neonConfig.webSocketConstructor = ws;

let db: any;
let schema: any;

if (process.env.DATABASE_URL) {
  // Production: Use Neon PostgreSQL
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon(pool, { schema: pgSchema });
  schema = pgSchema;
} else {
  // Development: Use SQLite
  console.log("No DATABASE_URL found, using SQLite for local development");
  const sqlite = new Database("./local.db");
  db = drizzle(sqlite, { schema: sqliteSchema });
  schema = sqliteSchema;
  
  // Create tables for SQLite
  try {
    // Create zones table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        capacity INTEGER NOT NULL
      );
    `);
    
    // Create parking_slots table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id TEXT PRIMARY KEY,
        slot_number TEXT NOT NULL UNIQUE,
        zone_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        vehicle_plate TEXT,
        last_updated TEXT NOT NULL,
        floor INTEGER DEFAULT 1
      );
    `);
    
    // Create reservations table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        slot_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        vehicle_plate TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL
      );
    `);
    
    // Create activity_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        slot_id TEXT NOT NULL,
        action TEXT NOT NULL,
        vehicle_plate TEXT,
        timestamp TEXT NOT NULL,
        details TEXT
      );
    `);
    
    console.log("SQLite tables created successfully");
  } catch (error) {
    console.error("Error creating SQLite tables:", error);
  }
}

export { db, schema };
