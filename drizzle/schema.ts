import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// 상품 및 Drop 관련 테이블
// ============================================================================

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: int("price").notNull(),
  imageUrl: varchar("imageUrl", { length: 255 }),
  category: varchar("category", { length: 50 }),
  stock: int("stock").default(0),
  status: mysqlEnum("status", ["active", "inactive", "discontinued"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const drops = mysqlTable("drops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "ended"]).default("upcoming"),
  bannerUrl: varchar("bannerUrl", { length: 255 }),
  isPinned: boolean("isPinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Drop = typeof drops.$inferSelect;
export type InsertDrop = typeof drops.$inferInsert;

export const dropProducts = mysqlTable("dropProducts", {
  id: int("id").autoincrement().primaryKey(),
  dropId: int("dropId").notNull(),
  productId: int("productId").notNull(),
  limitedQuantity: int("limitedQuantity"),
  soldQuantity: int("soldQuantity").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DropProduct = typeof dropProducts.$inferSelect;
export type InsertDropProduct = typeof dropProducts.$inferInsert;

// ============================================================================
// 주문 관련 테이블
// ============================================================================

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  totalAmount: int("totalAmount").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "cancelled"]).default("pending"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  paymentKey: varchar("paymentKey", { length: 255 }),
  orderedAt: timestamp("orderedAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  totalPrice: int("totalPrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  recipientName: varchar("recipientName", { length: 100 }).notNull(),
  recipientPhone: varchar("recipientPhone", { length: 20 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  addressDetail: varchar("addressDetail", { length: 255 }),
  postalCode: varchar("postalCode", { length: 10 }),
  status: mysqlEnum("status", ["pending", "preparing", "shipped", "delivered", "returned"]).default("pending"),
  trackingNumber: varchar("trackingNumber", { length: 50 }),
  shippingCompany: varchar("shippingCompany", { length: 50 }),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

// ============================================================================
// 멤버십 관련 테이블
// ============================================================================

export const membershipPlans = mysqlTable("membershipPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  monthlyPrice: int("monthlyPrice").notNull(),
  discountRate: decimal("discountRate", { precision: 5, scale: 2 }).default("0"),
  freeShipping: boolean("freeShipping").default(false),
  benefits: json("benefits"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type InsertMembershipPlan = typeof membershipPlans.$inferInsert;

export const userMemberships = mysqlTable("userMemberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "paused", "cancelled"]).default("active"),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  renewalDate: timestamp("renewalDate").notNull(),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserMembership = typeof userMemberships.$inferSelect;
export type InsertUserMembership = typeof userMemberships.$inferInsert;

export const membershipPayments = mysqlTable("membershipPayments", {
  id: int("id").autoincrement().primaryKey(),
  userMembershipId: int("userMembershipId").notNull(),
  amount: int("amount").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending"),
  paymentKey: varchar("paymentKey", { length: 255 }),
  paidAt: timestamp("paidAt"),
  failedAt: timestamp("failedAt"),
  failureReason: varchar("failureReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MembershipPayment = typeof membershipPayments.$inferSelect;
export type InsertMembershipPayment = typeof membershipPayments.$inferInsert;
