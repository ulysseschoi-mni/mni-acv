import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getCurrentDrop, getNextDrop, getDropById, getProductsByDropId, getDropsByStatus } from "../db";

/**
 * Drop 관련 tRPC 라우터
 * 모든 프로시저는 공개(publicProcedure)로 설정
 */
export const dropsRouter = router({
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
});
