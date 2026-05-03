import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Authentication", () => {
  it("should upsert a new user", async () => {
    const userData = {
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "oauth",
      lastSignedIn: new Date(),
    };

    await db.upsertUser(userData);
    const user = await db.getUserByOpenId(userData.openId);

    expect(user).toBeDefined();
    expect(user?.name).toBe("Test User");
    expect(user?.email).toBe("test@example.com");
  });

  it("should update an existing user", async () => {
    const openId = `test-user-update-${Date.now()}`;
    const userData = {
      openId,
      name: "Original Name",
      email: "original@example.com",
      loginMethod: "oauth",
      lastSignedIn: new Date(),
    };

    await db.upsertUser(userData);

    const updatedData = {
      openId,
      name: "Updated Name",
      email: "updated@example.com",
      loginMethod: "oauth",
      lastSignedIn: new Date(),
    };

    await db.upsertUser(updatedData);
    const user = await db.getUserByOpenId(openId);

    expect(user?.name).toBe("Updated Name");
    expect(user?.email).toBe("updated@example.com");
  });

  it("should get user by openId", async () => {
    const userData = {
      openId: `test-get-${Date.now()}`,
      name: "Get Test User",
      email: "get@example.com",
      loginMethod: "oauth",
      lastSignedIn: new Date(),
    };

    await db.upsertUser(userData);
    const user = await db.getUserByOpenId(userData.openId);

    expect(user).toBeDefined();
    expect(user?.openId).toBe(userData.openId);
  });

  it("should return null for non-existent user", async () => {
    const user = await db.getUserByOpenId(`non-existent-${Date.now()}`);
    expect(user).toBeFalsy();
  });
});
