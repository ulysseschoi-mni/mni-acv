import { useState } from "react";
import { useLocation } from "wouter";
import { useCartStore } from "@/stores/cartStore";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface ShippingInfo {
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail: string;
  postalCode: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    recipientName: "",
    recipientPhone: "",
    address: "",
    addressDetail: "",
    postalCode: "",
  });

  const createOrderMutation = trpc.orders.create.useMutation();



  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">장바구니가 비어있습니다</h1>
          <p className="text-gray-600 mb-6">상품을 추가한 후 결제를 진행해주세요.</p>
          <Button onClick={() => setLocation("/")} className="w-full">
            쇼핑 계속하기
          </Button>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateShippingInfo = (): boolean => {
    if (!shippingInfo.recipientName.trim()) {
      toast.error("수령자명을 입력해주세요.");
      return false;
    }
    if (!shippingInfo.recipientPhone.trim()) {
      toast.error("연락처를 입력해주세요.");
      return false;
    }
    if (!shippingInfo.address.trim()) {
      toast.error("주소를 입력해주세요.");
      return false;
    }
    if (!shippingInfo.postalCode.trim()) {
      toast.error("우편번호를 입력해주세요.");
      return false;
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateShippingInfo()) {
      return;
    }

    setIsLoading(true);

    try {
      // 주문 생성
      const order = await createOrderMutation.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      // 배송 정보를 sessionStorage에 저장 (결제 후 사용)
      sessionStorage.setItem(
        "checkoutData",
        JSON.stringify({
          orderId: order.orderId,
          shippingInfo,
        })
      );

      // 결제 페이지로 이동
      setLocation(`/payment/${order.orderId}`);
    } catch (error: any) {
      toast.error(error.message || "주문 생성에 실패했습니다.");
      setIsLoading(false);
    }
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 font-courier">CHECKOUT</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 배송 정보 폼 */}
          <div className="md:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 font-courier">SHIPPING INFORMATION</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">수령자명</label>
                  <Input
                    type="text"
                    name="recipientName"
                    value={shippingInfo.recipientName}
                    onChange={handleInputChange}
                    placeholder="이름을 입력해주세요"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">연락처</label>
                  <Input
                    type="tel"
                    name="recipientPhone"
                    value={shippingInfo.recipientPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">우편번호</label>
                  <Input
                    type="text"
                    name="postalCode"
                    value={shippingInfo.postalCode}
                    onChange={handleInputChange}
                    placeholder="12345"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">주소</label>
                  <Input
                    type="text"
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    placeholder="도로명 주소를 입력해주세요"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">상세주소</label>
                  <Input
                    type="text"
                    name="addressDetail"
                    value={shippingInfo.addressDetail}
                    onChange={handleInputChange}
                    placeholder="아파트, 호수 등 (선택사항)"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* 주문 요약 */}
          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 font-courier">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6 border-b pb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-gray-500">수량: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₩{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">소계</span>
                  <span className="font-medium">₩{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">배송비</span>
                  <span className="font-medium">무료</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>총액</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handleProceedToPayment}
                disabled={isLoading}
                className="w-full bg-black text-white hover:bg-gray-800"
                size="lg"
              >
                {isLoading ? "처리 중..." : "결제 진행"}
              </Button>

              <Button
                onClick={() => setLocation("/cart")}
                variant="outline"
                className="w-full mt-2"
                disabled={isLoading}
              >
                장바구니로 돌아가기
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
