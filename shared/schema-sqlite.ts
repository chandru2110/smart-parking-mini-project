import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Parking Zones
export const zones = sqliteTable("zones", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  capacity: integer("capacity").notNull(),
});

export const insertZoneSchema = createInsertSchema(zones).omit({ id: true });
export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zones.$inferSelect;

// Parking Slots
export const parkingSlots = sqliteTable("parking_slots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slotNumber: text("slot_number").notNull().unique(),
  zoneId: text("zone_id").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, reserved, disabled
  vehiclePlate: text("vehicle_plate"),
  lastUpdated: text("last_updated").notNull().$defaultFn(() => new Date().toISOString()),
  floor: integer("floor").default(1),
});

export const insertParkingSlotSchema = createInsertSchema(parkingSlots).omit({ 
  id: true,
  lastUpdated: true,
});
export type InsertParkingSlot = z.infer<typeof insertParkingSlotSchema>;
export type ParkingSlot = typeof parkingSlots.$inferSelect;

// Reservations
export const reservations = sqliteTable("reservations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slotId: text("slot_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertReservationSchema = createInsertSchema(reservations).omit({ 
  id: true,
  createdAt: true,
});
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Activity Logs
export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slotId: text("slot_id").notNull(),
  action: text("action").notNull(), // entry, exit, reserved, cancelled
  vehiclePlate: text("vehicle_plate"),
  timestamp: text("timestamp").notNull().$defaultFn(() => new Date().toISOString()),
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