import { eq, and, lte, gte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, drops, dropProducts, orders, orderItems, shipments } from "../drizzle/schema";
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

// ============================================================================
// 배송 정보 관련 쿼리
// ============================================================================

/**
 * 배송 정보 생성
 */
export async function createShipment(shipmentData: any) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(shipments).values(shipmentData);
    return result[0]?.insertId || undefined;
  } catch (error) {
    console.error("[Shipments] Error creating shipment:", error);
    throw error;
  }
}

/**
 * 주문 ID로 배송 정보 조회
 */
export async function getShipmentByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Shipments] Error fetching shipment:", error);
    return undefined;
  }
}

/**
 * 배송 정보 업데이트
 */
export async function updateShipment(
  orderId: number,
  updates: any
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(shipments).set(updates).where(eq(shipments.orderId, orderId));
    return true;
  } catch (error) {
    console.error("[Shipments] Error updating shipment:", error);
    throw error;
  }
}


// ============================================================================
// Drop 관리 관련 함수
// ============================================================================

/**
 * Drop 생성
 * @param data Drop 생성 데이터
 * @returns 생성된 Drop ID
 */
export async function createDrop(data: {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
}): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db.insert(drops).values({
      name: data.name,
      description: data.description || null,
      startDate: data.startDate,
      endDate: data.endDate,
      status: "upcoming",
    });
    return result[0]?.insertId;
  } catch (error) {
    console.error("[Drops] Error creating drop:", error);
    throw error;
  }
}

/**
 * Drop 수정
 * @param id Drop ID
 * @param data 수정할 데이터
 * @returns 수정된 Drop 정보
 */
export async function updateDrop(
  id: number,
  data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    status?: "upcoming" | "active" | "ended";
  }
): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;

    await db.update(drops).set(updateData).where(eq(drops.id, id));

    // 수정된 Drop 반환
    const result = await db.select().from(drops).where(eq(drops.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Drops] Error updating drop:", error);
    throw error;
  }
}

/**
 * Drop 삭제
 * @param id Drop ID
 * @returns 삭제 성공 여부
 */
export async function deleteDrop(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // 먼저 해당 Drop의 상태 확인
    const dropData = await db.select().from(drops).where(eq(drops.id, id)).limit(1);
    if (!dropData[0]) {
      throw new Error("Drop not found");
    }

    // 진행 중인 Drop은 삭제 불가
    if (dropData[0].status === "active") {
      throw new Error("Cannot delete an active drop");
    }

    // dropProducts 삭제 (CASCADE)
    await db.delete(dropProducts).where(eq(dropProducts.dropId, id));

    // Drop 삭제
    await db.delete(drops).where(eq(drops.id, id));

    return true;
  } catch (error) {
    console.error("[Drops] Error deleting drop:", error);
    throw error;
  }
}

/**
 * 모든 Drop 조회 (관리자용)
 * @param filters 필터 옵션
 * @returns Drop 목록과 총 개수
 */
export async function getAllDrops(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  try {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    // 모든 Drop 조회
    let allDrops: any[] = [];
    if (filters?.status) {
      allDrops = await db.select().from(drops).where(eq(drops.status, filters.status as any));
    } else {
      allDrops = await db.select().from(drops);
    }
    const total = allDrops.length;

    // 페이지네이션 적용
    const items = allDrops.slice(offset, offset + limit);

    return { items, total };
  } catch (error) {
    console.error("[Drops] Error fetching all drops:", error);
    throw error;
  }
}

/**
 * Drop 상태 자동 업데이트
 * 현재 시간에 따라 Drop 상태를 자동으로 업데이트
 * @returns 업데이트된 Drop 개수
 */
export async function updateDropStatusesAutomatically(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const now = new Date();
    let updatedCount = 0;

    // upcoming → active (startDate <= now < endDate)
    const allDropsForUpdate = await db.select().from(drops);
    
    // 조건: status = 'upcoming' AND startDate <= now AND endDate > now
    const activatingDropsFiltered = allDropsForUpdate.filter(d => 
      d.status === "upcoming" && d.startDate <= now && d.endDate > now
    );

    for (const drop of activatingDropsFiltered) {
      await db.update(drops).set({ status: "active" }).where(eq(drops.id, drop.id));
      updatedCount++;
    }

    // active → ended (now >= endDate)
    const endingDropsFiltered = allDropsForUpdate.filter(d => 
      d.status === "active" && d.endDate <= now
    );

    for (const drop of endingDropsFiltered) {
      await db.update(drops).set({ status: "ended" }).where(eq(drops.id, drop.id));
      updatedCount++;
    }

    return updatedCount;
  } catch (error) {
    console.error("[Drops] Error updating drop statuses:", error);
    return 0;
  }
}

/**
 * Drop에 상품 추가
 * @param data 상품 추가 데이터
 * @returns 추가된 DropProduct 정보
 */
