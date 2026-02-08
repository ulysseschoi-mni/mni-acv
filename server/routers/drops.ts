import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getCurrentDrop, getNextDrop, getDropById, getProductsByDropId, getDropsByStatus, createDrop, updateDrop, deleteDrop, getAllDrops, addProductToDrop, removeProductFromDrop, updateDropProductQuantity, getDropStats } from "../db";

/**
 * Drop 관련 tRPC 라우터
 * 공개 프로시저는 publicProcedure, 관리 기능은 protectedProcedure + adminProcedure
 */

// ============================================================================
// Zod 스키마 정의
// ============================================================================

const CreateDropSchema = z.object({
  name: z.string().min(1, "Drop 이름은 필수입니다").max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate < data.endDate, {
  message: "startDate는 endDate보다 이른 시간이어야 합니다",
  path: ["endDate"],
});

const UpdateDropSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.enum(["upcoming", "active", "ended"]).optional(),
  isPinned: z.boolean().optional(),
  bannerUrl: z.string().optional(),
});

const GetAllDropsSchema = z.object({
  status: z.enum(["upcoming", "active", "ended"]).optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
});

const AddProductToDropSchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
  limitedQuantity: z.number().int().positive(),
});

const RemoveProductFromDropSchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
});

const UpdateProductQuantitySchema = z.object({
  dropId: z.number().int().positive(),
  productId: z.number().int().positive(),
  limitedQuantity: z.number().int().positive(),
});

