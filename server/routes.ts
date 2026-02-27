import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { 
  zones, 
  parkingSlots, 
  reservations, 
  activityLogs, 
  insertReservationSchema, 
  insertParkingSlotSchema, 
  insertZoneSchema 
} from "../shared/schema-sqlite.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database with sample data
  await storage.initializeData();
  // Zones
  app.get("/api/zones", async (_req, res) => {
    try {
      const zones = await storage.getZones();
      res.json(zones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch zones" });
    }
  });

  app.get("/api/zones/:id", async (req, res) => {
    try {
      const zone = await storage.getZone(req.params.id);
      if (!zone) {
        return res.status(404).json({ error: "Zone not found" });
      }
      res.json(zone);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch zone" });
    }
  });

  app.post("/api/zones", async (req, res) => {
    try {
      const validatedData = insertZoneSchema.parse(req.body);
      const zone = await storage.createZone(validatedData);
      res.status(201).json(zone);
    } catch (error) {
      res.status(400).json({ error: "Invalid zone data" });
    }
  });

  // Parking Slots
  app.get("/api/slots", async (_req, res) => {
    try {
      const slots = await storage.getSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slots" });
    }
  });

  app.get("/api/slots/available", async (_req, res) => {
    try {
      const slots = await storage.getAvailableSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available slots" });
    }
  });

  app.get("/api/slots/:id", async (req, res) => {
    try {
      const slot = await storage.getSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slot" });
    }
  });

  app.post("/api/slots", async (req, res) => {
    try {
      const validatedData = insertParkingSlotSchema.parse(req.body);
      const slot = await storage.createSlot(validatedData);
      broadcastSlotUpdate(slot);
      res.status(201).json(slot);
    } catch (error) {
      res.status(400).json({ error: "Invalid slot data" });
    }
  });

  app.patch("/api/slots/:id", async (req, res) => {
    try {
      const { status, vehiclePlate } = req.body;
      const slot = await storage.updateSlotStatus(req.params.id, status, vehiclePlate);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      broadcastSlotUpdate(slot);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update slot" });
    }
  });

  app.put("/api/slots/:id", async (req, res) => {
    try {
      const { status, vehiclePlate } = req.body;
      const slot = await storage.updateSlotStatus(req.params.id, status, vehiclePlate);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      broadcastSlotUpdate(slot);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to update slot" });
    }
  });

  // Reservations
  app.get("/api/reservations", async (_req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservations" });
    }
  });

  app.get("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reservation" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      // Convert startTime and endTime to Date objects
      const reservationData = {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime)
      };
      const reservation = await storage.createReservation(reservationData);
      
      // Broadcast updated slot status
      const updatedSlot = await storage.getSlot(reservation.slotId);
      if (updatedSlot) {
        broadcastSlotUpdate(updatedSlot);
      }
      
      res.status(201).json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  app.delete("/api/reservations/:id", async (req, res) => {
    try {
      const reservation = await storage.getReservation(req.params.id);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      await storage.cancelReservation(req.params.id);

      // Broadcast updated slot status
      const updatedSlot = await storage.getSlot(reservation.slotId);
      if (updatedSlot) {
        broadcastSlotUpdate(updatedSlot);
      }

      res.json({ message: "Reservation cancelled successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel reservation" });
    }
  });

  // Activity Logs
  app.get("/api/activity/recent", async (_req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      // Take only the first 10 for recent
      const recentLogs = logs.slice(0, 10);
      res.json(recentLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getActivityLogs();
      // Apply limit on the results
      const limitedLogs = logs.slice(0, limit);
      res.json(limitedLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Statistics
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getOccupancyStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/stats/zones", async (_req, res) => {
    try {
      const zoneStats = await storage.getZoneStats();
      res.json(zoneStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch zone stats" });
    }
  });

  // WebSocket setup for real-time updates
  // Reference: javascript_websocket blueprint
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");
    clients.add(ws);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });

    // Send initial data
    storage.getSlots().then(slots => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "initial", slots }));
      }
    });
  });

  // Broadcast function for slot updates
  function broadcastSlotUpdate(slot: any) {
    const message = JSON.stringify({ type: "slot_update", slot });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Simulate random slot status changes for demo purposes
  setInterval(async () => {
    const slots = await storage.getSlots();
    if (slots.length > 0) {
      const randomSlot = slots[Math.floor(Math.random() * slots.length)];
      
      // Randomly change status
      const statuses = ["available", "occupied"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (randomSlot.status !== "reserved" && randomSlot.status !== newStatus) {
        const vehiclePlate = newStatus === "occupied" ? `SIM ${Math.floor(Math.random() * 9000 + 1000)}` : undefined;
        const updated = await storage.updateSlotStatus(randomSlot.id, newStatus, vehiclePlate);

        if (updated) {
          broadcastSlotUpdate(updated);
          
          // Create activity log
          await storage.createActivityLog({
            slotId: updated.id,
            action: newStatus === "occupied" ? "entry" : "exit",
            vehiclePlate: updated.vehiclePlate,
            details: `Slot status changed to ${newStatus}`,
          });
        }
      }
    }
  }, 8000); // Update every 8 seconds

  return httpServer;
}
