import { eq, and, lte, gte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, drops, dropProducts, orders, orderItems } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// 상품 관련 쿼리
// ============================================================================

/**
 * 모든 활성 상품 조회
 */
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(products).where(eq(products.status, "active"));
}

/**
 * 상품 ID로 상품 조회
 */
export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result[0];
}

/**
 * 카테고리별 상품 조회
 */
export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(products)
    .where(and(eq(products.status, "active"), eq(products.category, category)));
}

// ============================================================================
// Drop 관련 쿼리
// ============================================================================

/**
 * 현재 진행 중인 Drop 조회 (활성 상태)
 */
export async function getCurrentDrop() {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db
    .select()
    .from(drops)
    .where(
      and(
        eq(drops.status, "active"),
        lte(drops.startDate, now),
        gte(drops.endDate, now)
      )
    )
    .limit(1);

  return result[0];
}

/**
 * 다음 예정된 Drop 조회
 */
export async function getNextDrop() {
  const db = await getDb();
  if (!db) return undefined;

  const now = new Date();
  const result = await db
    .select()
    .from(drops)
    .where(and(eq(drops.status, "upcoming"), gte(drops.startDate, now)))
    .limit(1);

  return result[0];
}

/**
 * Drop ID로 Drop 조회
 */
export async function getDropById(dropId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(drops).where(eq(drops.id, dropId)).limit(1);
  return result[0];
}

/**
 * Drop에 포함된 상품 조회
 */
export async function getProductsByDropId(dropId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      dropProduct: dropProducts,
      product: products,
    })
    .from(dropProducts)
    .innerJoin(products, eq(dropProducts.productId, products.id))
    .where(eq(dropProducts.dropId, dropId));
}

/**
 * 모든 Drop 조회 (상태별)
 */
export async function getDropsByStatus(status: "upcoming" | "active" | "ended") {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(drops).where(eq(drops.status, status));
}


// ============================================================================
// 주문 관련 쿼리
// ============================================================================

/**
 * 주문 생성
 */
export async function createOrder(userId: number, totalAmount: number, orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(orders).values({
      userId,
      totalAmount,
      orderNumber,
      status: "pending",
    });

    return result[0]?.insertId || undefined;
  } catch (error) {
    console.error("[Orders] Error creating order:", error);
    throw error;
  }
}

/**
 * 주문 항목 추가
 */
export async function addOrderItem(
  orderId: number,
  productId: number,
  quantity: number,
  unitPrice: number,
  totalPrice: number
) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    await db.insert(orderItems).values({
      orderId,
      productId,
      quantity,
      unitPrice,
      totalPrice,
    });
    return true;
  } catch (error) {
    console.error("[OrderItems] Error adding order item:", error);
    throw error;
  }
}

/**
 * 주문 ID로 주문 조회
 */
export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Orders] Error fetching order:", error);
    return undefined;
  }
}

/**
 * 주문 항목 조회
 */
export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select({
        orderItem: orderItems,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  } catch (error) {
    console.error("[OrderItems] Error fetching order items:", error);
    return [];
  }
}

/**
 * 사용자의 모든 주문 조회
 */
export async function getUserOrders(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("[Orders] Error fetching user orders:", error);
    return [];
  }
}

/**
 * 사용자의 주문 개수 조회
 */
export async function getUserOrderCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: orders.id })
      .from(orders)
      .where(eq(orders.userId, userId));
    return result.length;
  } catch (error) {
    console.error("[Orders] Error counting user orders:", error);
    return 0;
  }
}

/**
 * 주문 상태 업데이트
 */
export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "paid" | "failed" | "cancelled"
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "paid") {
      updateData.paidAt = new Date();
    } else if (status === "cancelled") {
      updateData.cancelledAt = new Date();
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));
    return true;
  } catch (error) {
    console.error("[Orders] Error updating order status:", error);
    throw error;
  }
}

/**
 * 주문 취소
 */
export async function cancelOrder(orderId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // pending 상태의 주문만 취소 가능
    if (order.status !== "pending") {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    await updateOrderStatus(orderId, "cancelled");
    return true;
  } catch (error) {
    console.error("[Orders] Error cancelling order:", error);
    throw error;
  }
}
