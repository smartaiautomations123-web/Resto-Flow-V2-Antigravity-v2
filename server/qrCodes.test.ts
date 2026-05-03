import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("qrCodes", () => {
  it("getAll returns list of QR codes", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.qrCodes.getAll();

    expect(Array.isArray(result)).toBe(true);
  });

  it("getByTableId returns QR code for a specific table", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.qrCodes.getByTableId({ tableId: 1 });

    if (result) {
      expect(result.tableId).toBe(1);
      expect(result.qrUrl).toBeDefined();
    }
  });

  it("createOrUpdate creates a new QR code (admin only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.qrCodes.createOrUpdate({
      tableId: 1,
      qrUrl: "https://example.com/qr/1.png",
      qrSize: 200,
      format: "png",
    });

    expect(result.tableId).toBe(1);
    expect(result.qrUrl).toBe("https://example.com/qr/1.png");
  });

  it("createOrUpdate rejects non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.qrCodes.createOrUpdate({
        tableId: 1,
        qrUrl: "https://example.com/qr/1.png",
        qrSize: 200,
        format: "png",
      });
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("delete removes a QR code (admin only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.qrCodes.delete({ tableId: 1 });

    expect(result).toBe(true);
  });

  it("generateForAllTables creates QR codes for all tables (admin only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.qrCodes.generateForAllTables();

    expect(Array.isArray(result)).toBe(true);
  });
});