export async function addProductToDrop(data: {
  dropId: number;
  productId: number;
  limitedQuantity: number;
}): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Drop과 Product 존재 확인
    const dropExists = await db.select().from(drops).where(eq(drops.id, data.dropId)).limit(1);
    if (!dropExists[0]) {
      throw new Error("Drop not found");
    }

    const productExists = await db.select().from(products).where(eq(products.id, data.productId)).limit(1);
    if (!productExists[0]) {
      throw new Error("Product not found");
    }

    // 이미 추가된 상품인지 확인
    const existing = await db
      .select()
      .from(dropProducts)
      .where(
        and(
          eq(dropProducts.dropId, data.dropId),
          eq(dropProducts.productId, data.productId)
        )
      )
      .limit(1);

    if (existing[0]) {
      throw new Error("Product already added to this drop");
    }

    // 상품 추가
    const result = await db.insert(dropProducts).values({
      dropId: data.dropId,
      productId: data.productId,
      limitedQuantity: data.limitedQuantity,
      soldQuantity: 0,
    });

    // 추가된 DropProduct 반환
    const insertedId = result[0]?.insertId;
    const inserted = await db.select().from(dropProducts).where(eq(dropProducts.id, insertedId)).limit(1);
    return inserted[0] || null;
  } catch (error) {
    console.error("[Drops] Error adding product to drop:", error);
    throw error;
  }
}

/**
 * Drop에서 상품 제거
 * @param dropId Drop ID
 * @param productId Product ID
 * @returns 제거 성공 여부
 */
export async function removeProductFromDrop(
  dropId: number,
  productId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // DropProduct 존재 확인
    const existing = await db
      .select()
      .from(dropProducts)
      .where(
        and(
          eq(dropProducts.dropId, dropId),
          eq(dropProducts.productId, productId)
        )
      )
      .limit(1);

    if (!existing[0]) {
      throw new Error("Product not found in this drop");
    }

    // 상품 제거
    await db
      .delete(dropProducts)
      .where(
        and(
          eq(dropProducts.dropId, dropId),
          eq(dropProducts.productId, productId)
        )
      );

    return true;
  } catch (error) {
    console.error("[Drops] Error removing product from drop:", error);
    throw error;
  }
}

/**
 * Drop 상품 한정 수량 수정
 * @param dropId Drop ID
 * @param productId Product ID
 * @param limitedQuantity 새로운 한정 수량
 * @returns 수정된 DropProduct 정보
 */
export async function updateDropProductQuantity(
  dropId: number,
  productId: number,
  limitedQuantity: number
): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // DropProduct 존재 확인
    const existing = await db
      .select()
      .from(dropProducts)
      .where(
        and(
          eq(dropProducts.dropId, dropId),
          eq(dropProducts.productId, productId)
        )
      )
      .limit(1);

    if (!existing[0]) {
      throw new Error("Product not found in this drop");
    }

    // limitedQuantity > soldQuantity 검증
    if (limitedQuantity < (existing[0].soldQuantity || 0)) {
      throw new Error("Limited quantity cannot be less than sold quantity");
    }

    // 수량 수정
    await db
      .update(dropProducts)
      .set({ limitedQuantity })
      .where(
        and(
          eq(dropProducts.dropId, dropId),
          eq(dropProducts.productId, productId)
        )
      );

    // 수정된 DropProduct 반환
    const updated = await db
      .select()
      .from(dropProducts)
      .where(
        and(
          eq(dropProducts.dropId, dropId),
          eq(dropProducts.productId, productId)
        )
      )
      .limit(1);

    return updated[0] || null;
  } catch (error) {
    console.error("[Drops] Error updating drop product quantity:", error);
    throw error;
  }
}

/**
 * Drop 판매 통계 조회
 * @param dropId Drop ID
 * @returns Drop 판매 통계
 */
export async function getDropStats(dropId: number): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Drop 정보 조회
    const dropData = await db.select().from(drops).where(eq(drops.id, dropId)).limit(1);
    if (!dropData[0]) {
      throw new Error("Drop not found");
    }

    // Drop 내 상품 조회
    const dropProductsList = await db
      .select({
        dropProduct: dropProducts,
        product: products,
      })
      .from(dropProducts)
      .innerJoin(products, eq(dropProducts.productId, products.id))
      .where(eq(dropProducts.dropId, dropId));

    // 통계 계산
    let totalSold = 0;
    let totalLimited = 0;

    const productStats = dropProductsList.map((item) => {
      const limitedQuantity = item.dropProduct.limitedQuantity || 0;
      const soldQuantity = item.dropProduct.soldQuantity || 0;
      const remainingQuantity = limitedQuantity - soldQuantity;
      const soldPercentage = limitedQuantity > 0 ? (soldQuantity / limitedQuantity) * 100 : 0;

      totalSold += soldQuantity;
      totalLimited += limitedQuantity;

      return {
        productId: item.product.id,
        productName: item.product.name,
        limitedQuantity,
        soldQuantity,
        remainingQuantity,
        soldPercentage: Math.round(soldPercentage * 100) / 100,
      };
    });

    const totalSoldPercentage = totalLimited > 0 ? (totalSold / totalLimited) * 100 : 0;

    return {
      dropId,
      dropName: dropData[0].name,
      totalProducts: dropProductsList.length,
      products: productStats,
      totalSold,
      totalLimited,
      soldPercentage: Math.round(totalSoldPercentage * 100) / 100,
    };
  } catch (error) {
    console.error("[Drops] Error fetching drop stats:", error);
    throw error;
  }
}
