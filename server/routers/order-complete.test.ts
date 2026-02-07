import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { orders, users, products, orderItems, shipments } from "../../drizzle/schema";

describe("Order Complete Flow", () => {
  let db: any;
  let testUserId: number;
  let testProductId: number;
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
        openId: `test-user-complete-${Date.now()}-${Math.random()}`,
        name: "Test User",
        email: `test-complete-${Date.now()}@example.com`,
        role: "user",
      });
    testUserId = userResult[0]?.insertId || 1;

    // Create test product
    const productResult = await db
      .insert(products)
      .values({
        name: "Test Product",
        description: "Test Description",
        price: 50000,
        category: "clothing",
        stock: 100,
      });
    testProductId = productResult[0]?.insertId || 1;

    // Create test order
    const orderResult = await db
      .insert(orders)
      .values({
        userId: testUserId,
        orderNumber: `ORD-complete-${Date.now()}`,
        totalAmount: 50000,
        status: "paid",
      });
    testOrderId = orderResult[0]?.insertId || 1;

    // Add order item
    await db
      .insert(orderItems)
      .values({
        orderId: testOrderId,
        productId: testProductId,
        quantity: 1,
        unitPrice: 50000,
        totalPrice: 50000,
      });
  });

  afterAll(async () => {
    if (db) {
      await db.delete(orderItems).where(true);
      await db.delete(shipments).where(true);
      await db.delete(orders).where(true);
      await db.delete(products).where(true);
      await db.delete(users).where(true);
    }
  });

  it("should retrieve complete order with items", async () => {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId));

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("paid");
    expect(result[0].totalAmount).toBe(50000);
  });

  it("should retrieve order items", async () => {
    const result = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, testOrderId));

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
    expect(result[0].unitPrice).toBe(50000);
  });

  it("should create shipment for completed order", async () => {
    const shipmentResult = await db
      .insert(shipments)
      .values({
        orderId: testOrderId,
        recipientName: "John Doe",
        recipientPhone: "010-1234-5678",
        address: "123 Main Street",
        addressDetail: "Apt 101",
        postalCode: "12345",
        status: "pending",
      });

    expect(shipmentResult[0]?.insertId).toBeDefined();

    // Verify shipment was created
    const shipment = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, testOrderId));

    expect(shipment).toHaveLength(1);
    expect(shipment[0].status).toBe("pending");
  });

  it("should update shipment status to preparing", async () => {
    // Create shipment first
    const shipmentResult = await db
      .insert(shipments)
      .values({
        orderId: testOrderId,
        recipientName: "Jane Smith",
        recipientPhone: "010-9876-5432",
        address: "456 Oak Avenue",
        postalCode: "54321",
        status: "pending",
      });

    const shipmentId = shipmentResult[0]?.insertId;

    // Update to preparing
    await db
      .update(shipments)
      .set({ status: "preparing" })
      .where(eq(shipments.id, shipmentId));

    const updated = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    expect(updated[0].status).toBe("preparing");
  });

  it("should update shipment with tracking number", async () => {
    // Create shipment
    const shipmentResult = await db
      .insert(shipments)
      .values({
        orderId: testOrderId,
        recipientName: "Bob Wilson",
        recipientPhone: "010-5555-5555",
        address: "789 Pine Road",
        postalCode: "99999",
        status: "shipped",
      });

    const shipmentId = shipmentResult[0]?.insertId;

    // Add tracking info
    await db
      .update(shipments)
      .set({
        trackingNumber: "1234567890",
        shippingCompany: "CJ Logistics",
        shippedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId));

    const updated = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    expect(updated[0].trackingNumber).toBe("1234567890");
    expect(updated[0].shippingCompany).toBe("CJ Logistics");
    expect(updated[0].shippedAt).toBeDefined();
  });

  it("should mark shipment as delivered", async () => {
    // Create shipment
    const shipmentResult = await db
      .insert(shipments)
      .values({
        orderId: testOrderId,
        recipientName: "Alice Brown",
        recipientPhone: "010-7777-7777",
        address: "321 Elm Street",
        postalCode: "11111",
        status: "shipped",
      });

    const shipmentId = shipmentResult[0]?.insertId;

    // Mark as delivered
    await db
      .update(shipments)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId));

    const updated = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    expect(updated[0].status).toBe("delivered");
    expect(updated[0].deliveredAt).toBeDefined();
  });

  it("should retrieve complete order flow data", async () => {
    // Get order
    const orderData = await db
      .select()
      .from(orders)
      .where(eq(orders.id, testOrderId));

    expect(orderData).toHaveLength(1);

    // Get order items
    const itemsData = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, testOrderId));

    expect(itemsData.length).toBeGreaterThan(0);

    // Get shipment
    const shipmentData = await db
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, testOrderId));

    // Shipment may or may not exist, but if it does, verify structure
    if (shipmentData.length > 0) {
      expect(shipmentData[0].recipientName).toBeDefined();
      expect(shipmentData[0].address).toBeDefined();
    }
  });
});
