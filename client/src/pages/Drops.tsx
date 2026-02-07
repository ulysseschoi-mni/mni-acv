import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Drops() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { data: currentDrop, isLoading: dropLoading } = trpc.drops.getCurrent.useQuery();
  const { data: dropCountdown, isLoading: countdownLoading } = trpc.drops.getCurrentCountdown.useQuery();
  const { data: dropProducts, isLoading: productsLoading } = trpc.drops.getProducts.useQuery(
    currentDrop?.id ?? 0,
    { enabled: !!currentDrop }
  );

  // 카운트다운 업데이트
  useEffect(() => {
    if (!dropCountdown) return;

    const updateCountdown = () => {
      const now = new Date();
      const endTime = new Date(dropCountdown.endTime);
      const remainingMs = endTime.getTime() - now.getTime();

      if (remainingMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [dropCountdown]);

  const isLoading = dropLoading || countdownLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!currentDrop) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-marker text-5xl mb-4">No Active Drop</h1>
          <p className="font-mono text-gray-600 mb-8">Stay tuned for the next drop!</p>
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

        {/* Drop header */}
        <div className="mb-12">
          <h1 className="font-marker text-6xl md:text-7xl mb-4">{currentDrop.name}</h1>
          {currentDrop.description && (
            <p className="font-mono text-gray-700 text-lg max-w-2xl">{currentDrop.description}</p>
          )}
        </div>

        {/* Countdown */}
        <div className="mb-12 p-8 border-4 border-black bg-brand-periwinkle rounded-lg">
          <p className="font-mono text-sm font-bold mb-4 uppercase">Time Remaining</p>
          <div className="grid grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <div className="bg-white border-2 border-black rounded p-4 mb-2">
                <p className="font-marker text-5xl font-bold">{countdown.days}</p>
              </div>
              <p className="font-mono text-sm font-bold">Days</p>
            </div>
            <div className="text-center">
              <div className="bg-white border-2 border-black rounded p-4 mb-2">
                <p className="font-marker text-5xl font-bold">{String(countdown.hours).padStart(2, "0")}</p>
              </div>
              <p className="font-mono text-sm font-bold">Hours</p>
            </div>
            <div className="text-center">
              <div className="bg-white border-2 border-black rounded p-4 mb-2">
                <p className="font-marker text-5xl font-bold">{String(countdown.minutes).padStart(2, "0")}</p>
              </div>
              <p className="font-mono text-sm font-bold">Minutes</p>
            </div>
            <div className="text-center">
              <div className="bg-white border-2 border-black rounded p-4 mb-2">
                <p className="font-marker text-5xl font-bold">{String(countdown.seconds).padStart(2, "0")}</p>
              </div>
              <p className="font-mono text-sm font-bold">Seconds</p>
            </div>
          </div>
        </div>

        {/* Products list */}
        <div>
          <h2 className="font-marker text-4xl mb-8">Products in This Drop</h2>

          {!dropProducts || dropProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-mono text-gray-600">No products in this drop.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {dropProducts.map((product) => (
                <div key={product.id} className="border-2 border-black rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Product image */}
                  <div className="w-full aspect-square bg-gray-100 overflow-hidden flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 font-mono">No image</div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-6">
                    <h3 className="font-marker text-2xl mb-2">{product.name}</h3>

                    {/* Price */}
                    <div className="mb-4">
                      <p className="font-mono text-2xl font-bold">${(product.price / 1000).toFixed(2)}</p>
                    </div>

                    {/* Limited quantity info */}
                    <div className="mb-4 pb-4 border-b-2 border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-mono text-sm font-bold">Limited Stock</p>
                        <p className="font-mono text-sm font-bold">
                          {product.remainingQuantity}/{product.limitedQuantity}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 border border-black">
                        <div
                          className="bg-brand-periwinkle h-full rounded-full transition-all"
                          style={{
                            width: `${((product.limitedQuantity ?? 0) - (product.remainingQuantity ?? 0)) / ((product.limitedQuantity ?? 1) || 1) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setLocation(`/product/${product.id}`)}
                        className="flex-1 bg-white text-black font-mono font-bold py-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => {
                          if (product.remainingQuantity <= 0) {
                            toast.error("Out of stock");
                            return;
                          }
                          toast.success(`Added ${product.name} to cart!`);
                        }}
                        disabled={product.remainingQuantity <= 0}
                        className="flex-1 bg-brand-periwinkle text-black font-mono font-bold py-2 border-2 border-black hover:bg-black hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {product.remainingQuantity <= 0 ? "Sold Out" : "Buy"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
