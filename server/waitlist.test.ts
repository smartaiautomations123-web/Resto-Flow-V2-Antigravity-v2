import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { waitlist } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Waitlist Management", () => {
  let waitlistId1: number;
  let waitlistId2: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up any existing test data
    await db.delete(waitlist);
  });

  it("should add guest to waitlist", async () => {
    const { addToWaitlist } = await import("./db");
    waitlistId1 = await addToWaitlist({
      guestName: "John Smith",
      guestPhone: "+1 (555) 123-4567",
      guestEmail: "john@example.com",
      partySize: 4,
      notes: "Window seat preferred",
    });

    expect(waitlistId1).toBeDefined();
    expect(typeof waitlistId1).toBe("number");
  });

  it("should get waitlist queue in order", async () => {
    const { getWaitlistQueue, addToWaitlist } = await import("./db");

    // Add second guest
    waitlistId2 = await addToWaitlist({
      guestName: "Jane Doe",
      guestPhone: "+1 (555) 987-6543",
      partySize: 2,
    });

    const queue = await getWaitlistQueue();

    expect(queue).toHaveLength(2);
    expect(queue[0].guestName).toBe("John Smith");
    expect(queue[0].position).toBe(1);
    expect(queue[1].guestName).toBe("Jane Doe");
    expect(queue[1].position).toBe(2);
  });

  it("should calculate estimated wait time based on position", async () => {
    const { getWaitlistQueue } = await import("./db");
    const queue = await getWaitlistQueue();

    // Position 1: 1 * 15 + 5 = 20 minutes
    expect(queue[0].estimatedWaitTime).toBe(20);

    // Position 2: 2 * 15 + 5 = 35 minutes
    expect(queue[1].estimatedWaitTime).toBe(35);
  });

  it("should get specific waitlist entry", async () => {
    const { getWaitlistEntry } = await import("./db");
    const entry = await getWaitlistEntry(waitlistId1);

    expect(entry).toBeDefined();
    expect(entry?.guestName).toBe("John Smith");
    expect(entry?.partySize).toBe(4);
    expect(entry?.status).toBe("waiting");
  });

  it("should update waitlist status", async () => {
    const { updateWaitlistStatus, getWaitlistEntry } = await import("./db");

    await updateWaitlistStatus(waitlistId1, "called");
    const entry = await getWaitlistEntry(waitlistId1);

    expect(entry?.status).toBe("called");
  });

  it("should promote guest from waitlist", async () => {
    const { promoteFromWaitlist, getWaitlistQueue } = await import("./db");

    // Reset status to waiting
    const { updateWaitlistStatus } = await import("./db");
    await updateWaitlistStatus(waitlistId1, "waiting");

    // Promote first guest
    await promoteFromWaitlist(waitlistId1);

    const queue = await getWaitlistQueue();

    // Second guest should now be at position 1
    expect(queue[0].guestName).toBe("Jane Doe");
    expect(queue[0].position).toBe(1);
    expect(queue[0].estimatedWaitTime).toBe(20); // 1 * 15 + 5
  });

  it("should get waitlist statistics", async () => {
    const { getWaitlistStats, updateWaitlistStatus } = await import("./db");

    // Reset to waiting
    await updateWaitlistStatus(waitlistId1, "waiting");

    const stats = await getWaitlistStats();

    expect(stats.waitingCount).toBeGreaterThan(0);
    expect(stats.calledCount).toBeGreaterThanOrEqual(0);
    expect(stats.seatedCount).toBeGreaterThanOrEqual(0);
    expect(stats.averageWaitTime).toBeGreaterThanOrEqual(0);
  });

  it("should get estimated wait time for new guest", async () => {
    const { getEstimatedWaitTime } = await import("./db");
    const waitTime = await getEstimatedWaitTime();

    expect(waitTime).toBeGreaterThan(0);
  });

  it("should remove guest from waitlist", async () => {
    const { removeFromWaitlist, getWaitlistEntry } = await import("./db");

    await removeFromWaitlist(waitlistId2);
    const entry = await getWaitlistEntry(waitlistId2);

    expect(entry).toBeNull();
  });

  it("should mark SMS notification as sent", async () => {
    const { markSmsNotificationSent, getWaitlistEntry } = await import("./db");

    await markSmsNotificationSent(waitlistId1);
    const entry = await getWaitlistEntry(waitlistId1);

    expect(entry?.smsNotificationSent).toBe(true);
    expect(entry?.smsNotificationSentAt).toBeDefined();
  });

  it("should handle empty waitlist", async () => {
    const { removeFromWaitlist, getWaitlistQueue, getEstimatedWaitTime } = await import("./db");

    // Remove all guests
    await removeFromWaitlist(waitlistId1);

    const queue = await getWaitlistQueue();
    const waitTime = await getEstimatedWaitTime();

    expect(queue).toHaveLength(0);
    expect(waitTime).toBe(0);
  });
});
