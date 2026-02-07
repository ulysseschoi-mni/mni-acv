import { eq, and, lte, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, drops, dropProducts } from "../drizzle/schema";
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
