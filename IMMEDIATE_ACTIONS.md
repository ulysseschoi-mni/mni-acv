# MNI ACV - 즉시 시작 가능한 개발 작업

## 📌 이 문서의 목적

사업자등록증, 세무사/법무사 상담을 준비하는 **오늘부터 시작할 수 있는** 개발 작업 목록입니다.
결제 시스템 가입 전에 완료할 수 있으며, 결제 연동 시 즉시 활용 가능합니다.

---

## 🚀 오늘 시작할 수 있는 작업 (우선순위순)

### 1️⃣ 데이터베이스 마이그레이션 (1-2일)

#### 1.1 주문 관련 테이블 생성
```sql
-- 주문 테이블
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  orderNumber VARCHAR(50) UNIQUE NOT NULL,
  totalAmount INT NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'cancelled') DEFAULT 'pending',
  paymentMethod VARCHAR(50),
  paymentKey VARCHAR(255),
  orderedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paidAt TIMESTAMP,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- 주문 상품 테이블
CREATE TABLE orderItems (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL,
  productId INT NOT NULL,
  quantity INT NOT NULL,
  unitPrice INT NOT NULL,
  totalPrice INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);

-- 배송 정보 테이블
CREATE TABLE shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  orderId INT NOT NULL UNIQUE,
  recipientName VARCHAR(100) NOT NULL,
  recipientPhone VARCHAR(20) NOT NULL,
  address VARCHAR(255) NOT NULL,
  addressDetail VARCHAR(255),
  postalCode VARCHAR(10),
  status ENUM('pending', 'preparing', 'shipped', 'delivered', 'returned') DEFAULT 'pending',
  trackingNumber VARCHAR(50),
  shippingCompany VARCHAR(50),
  shippedAt TIMESTAMP,
  deliveredAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
```

**실행 방법:**
```bash
# 1. 위 SQL을 복사
# 2. webdev_execute_sql 호출
# 3. Drizzle 스키마 업데이트
```

---

#### 1.2 상품 및 Drop 테이블 생성
```sql
-- 상품 테이블
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price INT NOT NULL,
  imageUrl VARCHAR(255),
  category VARCHAR(50),
  stock INT DEFAULT 0,
  status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop 테이블
CREATE TABLE drops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  status ENUM('upcoming', 'active', 'ended') DEFAULT 'upcoming',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop-Product 연결 테이블
CREATE TABLE dropProducts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dropId INT NOT NULL,
  productId INT NOT NULL,
  limitedQuantity INT,
  soldQuantity INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dropId) REFERENCES drops(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY (dropId, productId)
);

-- 초기 상품 데이터 삽입
INSERT INTO products (name, description, price, category, stock, status) VALUES
('TOILET PAPER TEE', 'Limited edition t-shirt from Archive #1', 80000, 'tee', 100, 'active'),
('STICK HOODIE', 'Cozy hoodie with unique design', 120000, 'hoodie', 50, 'active');

-- 현재 Drop 생성
INSERT INTO drops (name, description, startDate, endDate, status) VALUES
('Archive #1', 'The first collection of mni acv', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'active');

-- Drop에 상품 연결
INSERT INTO dropProducts (dropId, productId, limitedQuantity) VALUES
(1, 1, 100),
(1, 2, 50);
```

**실행 방법:**
```bash
# webdev_execute_sql로 실행
```

---

#### 1.3 멤버십 테이블 생성
```sql
-- 멤버십 플랜 테이블
CREATE TABLE membershipPlans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  monthlyPrice INT NOT NULL,
  discountRate DECIMAL(5, 2) DEFAULT 0,
  freeShipping BOOLEAN DEFAULT FALSE,
  benefits JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 멤버십 테이블
CREATE TABLE userMemberships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL UNIQUE,
  planId INT NOT NULL,
  subscriptionStatus ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  subscriptionId VARCHAR(255),
  startDate TIMESTAMP NOT NULL,
  renewalDate TIMESTAMP NOT NULL,
  cancelledAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (planId) REFERENCES membershipPlans(id)
);

-- 멤버십 결제 이력 테이블
CREATE TABLE membershipPayments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userMembershipId INT NOT NULL,
  amount INT NOT NULL,
  status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  paymentKey VARCHAR(255),
  paidAt TIMESTAMP,
  failedAt TIMESTAMP,
  failureReason VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userMembershipId) REFERENCES userMemberships(id) ON DELETE CASCADE
);

-- 멤버십 플랜 초기 데이터
INSERT INTO membershipPlans (name, monthlyPrice, discountRate, freeShipping, benefits) VALUES
('Free', 0, 0, FALSE, JSON_ARRAY('갤러리 열람', '뉴스레터 구독')),
('Member', 4900, 10, TRUE, JSON_ARRAY('Drop 사전 공개', '10% 할인', '배송료 무료')),
('VIP', 9900, 20, TRUE, JSON_ARRAY('모든 Member 혜택', '한정판 상품 조기 구매', '20% 할인'));
```

