import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);

  const productId = Number(id);
  const { data: product, isLoading, error } = trpc.products.getById.useQuery(productId);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-marker text-4xl mb-4">상품을 찾을 수 없습니다</h1>
          <p className="font-mono text-gray-600 mb-8">요청하신 상품이 존재하지 않습니다.</p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-black text-white font-mono font-bold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    toast.success(`${product.name} ${quantity}개를 장바구니에 추가했습니다!`);
  };

  const handleBuyNow = () => {
    toast.success(`${product.name} ${quantity}개를 구매합니다!`);
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 font-mono text-sm mb-8 hover:text-brand-periwinkle transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          뒤로가기
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* 상품 이미지 */}
          <div className="flex items-center justify-center">
            <div className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-black overflow-hidden flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 font-mono">이미지 없음</div>
              )}
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col justify-center">
            {/* 카테고리 */}
            {product.category && (
              <div className="mb-4">
                <span className="inline-block bg-brand-periwinkle text-black font-mono text-xs font-bold px-3 py-1 rounded border-2 border-black">
                  {product.category.toUpperCase()}
                </span>
              </div>
            )}

            {/* 상품명 */}
            <h1 className="font-marker text-5xl md:text-6xl mb-6 leading-tight">{product.name}</h1>

            {/* 가격 */}
            <div className="mb-8">
              <p className="font-mono text-gray-600 text-sm mb-2">가격</p>
              <p className="font-mono text-4xl font-bold">₩{product.price.toLocaleString()}</p>
            </div>

            {/* 설명 */}
            {product.description && (
              <div className="mb-8 pb-8 border-b-2 border-black">
                <p className="font-mono text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* 재고 상태 */}
            <div className="mb-8">
              <p className="font-mono text-sm mb-2">재고</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${(product.stock ?? 0) > 0 ? "bg-green-500" : "bg-red-500"}`} />
                <p className="font-mono font-bold">
                  {(product.stock ?? 0) > 0 ? `${product.stock}개 남음` : "품절"}
                </p>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="mb-8 pb-8 border-b-2 border-black">
              <label className="font-mono font-bold text-sm mb-3 block">수량 선택</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 border-2 border-black font-mono font-bold hover:bg-black hover:text-white transition-all"
                  disabled={(product.stock ?? 0) === 0}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock ?? 0}
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const stock = product.stock ?? 0;
                    if (val > 0 && val <= stock) {
                      setQuantity(val);
                    }
                  }}
                  className="w-16 h-12 border-2 border-black font-mono font-bold text-center"
                  disabled={(product.stock ?? 0) === 0}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock ?? 0, quantity + 1))}
                  className="w-12 h-12 border-2 border-black font-mono font-bold hover:bg-black hover:text-white transition-all"
                  disabled={(product.stock ?? 0) === 0}
                >
                  +
                </button>
              </div>
            </div>

            {/* 총액 */}
            <div className="mb-8">
              <p className="font-mono text-sm text-gray-600 mb-2">총액</p>
              <p className="font-mono text-3xl font-bold">₩{totalPrice.toLocaleString()}</p>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={(product.stock ?? 0) === 0}
                className="flex-1 bg-white text-black font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                장바구니
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0}
                className="flex-1 bg-brand-periwinkle text-black font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                바로 구매
              </Button>
            </div>

            {(product.stock ?? 0) === 0 && (
              <p className="font-mono text-sm text-red-600 mt-4 text-center">품절된 상품입니다</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
