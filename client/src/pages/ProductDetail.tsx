import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cartStore";

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
          <h1 className="font-marker text-4xl mb-4">Product Not Found</h1>
          <p className="font-mono text-gray-600 mb-8">The product you requested does not exist.</p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-black text-white font-mono font-bold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const addToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      image: product.imageUrl || undefined,
    });
    toast.success(`Added ${product.name} x${quantity} to cart!`);
  };

  const handleBuyNow = () => {
    toast.success(`Purchasing ${product.name} x${quantity}...`);
  };

  const totalPrice = product.price * quantity;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 font-mono text-sm mb-8 hover:text-brand-periwinkle transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
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
            {/* Category */}
            {product.category && (
              <div className="mb-4">
                <span className="inline-block bg-brand-periwinkle text-black font-mono text-xs font-bold px-3 py-1 rounded border-2 border-black">
                  {product.category.toUpperCase()}
                </span>
              </div>
            )}

            {/* Product name */}
            <h1 className="font-marker text-5xl md:text-6xl mb-6 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="mb-8">
              <p className="font-mono text-gray-600 text-sm mb-2">Price</p>
              <p className="font-mono text-4xl font-bold">${(product.price / 1000).toFixed(2)}</p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8 pb-8 border-b-2 border-black">
                <p className="font-mono text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Stock status */}
            <div className="mb-8">
              <p className="font-mono text-sm mb-2">Stock</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${(product.stock ?? 0) > 0 ? "bg-green-500" : "bg-red-500"}`} />
                <p className="font-mono font-bold">
                  {(product.stock ?? 0) > 0 ? `${product.stock} available` : "Out of stock"}
                </p>
              </div>
            </div>

            {/* Quantity selection */}
            <div className="mb-8 pb-8 border-b-2 border-black">
              <label className="font-mono font-bold text-sm mb-3 block">Quantity</label>
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

            {/* Total */}
            <div className="mb-8">
              <p className="font-mono text-sm text-gray-600 mb-2">Total</p>
              <p className="font-mono text-3xl font-bold">${(totalPrice / 1000).toFixed(2)}</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={(product.stock ?? 0) === 0}
                className="flex-1 bg-white text-black font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                disabled={(product.stock ?? 0) === 0}
                className="flex-1 bg-brand-periwinkle text-black font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </Button>
            </div>

            {(product.stock ?? 0) === 0 && (
              <p className="font-mono text-sm text-red-600 mt-4 text-center">Out of stock</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