**실행 방법:**
```bash
# webdev_execute_sql로 실행
```

---

### 2️⃣ Drizzle ORM 스키마 업데이트 (1일)

#### 2.1 drizzle/schema.ts 업데이트
```typescript
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";

// 기존 users 테이블은 유지

// 상품 테이블
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

// 주문 테이블
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

// 주문 상품 테이블
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

// 배송 정보 테이블
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

// Drop 테이블
export const drops = mysqlTable("drops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "ended"]).default("upcoming"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Drop = typeof drops.$inferSelect;
export type InsertDrop = typeof drops.$inferInsert;

// Drop-Product 연결 테이블
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

// 멤버십 플랜 테이블
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

// 사용자 멤버십 테이블
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

// 멤버십 결제 이력 테이블
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
```

---

### 3️⃣ 기본 API 구현 (2-3일)

#### 3.1 상품 API (server/routers/products.ts)
```typescript
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { products, drops, dropProducts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const productsRouter = router({
  // 모든 활성 상품 조회
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select().from(products).where(eq(products.status, "active"));
  }),

  // 상품 상세 조회
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db.select().from(products).where(eq(products.id, input)).limit(1);
      return result[0] || null;
    }),

  // 현재 진행 중인 Drop 조회
  getCurrentDrop: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    
    const now = new Date();
    const result = await db
      .select()
      .from(drops)
      .where(
        and(
          eq(drops.status, "active"),
          // startDate <= now <= endDate 조건은 필터링으로 처리
        )
      )
      .limit(1);
    
    return result[0] || null;
  }),

  // 다음 Drop 정보 조회
  getNextDrop: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;
    
    const result = await db
      .select()
      .from(drops)
      .where(eq(drops.status, "upcoming"))
      .limit(1);
    
    return result[0] || null;
  }),
});
```

---

#### 3.2 주문 API (server/routers/orders.ts)
```typescript
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { orders, orderItems, shipments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const ordersRouter = router({
  // 주문 생성
  create: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        unitPrice: z.number(),
      })),
      shipmentInfo: z.object({
        recipientName: z.string(),
        recipientPhone: z.string(),
        address: z.string(),
        addressDetail: z.string().optional(),
        postalCode: z.string(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 총액 계산
      const totalAmount = input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

      // 주문번호 생성 (MNI-YYYYMMDD-XXX)
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const orderNumber = `MNI-${dateStr}-${Math.random().toString().slice(2, 5)}`;

      // 주문 생성
      const [orderResult] = await db.insert(orders).values({
        userId: ctx.user.id,
        orderNumber,
        totalAmount,
        status: "pending",
      });

      const orderId = orderResult.insertId;

      // 주문 상품 추가
      for (const item of input.items) {
        await db.insert(orderItems).values({
          orderId: orderId as number,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        });
      }

      // 배송 정보 저장
      await db.insert(shipments).values({
        orderId: orderId as number,
        recipientName: input.shipmentInfo.recipientName,
        recipientPhone: input.shipmentInfo.recipientPhone,
        address: input.shipmentInfo.address,
        addressDetail: input.shipmentInfo.addressDetail,
        postalCode: input.shipmentInfo.postalCode,
        status: "pending",
      });

      return {
        orderId,
        orderNumber,
        totalAmount,
        status: "pending",
      };
    }),

  // 주문 조회
  getById: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(orders).where(eq(orders.id, input)).limit(1);
      const order = result[0];

      // 사용자 본인의 주문만 조회 가능
      if (order && order.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return order || null;
    }),

  // 사용자 주문 목록
  listByUser: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return await db.select().from(orders).where(eq(orders.userId, ctx.user.id));
  }),
});
```

---

