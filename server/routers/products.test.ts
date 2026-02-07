import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";

describe("Products Router", () => {
  it("should list all active products", async () => {
    const caller = appRouter.createCaller({});
    const products = await caller.products.list();

    // 초기 데이터로 2개의 상품이 있어야 함
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(2);

    // 상품 정보 검증
    const product = products[0];
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("status");
    expect(product.status).toBe("active");
  });

  it("should get product by ID", async () => {
    const caller = appRouter.createCaller({});

    // 먼저 상품 목록을 조회하여 ID 확인
    const products = await caller.products.list();
    expect(products.length).toBeGreaterThan(0);

    const productId = products[0].id;
    const product = await caller.products.getById(productId);

    expect(product).toBeDefined();
    expect(product?.id).toBe(productId);
    expect(product?.name).toBeDefined();
    expect(product?.price).toBeGreaterThan(0);
  });

  it("should return undefined for non-existent product", async () => {
    const caller = appRouter.createCaller({});
    const product = await caller.products.getById(99999);

    expect(product).toBeUndefined();
  });

  it("should get products by category", async () => {
    const caller = appRouter.createCaller({});
    const teeProducts = await caller.products.getByCategory("tee");

    expect(Array.isArray(teeProducts)).toBe(true);
    // TOILET PAPER TEE가 tee 카테고리에 있어야 함
    expect(teeProducts.length).toBeGreaterThan(0);
    expect(teeProducts.every((p) => p.category === "tee")).toBe(true);
  });

  it("should validate product ID input", async () => {
    const caller = appRouter.createCaller({});

    // 음수는 거부되어야 함
    try {
      await caller.products.getById(-1);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