export const dropsRouter = router({
  // ========================================================================
  // 공개 프로시저 (publicProcedure)
  // ========================================================================

  /**
   * 현재 진행 중인 Drop 조회
   * @returns 현재 활성 Drop 정보 또는 null
   */
  getCurrent: publicProcedure.query(async () => {
    return await getCurrentDrop();
  }),

  /**
   * 다음 예정된 Drop 조회
   * @returns 다음 예정된 Drop 정보 또는 null
   */
  getNext: publicProcedure.query(async () => {
    return await getNextDrop();
  }),

  /**
   * Drop ID로 Drop 상세 조회
   * @param id - Drop ID
   * @returns Drop 정보 또는 null
   */
  getById: publicProcedure
    .input(z.number().int().positive("Drop ID는 양수여야 합니다"))
    .query(async ({ input }) => {
      return await getDropById(input);
    }),

  /**
   * Drop에 포함된 상품 조회
   * @param dropId - Drop ID
   * @returns Drop에 포함된 상품 배열 (한정 수량, 판매량 포함)
   */
  getProducts: publicProcedure
    .input(z.number().int().positive("Drop ID는 양수여야 합니다"))
    .query(async ({ input }) => {
      const products = await getProductsByDropId(input);
      return products.map((item) => ({
        ...item.product,
        limitedQuantity: item.dropProduct.limitedQuantity,
        soldQuantity: item.dropProduct.soldQuantity,
        remainingQuantity: (item.dropProduct.limitedQuantity ?? 0) - (item.dropProduct.soldQuantity ?? 0),
      }));
    }),

  /**
   * 상태별 Drop 조회
   * @param status - Drop 상태 (upcoming, active, ended)
   * @returns 해당 상태의 Drop 배열
   */
  getByStatus: publicProcedure
    .input(z.enum(["upcoming", "active", "ended"]))
    .query(async ({ input }) => {
      return await getDropsByStatus(input);
    }),

  /**
   * 현재 Drop의 카운트다운 정보 조회
   * @returns 현재 Drop의 종료 시간 및 남은 시간 정보
   */
  getCurrentCountdown: publicProcedure.query(async () => {
    const currentDrop = await getCurrentDrop();
    if (!currentDrop) {
      return null;
    }

    const now = new Date();
    const endTime = new Date(currentDrop.endDate);
    const remainingMs = endTime.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return {
        dropId: currentDrop.id,
        dropName: currentDrop.name,
        endTime: currentDrop.endDate,
        remainingMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: true,
      };
    }

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return {
      dropId: currentDrop.id,
      dropName: currentDrop.name,
      endTime: currentDrop.endDate,
      remainingMs,
      days,
      hours,
      minutes,
      seconds,
      isEnded: false,
    };
  }),

  // ========================================================================
  // 관리자 전용 프로시저 (protectedProcedure + admin 역할 검증)
  // ========================================================================

  /**
   * Drop 생성 (adminProcedure)
   */
  create: protectedProcedure
    .input(CreateDropSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 Drop을 생성할 수 있습니다" });
      }

      try {
        const dropId = await createDrop(input);
        if (!dropId) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Drop 생성에 실패했습니다" });
        }
        return { id: dropId, ...input, status: "upcoming" };
      } catch (error) {
        console.error("[Drops] Error creating drop:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Drop 생성 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop 수정 (adminProcedure)
   */
  update: protectedProcedure
    .input(UpdateDropSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 Drop을 수정할 수 있습니다" });
      }

      try {
        const result = await updateDrop(input.id, input);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Drop을 찾을 수 없습니다" });
        }
        return result;
      } catch (error: any) {
        if (error.code) throw error;
        console.error("[Drops] Error updating drop:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Drop 수정 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop 삭제 (adminProcedure)
   */
  delete: protectedProcedure
    .input(z.number().int().positive())
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 Drop을 삭제할 수 있습니다" });
      }

      try {
        const success = await deleteDrop(input);
        return { success, message: "Drop이 삭제되었습니다" };
      } catch (error: any) {
        if (error.message.includes("active")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "진행 중인 Drop은 삭제할 수 없습니다" });
        }
        console.error("[Drops] Error deleting drop:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Drop 삭제 중 오류가 발생했습니다" });
      }
    }),

  /**
   * 모든 Drop 조회 (관리자용)
   */
  getAll: protectedProcedure
    .input(GetAllDropsSchema.optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 모든 Drop을 조회할 수 있습니다" });
      }

      try {
        return await getAllDrops(input);
      } catch (error) {
        console.error("[Drops] Error fetching all drops:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Drop 조회 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop에 상품 추가 (adminProcedure)
   */
  addProduct: protectedProcedure
    .input(AddProductToDropSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 상품을 Drop에 추가할 수 있습니다" });
      }

      try {
        const result = await addProductToDrop(input);
        if (!result) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "상품 추가에 실패했습니다" });
        }
        return result;
      } catch (error: any) {
        if (error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error.message.includes("already added")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "이미 추가된 상품입니다" });
        }
        console.error("[Drops] Error adding product:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "상품 추가 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop에서 상품 제거 (adminProcedure)
   */
  removeProduct: protectedProcedure
    .input(RemoveProductFromDropSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 상품을 Drop에서 제거할 수 있습니다" });
      }

      try {
        const success = await removeProductFromDrop(input.dropId, input.productId);
        return { success, message: "상품이 제거되었습니다" };
      } catch (error: any) {
        if (error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        console.error("[Drops] Error removing product:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "상품 제거 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop 상품 한정 수량 수정 (adminProcedure)
   */
  updateProductQuantity: protectedProcedure
    .input(UpdateProductQuantitySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 수량을 수정할 수 있습니다" });
      }

      try {
        const result = await updateDropProductQuantity(input.dropId, input.productId, input.limitedQuantity);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "상품을 찾을 수 없습니다" });
        }
        return result;
      } catch (error: any) {
        if (error.message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message: error.message });
        }
        if (error.message.includes("cannot be less")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "한정 수량은 판매 수량보다 작을 수 없습니다" });
        }
        console.error("[Drops] Error updating quantity:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "수량 수정 중 오류가 발생했습니다" });
      }
    }),

  /**
   * Drop 판매 통계 (adminProcedure)
   */
  getStats: protectedProcedure
    .input(z.number().int().positive())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "관리자만 통계를 조회할 수 있습니다" });
      }

      try {
        const result = await getDropStats(input);
        if (!result) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Drop을 찾을 수 없습니다" });
        }
        return result;
      } catch (error) {
        console.error("[Drops] Error fetching stats:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "통계 조회 중 오류가 발생했습니다" });
      }
    }),

  togglePin: protectedProcedure
    .input(z.object({
      dropId: z.number().int().positive(),
      isPinned: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can pin drops" });
      }

      try {
        const drop = await getDropById(input.dropId);
        if (!drop) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Drop not found" });
        }

        const result = await updateDrop(input.dropId, { isPinned: input.isPinned });
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Drops] Error toggling pin:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to toggle pin status" });
      }
    }),
});
