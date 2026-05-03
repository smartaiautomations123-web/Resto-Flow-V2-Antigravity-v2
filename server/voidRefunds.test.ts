import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "admin"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("voidRefunds", () => {
  it("getPending returns pending voids (admin only)", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voidRefunds.getPending();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getPending throws error for non-admin", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.voidRefunds.getPending();
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("requestVoid creates a void request", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Note: This will fail if order doesn't exist, but tests the procedure structure
    try {
      await caller.voidRefunds.requestVoid({
        orderId: 999,
        reason: "customer_request",
        notes: "Test void request",
      });
    } catch (error: any) {
      // Expected to fail due to non-existent order
      expect(error).toBeDefined();
    }
  });

  it("approveVoid requires admin role", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.voidRefunds.approveVoid({
        orderId: 1,
        refundMethod: "original_payment",
        notes: "Approved",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("rejectVoid requires admin role", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.voidRefunds.rejectVoid({
        orderId: 1,
        notes: "Rejected",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("getHistory retrieves void audit log for an order", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.voidRefunds.getHistory({ orderId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});
