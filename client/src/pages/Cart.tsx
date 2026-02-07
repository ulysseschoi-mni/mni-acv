import { useCartStore } from "@/stores/cartStore";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const [, setLocation] = useLocation();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleRemoveItem = (productId: number) => {
    removeItem(productId);
    toast.success("Item removed from cart");
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setLocation("/checkout");
  };

  const handleContinueShopping = () => {
    setLocation("/");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 font-mono text-sm mb-8 hover:text-brand-periwinkle transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center py-20">
            <h1 className="font-marker text-4xl md:text-5xl mb-4">Your cart is empty</h1>
            <p className="font-mono text-gray-600 mb-8">Start shopping to add items to your cart</p>
            <Button
              onClick={handleContinueShopping}
              className="bg-black text-white font-mono font-bold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-all"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 font-mono text-sm mb-8 hover:text-brand-periwinkle transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="font-marker text-4xl md:text-5xl mb-8">Your Cart</h1>

        {/* Cart items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div
              key={item.productId}
              className="border-2 border-black p-4 flex items-center justify-between gap-4 hover:shadow-brutal transition-all"
            >
              <div className="flex-1">
                <h3 className="font-marker text-lg mb-2">{item.productName}</h3>
                <p className="font-mono text-sm text-gray-600">
                  ${(item.price / 1000).toFixed(2)} × {item.quantity} = $
                  {((item.price * item.quantity) / 1000).toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 border border-black font-mono font-bold hover:bg-black hover:text-white transition-all text-sm"
                  >
                    −
                  </button>
                  <span className="font-mono font-bold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 border border-black font-mono font-bold hover:bg-black hover:text-white transition-all text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  className="p-2 hover:bg-red-100 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart summary */}
        <div className="border-2 border-black p-6 mb-8 bg-brand-periwinkle/10">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between font-mono">
              <span>Subtotal ({totalItems} items)</span>
              <span className="font-bold">${(totalPrice / 1000).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono text-sm text-gray-600">
              <span>Shipping</span>
              <span>TBD</span>
            </div>
            <div className="flex justify-between font-mono text-sm text-gray-600">
              <span>Tax</span>
              <span>TBD</span>
            </div>
            <div className="border-t border-black pt-3 flex justify-between font-mono">
              <span className="font-bold">Total</span>
              <span className="font-bold text-xl">${(totalPrice / 1000).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleCheckout}
              className="flex-1 bg-black text-white font-mono font-bold py-4 border-2 border-black hover:bg-white hover:text-black transition-all"
            >
              Proceed to Checkout
            </Button>
            <Button
              onClick={() => {
                clearCart();
                toast.success("Cart cleared");
              }}
              className="flex-1 bg-white text-black font-mono font-bold py-4 border-2 border-black hover:bg-black hover:text-white transition-all"
            >
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Continue shopping */}
        <button
          onClick={handleContinueShopping}
          className="w-full font-mono text-sm font-bold py-3 border-2 border-black hover:bg-black hover:text-white transition-all"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
