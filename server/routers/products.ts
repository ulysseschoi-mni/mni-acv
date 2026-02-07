import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getAllProducts, getProductById, getProductsByCategory } from "../db";

/**
 * 상품 관련 tRPC 라우터
 * 모든 프로시저는 공개(publicProcedure)로 설정
 */
export const productsRouter = router({
  /**
   * 모든 활성 상품 조회
   * @returns 활성 상태의 모든 상품 배열
   */
  list: publicProcedure.query(async () => {
    return await getAllProducts();
  }),

  /**
   * 상품 ID로 상품 상세 조회
   * @param id - 상품 ID
   * @returns 상품 정보 또는 null
   */
  getById: publicProcedure
    .input(z.number().int().positive("상품 ID는 양수여야 합니다"))
    .query(async ({ input }) => {
      return await getProductById(input);
    }),

  /**
   * 카테고리별 상품 조회
   * @param category - 상품 카테고리 (예: tee, hoodie)
   * @returns 해당 카테고리의 활성 상품 배열
   */
  getByCategory: publicProcedure
    .input(z.string().min(1, "카테고리는 필수입니다"))
    .query(async ({ input }) => {
      return await getProductsByCategory(input);
    }),
});
