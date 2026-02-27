import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Parking Zones
export const zones = pgTable("zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  capacity: integer("capacity").notNull(),
});

export const insertZoneSchema = createInsertSchema(zones).omit({ id: true });
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zones.$inferSelect;

// Parking Slots
export const parkingSlots = pgTable("parking_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotNumber: text("slot_number").notNull().unique(),
  zoneId: varchar("zone_id").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, reserved, disabled
  vehiclePlate: text("vehicle_plate"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  floor: integer("floor").default(1),
});

export const insertParkingSlotSchema = createInsertSchema(parkingSlots).omit({ 
  id: true,
  lastUpdated: true,
});
export type InsertParkingSlot = z.infer<typeof insertParkingSlotSchema>;
export type ParkingSlot = typeof parkingSlots.$inferSelect;

// Reservations
export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotId: varchar("slot_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservations).omit({ 
  id: true,
  createdAt: true,
});
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotId: varchar("slot_id").notNull(),
  action: text("action").notNull(), // entry, exit, reserved, cancelled
  vehiclePlate: text("vehicle_plate"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: text("details"),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ 
  id: true,
  timestamp: true,
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Analytics data type
export type OccupancyStats = {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  occupancyRate: number;
};

export type ZoneStats = {
  zoneId: string;
  zoneName: string;
  total: number;
  available: number;
  occupied: number;
  reserved: number;
  occupancyRate: number;
};
