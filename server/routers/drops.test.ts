import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";

describe("Drops Router", () => {
  it("should get current drop", async () => {
    const caller = appRouter.createCaller({});
    const currentDrop = await caller.drops.getCurrent();

    // Archive #1이 현재 활성 상태여야 함
    expect(currentDrop).toBeDefined();
    expect(currentDrop?.name).toBe("Archive #1");
    expect(currentDrop?.status).toBe("active");
  });

  it("should get current countdown", async () => {
    const caller = appRouter.createCaller({});
    const countdown = await caller.drops.getCurrentCountdown();

    expect(countdown).toBeDefined();
    expect(countdown?.dropId).toBeDefined();
    expect(countdown?.dropName).toBe("Archive #1");
    expect(countdown?.days).toBeGreaterThanOrEqual(0);
    expect(countdown?.hours).toBeGreaterThanOrEqual(0);
    expect(countdown?.minutes).toBeGreaterThanOrEqual(0);
    expect(countdown?.seconds).toBeGreaterThanOrEqual(0);
    expect(countdown?.isEnded).toBe(false);
  });

  it("should get products in current drop", async () => {
    const caller = appRouter.createCaller({});
    const currentDrop = await caller.drops.getCurrent();

    if (!currentDrop) {
      expect.fail("Current drop should exist");
    }

    const products = await caller.drops.getProducts(currentDrop.id);

    expect(Array.isArray(products)).toBe(true);
    // Archive #1에는 2개의 상품이 있어야 함
    expect(products.length).toBe(2);

    // 상품 정보 검증
    const product = products[0];
    expect(product).toHaveProperty("id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("limitedQuantity");
    expect(product).toHaveProperty("soldQuantity");
    expect(product).toHaveProperty("remainingQuantity");
  });

  it("should get drop by ID", async () => {
    const caller = appRouter.createCaller({});
    const currentDrop = await caller.drops.getCurrent();

    if (!currentDrop) {
      expect.fail("Current drop should exist");
    }

    const drop = await caller.drops.getById(currentDrop.id);

    expect(drop).toBeDefined();
    expect(drop?.id).toBe(currentDrop.id);
    expect(drop?.name).toBe("Archive #1");
  });

  it("should return undefined for non-existent drop", async () => {
    const caller = appRouter.createCaller({});
    const drop = await caller.drops.getById(99999);

    expect(drop).toBeUndefined();
  });

  it("should get drops by status", async () => {
    const caller = appRouter.createCaller({});
    const activeDrops = await caller.drops.getByStatus("active");

    expect(Array.isArray(activeDrops)).toBe(true);
    expect(activeDrops.length).toBeGreaterThan(0);
    expect(activeDrops.every((d) => d.status === "active")).toBe(true);
  });

  it("should validate drop ID input", async () => {
    const caller = appRouter.createCaller({});

    // 음수는 거부되어야 함
    try {
      await caller.drops.getById(-1);
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should calculate remaining quantity correctly", async () => {
    const caller = appRouter.createCaller({});
    const currentDrop = await caller.drops.getCurrent();

    if (!currentDrop) {
      expect.fail("Current drop should exist");
    }

    const products = await caller.drops.getProducts(currentDrop.id);
    const product = products[0];

    // remainingQuantity = limitedQuantity - soldQuantity
    const expectedRemaining = (product.limitedQuantity ?? 0) - (product.soldQuantity ?? 0);
    expect(product.remainingQuantity).toBe(expectedRemaining);
  });
});