#### 3.3 멤버십 API (server/routers/memberships.ts)
```typescript
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { membershipPlans, userMemberships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const membershipsRouter = router({
  // 멤버십 플랜 목록
  listPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return await db.select().from(membershipPlans);
  }),

  // 사용자 현재 멤버십
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, ctx.user.id))
      .limit(1);

    return result[0] || null;
  }),

  // 멤버십 구독 (결제 연동 후 활성화)
  subscribe: protectedProcedure
    .input(z.number()) // planId
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      // 기존 멤버십이 있으면 업데이트, 없으면 생성
      const existing = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userMemberships)
          .set({
            planId: input,
            subscriptionStatus: "active",
            startDate: now,
            renewalDate,
          })
          .where(eq(userMemberships.userId, ctx.user.id));
      } else {
        await db.insert(userMemberships).values({
          userId: ctx.user.id,
          planId: input,
          subscriptionStatus: "active",
          startDate: now,
          renewalDate,
        });
      }

      return { success: true };
    }),
});
```

---

### 4️⃣ 프론트엔드 페이지 기초 (2-3일)

#### 4.1 상품 상세 페이지 (client/src/pages/ProductDetail.tsx)
```typescript
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  
  const { data: product, isLoading } = trpc.products.getById.useQuery(Number(id));

  if (isLoading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 이미지 */}
        <div className="bg-gray-100 aspect-square rounded-lg overflow-hidden">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* 상품 정보 */}
        <div>
          <h1 className="font-marker text-4xl mb-4">{product.name}</h1>
          <p className="font-mono text-2xl font-bold mb-4">₩{product.price.toLocaleString()}</p>
          <p className="font-mono text-gray-600 mb-8">{product.description}</p>

          {/* 수량 선택 */}
          <div className="flex items-center gap-4 mb-8">
            <label className="font-mono font-bold">수량:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="border-2 border-black p-2 w-20 font-mono"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button className="flex-1 bg-black text-white font-mono font-bold py-4 border-2 border-black hover:bg-white hover:text-black transition-all">
              장바구니 추가
            </button>
            <button className="flex-1 bg-brand-periwinkle font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all">
              바로 구매
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### 4.2 주문 이력 페이지 (client/src/pages/Orders.tsx)
```typescript
import { trpc } from "@/lib/trpc";

export default function Orders() {
  const { data: orders, isLoading } = trpc.orders.listByUser.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-marker text-4xl mb-8">주문 이력</h1>

        {!orders || orders.length === 0 ? (
          <p className="font-mono text-gray-600">주문 이력이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border-2 border-black p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold">{order.orderNumber}</p>
                    <p className="font-mono text-sm text-gray-600">
                      {new Date(order.orderedAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">₩{order.totalAmount.toLocaleString()}</p>
                    <p className="font-mono text-sm">{order.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 5️⃣ 테스트 작성 (1-2일)

#### 5.1 주문 API 테스트 (server/routers/orders.test.ts)
```typescript
import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Orders Router", () => {
  it("should create an order", async () => {
    // 테스트 구현
  });

  it("should retrieve user orders", async () => {
    // 테스트 구현
  });

  it("should prevent unauthorized access", async () => {
    // 테스트 구현
  });
});
```

---

## ✅ 체크리스트

### 이번 주 (Week 1)
- [ ] 데이터베이스 테이블 생성 (orders, products, memberships)
- [ ] 초기 상품 데이터 입력
- [ ] Drizzle 스키마 업데이트
- [ ] 기본 API 구현 (products, orders, memberships)

### 다음 주 (Week 2)
- [ ] 상품 상세 페이지 UI
- [ ] 주문 이력 페이지 UI
- [ ] 멤버십 페이지 UI
- [ ] 장바구니 상태 관리

### 3주차 (Week 3)
- [ ] 결제 페이지 UI (토스페이먼츠 위젯 통합 전)
- [ ] 관리자 대시보드 기초
- [ ] 테스트 작성

---

## 🎯 다음 단계

이 모든 작업이 완료되면:

1. **토스페이먼츠 가입** (사업자등록증 필요)
2. **결제 API 연동** (2-3일)
3. **Webhook 처리** (1-2일)
4. **라이브 테스트** (1주일)
5. **공식 출시** 🚀

---

## 📞 필요한 도움

각 단계별로 다음이 필요합니다:

- [ ] 데이터베이스 마이그레이션 실행
- [ ] API 구현 검토
- [ ] UI/UX 디자인 검토
- [ ] 테스트 작성 가이드

준비되면 알려주세요!
