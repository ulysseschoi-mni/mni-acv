import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

/**
 * Test helper to create authenticated context
 */
function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-user-${userId}`,
      email: `user${userId}@test.com`,
      name: `Test User ${userId}`,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Orders Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userCtx: TrpcContext;
  let adminCtx: TrpcContext;

  beforeEach(() => {
    userCtx = createAuthContext(1, "user");
    adminCtx = createAuthContext(2, "admin");
    caller = appRouter.createCaller(userCtx);
  });

  describe("orders.create", () => {
    it("should create an order with valid items", async () => {
      const result = await caller.orders.create({
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 },
        ],
      });

      expect(result).toBeDefined();
      expect(result.orderId).toBeDefined();
      expect(result.orderNumber).toBeDefined();
      expect(result.orderNumber).toMatch(/^ORD-/);
      expect(result.totalAmount).toBeGreaterThan(0);
      expect(result.itemCount).toBe(2);
    });

    it("should fail with empty items array", async () => {
      try {
        await caller.orders.create({
          items: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("at least one item");
      }
    });

    it("should fail with non-existent product", async () => {
      try {
        await caller.orders.create({
          items: [
            { productId: 99999, quantity: 1 },
          ],
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toContain("not found");
      }
    });

    it("should fail with insufficient stock", async () => {
      try {
        // Try to order more than available stock
        await caller.orders.create({
          items: [
            { productId: 1, quantity: 100 },
          ],
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("CONFLICT");
        expect(error.message).toContain("Insufficient stock");
      }
    });

    it("should calculate correct total amount", async () => {
      // Product 1: $80,000 (TOILET PAPER TEE)
      // Product 2: $120,000 (STICK HOODIE)
      // Order: 1x Product 1 + 2x Product 2 = 80,000 + 240,000 = 320,000
      const result = await caller.orders.create({
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 },
        ],
      });

      expect(result.totalAmount).toBe(320000);
    });
  });

  describe("orders.getById", () => {
    it("should retrieve order with items", async () => {
      // Create an order first
      const createResult = await caller.orders.create({
        items: [
          { productId: 1, quantity: 1 },
        ],
      });

      // Retrieve the order
      const order = await caller.orders.getById(createResult.orderId);

      expect(order).toBeDefined();
      expect(order.id).toBe(createResult.orderId);
      expect(order.orderNumber).toBe(createResult.orderNumber);
      expect(order.status).toBe("pending");
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe(1);
    });

    it("should fail when order not found", async () => {
      try {
        await caller.orders.getById(99999);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });

    it("should prevent user from viewing other user's order", async () => {
      // Create order as user 1
      const createResult = await caller.orders.create({
        items: [
          { productId: 1, quantity: 1 },
        ],
      });

      // Try to retrieve as user 2
      const user2Caller = appRouter.createCaller(createAuthContext(2, "user"));
      try {
        await user2Caller.orders.getById(createResult.orderId);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin to view any user's order", async () => {
      // Create order as user 1
      const createResult = await caller.orders.create({
        items: [
          { productId: 1, quantity: 1 },
        ],
      });

      // Retrieve as admin
      const adminCaller = appRouter.createCaller(adminCtx);
      const order = await adminCaller.orders.getById(createResult.orderId);

      expect(order).toBeDefined();
      expect(order.id).toBe(createResult.orderId);
    });
  });

  describe("orders.getUserOrders", () => {
    it("should retrieve user's orders with pagination", async () => {
      // Create multiple orders
      const order1 = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });
      const order2 = await caller.orders.create({
        items: [{ productId: 2, quantity: 1 }],
      });

      const result = await caller.orders.getUserOrders({
        page: 1,
        limit: 10,
      });

      expect(result.orders.length).toBeGreaterThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      const orderIds = result.orders.map((o) => o.id);
      expect(orderIds).toContain(order1.orderId);
      expect(orderIds).toContain(order2.orderId);
    });

    it("should return empty array for user with no orders", async () => {
      const newUserCaller = appRouter.createCaller(createAuthContext(999, "user"));
      const result = await newUserCaller.orders.getUserOrders();

      expect(result.orders).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("orders.updateStatus", () => {
    it("should update order status (admin only)", async () => {
      // Create order as user
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      // Update status as admin
      const adminCaller = appRouter.createCaller(adminCtx);
      const result = await adminCaller.orders.updateStatus({
        orderId: createResult.orderId,
        status: "paid",
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe("paid");
    });

    it("should fail for non-admin user", async () => {
      // Create order
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      // Try to update as regular user
      try {
        await caller.orders.updateStatus({
          orderId: createResult.orderId,
          status: "paid",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should validate status transitions", async () => {
      // Create and update order to paid
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      const adminCaller = appRouter.createCaller(adminCtx);
      await adminCaller.orders.updateStatus({
        orderId: createResult.orderId,
        status: "paid",
      });

      // Try invalid transition: paid -> pending
      try {
        await adminCaller.orders.updateStatus({
          orderId: createResult.orderId,
          status: "pending",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
        expect(error.message).toContain("Cannot transition");
      }
    });
  });

  describe("orders.cancel", () => {
    it("should cancel pending order", async () => {
      // Create order
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      // Cancel order
      const result = await caller.orders.cancel(createResult.orderId);

      expect(result.success).toBe(true);
      expect(result.message).toContain("cancelled");
    });

    it("should fail to cancel non-pending order", async () => {
      // Create and update order to paid
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      const adminCaller = appRouter.createCaller(adminCtx);
      await adminCaller.orders.updateStatus({
        orderId: createResult.orderId,
        status: "paid",
      });

      // Try to cancel paid order
      try {
        await caller.orders.cancel(createResult.orderId);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(["CONFLICT", "BAD_REQUEST"]).toContain(error.code);
        expect(error.message).toContain("Cannot cancel");
      }
    });

    it("should prevent user from cancelling other user's order", async () => {
      // Create order as user 1
      const createResult = await caller.orders.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      // Try to cancel as user 2
      const user2Caller = appRouter.createCaller(createAuthContext(2, "user"));
      try {
        await user2Caller.orders.cancel(createResult.orderId);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });
});
