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
  updateSlot(id: string, updates: Partial<ParkingSlot>): Promise<ParkingSlot | undefined>;
  
  // Reservations
  getReservations(): Promise<Reservation[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  cancelReservation(id: string): Promise<boolean>;
  
  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Stats
  getOccupancyStats(): Promise<OccupancyStats>;
  getZoneStats(): Promise<ZoneStats[]>;

  // Initialization
  initializeData(): Promise<void>;
}

export class DbStorage implements IStorage {
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

  async updateSlot(id: string, updates: Partial<ParkingSlot>): Promise<ParkingSlot | undefined> {
    const result = await db
      .update(schema.parkingSlots)
      .set({ ...updates, lastUpdated: new Date() })
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
    const reservation = result[0];

    // Update slot status to reserved
    await this.updateSlot(reservation.slotId, {
      status: "reserved",
      vehiclePlate: reservation.vehiclePlate,
    });

    // Create activity log
    await this.createActivityLog({
      slotId: reservation.slotId,
      action: "reserved",
      vehiclePlate: reservation.vehiclePlate,
      details: `Reserved by ${reservation.userName}`,
    });

    return reservation;
  }

  async cancelReservation(id: string): Promise<boolean> {
    const reservation = await this.getReservation(id);
    if (!reservation) return false;

    // Update reservation status
    await db
      .update(schema.reservations)
      .set({ status: "cancelled" })
      .where(eq(schema.reservations.id, id));

    // Update slot status back to available
    await this.updateSlot(reservation.slotId, {
      status: "available",
      vehiclePlate: null,
    });

    // Create activity log
    await this.createActivityLog({
      slotId: reservation.slotId,
      action: "cancelled",
      vehiclePlate: reservation.vehiclePlate,
      details: `Reservation cancelled`,
    });

    return true;
  }

  // Activity Logs
  async getActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(schema.activityLogs)
      .orderBy(desc(schema.activityLogs.timestamp))
      .limit(limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(schema.activityLogs).values(insertLog).returning();
    return result[0];
  }

  // Stats
  async getOccupancyStats(): Promise<OccupancyStats> {
    const slots = await this.getSlots();
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === "available").length;
    const occupiedSlots = slots.filter(s => s.status === "occupied").length;
    const reservedSlots = slots.filter(s => s.status === "reserved").length;
    const occupancyRate = totalSlots > 0 ? ((occupiedSlots + reservedSlots) / totalSlots) * 100 : 0;

    return {
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      occupancyRate,
    };
  }

  async getZoneStats(): Promise<ZoneStats[]> {
    const allZones = await this.getZones();
    const slots = await this.getSlots();

    return allZones.map(zone => {
      const zoneSlots = slots.filter(s => s.zoneId === zone.id);
      const total = zoneSlots.length;
      const available = zoneSlots.filter(s => s.status === "available").length;
      const occupied = zoneSlots.filter(s => s.status === "occupied").length;
      const reserved = zoneSlots.filter(s => s.status === "reserved").length;
      const occupancyRate = total > 0 ? ((occupied + reserved) / total) * 100 : 0;

      return {
        zoneId: zone.id,
        zoneName: zone.name,
        total,
        available,
        occupied,
        reserved,
        occupancyRate,
      };
    });
  }
}

export const storage = new DbStorage();
