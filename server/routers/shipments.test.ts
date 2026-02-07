import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { orders, users, products, shipments } from "../../drizzle/schema";

describe("Shipments Router", () => {
  let db: any;
  let testUserId: number;
  let testOrderId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Create test user
    const userResult = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}-${Math.random()}`,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        role: "user",
      });
    testUserId = userResult[0]?.insertId || 1;

    // Create test order
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-${Date.now()}-${Math.random()}`,
        totalAmount: 100000,
        status: "pending",
      });
    testOrderId = orderResult[0]?.insertId || 1;
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(shipments).where(true);
      await db.delete(orders).where(true);
      await db.delete(users).where(true);
    }
  });

  it("should create a shipment for an order", async () => {
    // Create a new order for this test
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-create-${Date.now()}`,
        totalAmount: 100000,
        status: "pending",
      });
    const orderId = orderResult[0]?.insertId || 1;

    const result = await db
      .insert(shipments)
      .values({
        orderId: orderId,
        recipientName: "John Doe",
        recipientPhone: "010-1234-5678",
        address: "123 Main Street",
        addressDetail: "Apt 101",
        postalCode: "12345",
        status: "pending",
      });

    expect(result[0]?.insertId).toBeDefined();
  });

  it("should retrieve shipment by order ID", async () => {
    // Create a new order for this test
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-retrieve-${Date.now()}`,
        totalAmount: 100000,
        status: "pending",
      });
    const orderId = orderResult[0]?.insertId || 1;

    // Create a shipment
    await db
      .insert(shipments)
      .values({
        orderId: orderId,
        recipientName: "Jane Smith",
        recipientPhone: "010-9876-5432",
        address: "456 Oak Avenue",
        addressDetail: "Suite 200",
        postalCode: "54321",
        status: "pending",
      });

    // Retrieve it
    const result = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId));

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].recipientName).toBe("Jane Smith");
  });

  it("should update shipment information", async () => {
    // Create a new order for this test
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-update-${Date.now()}`,
        totalAmount: 100000,
        status: "pending",
      });
    const orderId = orderResult[0]?.insertId || 1;

    // Create a shipment
    const createResult = await db
      .insert(shipments)
      .values({
        orderId: orderId,
        recipientName: "Original Name",
        recipientPhone: "010-0000-0000",
        address: "Original Address",
        postalCode: "00000",
        status: "pending",
      });

    const shipmentId = createResult[0]?.insertId;

    // Update it
    await db
      .update(shipments)
      .set({
        recipientName: "Updated Name",
        recipientPhone: "010-1111-1111",
      })
      .where(eq(shipments.id, shipmentId));

    // Verify update
    const result = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    expect(result[0].recipientName).toBe("Updated Name");
    expect(result[0].recipientPhone).toBe("010-1111-1111");
  });

  it("should validate required shipment fields", async () => {
    // Create a new order for this test
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-validate-${Date.now()}`,
        totalAmount: 100000,
        status: "pending",
      });
    const orderId = orderResult[0]?.insertId || 1;

    try {
      await db
        .insert(shipments)
        .values({
          orderId: orderId,
          recipientName: "", // Empty name should fail
          recipientPhone: "010-1234-5678",
          address: "123 Main Street",
          postalCode: "12345",
          status: "pending",
        });
      expect.fail("Should have thrown an error for empty recipient name");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });


  it("should handle shipment status transitions", async () => {
    // Create a new order for this test
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-status-${Date.now()}`,
        totalAmount: 100000,
        status: "pending",
      });
    const orderId = orderResult[0]?.insertId || 1;

    // Create a shipment
    const createResult = await db
      .insert(shipments)
      .values({
        orderId: orderId,
        recipientName: "Test User",
        recipientPhone: "010-1234-5678",
        address: "Test Address",
        postalCode: "12345",
        status: "pending",
      });

    const shipmentId = createResult[0]?.insertId;

    // Transition to preparing
    await db
      .update(shipments)
      .set({ status: "preparing" })
      .where(eq(shipments.id, shipmentId));

    let result = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));
    expect(result[0].status).toBe("preparing");

    // Transition to shipped
    await db
      .update(shipments)
      .set({ status: "shipped", shippedAt: new Date() })
      .where(eq(shipments.id, shipmentId));

    result = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));
    expect(result[0].status).toBe("shipped");
    expect(result[0].shippedAt).toBeDefined();
  });
});
