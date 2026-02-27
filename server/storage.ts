import { 
  type ParkingSlot, 
  type InsertParkingSlot,
  type Zone,
  type InsertZone,
  type Reservation,
  type InsertReservation,
  type ActivityLog,
  type InsertActivityLog,
  type OccupancyStats,
  type ZoneStats,
} from "@shared/schema";
import { db, schema } from "./db.js";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Zones
  getZones(): Promise<Zone[]>;
  getZone(id: string): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;

  // Parking Slots
  getSlots(): Promise<ParkingSlot[]>;
  getSlot(id: string): Promise<ParkingSlot | undefined>;
  getSlotsByZone(zoneId: string): Promise<ParkingSlot[]>;
  getAvailableSlots(): Promise<ParkingSlot[]>;
  createSlot(slot: InsertParkingSlot): Promise<ParkingSlot>;
  updateSlotStatus(id: string, status: string, vehiclePlate?: string): Promise<ParkingSlot>;

  // Reservations
  getReservations(): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | undefined>;
  cancelReservation(id: string): Promise<void>;

  // Activity Logs
  getActivityLogs(): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Analytics
  getOccupancyStats(): Promise<OccupancyStats>;
  getZoneStats(): Promise<ZoneStats[]>;

  // Initialization
  initializeData(): Promise<void>;
}

class DbStorage implements IStorage {
  async initializeData(): Promise<void> {
    // Check if zones already exist
    const existingZones = await db.select().from(schema.zones);
    
    if (existingZones.length > 0) {
      return; // Already initialized
    }

    // Initialize with sample data
    console.log("Initializing database with sample data...");

    // Create zones
    const zoneData = [
      { name: "Zone A", code: "A", capacity: 50 },
      { name: "Zone B", code: "B", capacity: 30 },
      { name: "Zone C", code: "C", capacity: 40 },
    ];

    const createdZones = await db.insert(schema.zones).values(zoneData).returning();
    console.log(`Created ${createdZones.length} zones`);

    // Create parking slots for each zone
    const slotData: any[] = [];
    createdZones.forEach((zone: any, zoneIndex: number) => {
      for (let i = 1; i <= zone.capacity; i++) {
        const slotNumber = `${zone.code}${i.toString().padStart(3, '0')}`;
        const status = Math.random() > 0.7 ? "occupied" : "available";
        
        slotData.push({
          slotNumber,
          zoneId: zone.id,
          status,
          vehiclePlate: status === "occupied" ? `ABC${Math.floor(Math.random() * 1000)}` : null,
          lastUpdated: new Date().toISOString(),
          floor: Math.floor(zoneIndex / 2) + 1,
        });
      }
    });

    await db.insert(schema.parkingSlots).values(slotData);
    console.log(`Created ${slotData.length} parking slots`);
  }

  // Zones
  async getZones(): Promise<Zone[]> {
    return await db.select().from(schema.zones);
  }

  async getZone(id: string): Promise<Zone | undefined> {
    const result = await db.select().from(schema.zones).where(eq(schema.zones.id, id));
    return result[0];
  }

  async createZone(insertZone: InsertZone): Promise<Zone> {
    const result = await db.insert(schema.zones).values(insertZone).returning();
    return result[0];
  }

  // Parking Slots
  async getSlots(): Promise<ParkingSlot[]> {
    return await db.select().from(schema.parkingSlots);
  }

  async getSlot(id: string): Promise<ParkingSlot | undefined> {
    const result = await db.select().from(schema.parkingSlots).where(eq(schema.parkingSlots.id, id));
    return result[0];
  }

  async getSlotsByZone(zoneId: string): Promise<ParkingSlot[]> {
    return await db.select().from(schema.parkingSlots).where(eq(schema.parkingSlots.zoneId, zoneId));
  }

  async getAvailableSlots(): Promise<ParkingSlot[]> {
    return await db.select().from(schema.parkingSlots).where(eq(schema.parkingSlots.status, "available"));
  }

  async createSlot(insertSlot: InsertParkingSlot): Promise<ParkingSlot> {
    const result = await db.insert(schema.parkingSlots).values(insertSlot).returning();
    return result[0];
  }

  async updateSlotStatus(id: string, status: string, vehiclePlate?: string): Promise<ParkingSlot> {
    const result = await db
      .update(schema.parkingSlots)
      .set({ status, vehiclePlate, lastUpdated: new Date().toISOString() })
      .where(eq(schema.parkingSlots.id, id))
      .returning();
    return result[0];
  }

  // Reservations
  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(schema.reservations).orderBy(desc(schema.reservations.createdAt));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const result = await db.select().from(schema.reservations).where(eq(schema.reservations.id, id));
    return result[0];
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const result = await db.insert(schema.reservations).values(insertReservation).returning();
    return result[0];
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | undefined> {
    const result = await db
      .update(schema.reservations)
      .set(updates)
      .where(eq(schema.reservations.id, id))
      .returning();
    return result[0];
  }

  async cancelReservation(id: string): Promise<void> {
    await db
      .update(schema.reservations)
      .set({ status: "cancelled" })
      .where(eq(schema.reservations.id, id));
  }

  // Activity Logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(schema.activityLogs).orderBy(desc(schema.activityLogs.timestamp));
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(schema.activityLogs).values(insertLog).returning();
    return result[0];
  }

  // Analytics
  async getOccupancyStats(): Promise<OccupancyStats> {
    const slots = await this.getSlots();
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === "available").length;
    const occupiedSlots = slots.filter(s => s.status === "occupied").length;
    const reservedSlots = slots.filter(s => s.status === "reserved").length;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      occupancyRate: totalSlots > 0 ? (occupiedSlots + reservedSlots) / totalSlots : 0,
    };
  }

  async getZoneStats(): Promise<ZoneStats[]> {
    const zones = await this.getZones();
    const stats: ZoneStats[] = [];

    for (const zone of zones) {
      const slots = await this.getSlotsByZone(zone.id);
      const total = slots.length;
      const available = slots.filter(s => s.status === "available").length;
      const occupied = slots.filter(s => s.status === "occupied").length;
      const reserved = slots.filter(s => s.status === "reserved").length;

      stats.push({
        zoneId: zone.id,
        zoneName: zone.name,
        total,
        available,
        occupied,
        reserved,
        occupancyRate: total > 0 ? (occupied + reserved) / total : 0,
      });
    }

    return stats;
  }
}

export const storage = new DbStorage();