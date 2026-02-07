import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ShippingInfo {
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail: string;
  postalCode: string;
}

const TOSS_CLIENT_KEY = "test_ck_docs_Utvx7r5KwNJx97y0W0k1xvNw";

export default function Payment() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const [isLoading, setIsLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [order, setOrder] = useState<any>(null);

  const getOrderQuery = trpc.orders.getById.useQuery(orderId || 0, {
    enabled: !!orderId,
  });

  const createShipmentMutation = trpc.orders.createShipment.useMutation();
  const { clearCart } = useCartStore();

  useEffect(() => {
    const checkoutData = sessionStorage.getItem("checkoutData");
    if (checkoutData) {
      try {
        const data = JSON.parse(checkoutData);
        setShippingInfo(data.shippingInfo);
      } catch (error) {
        console.error("Failed to parse checkout data:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (getOrderQuery.data) {
      setOrder(getOrderQuery.data);
    }
  }, [getOrderQuery.data]);

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">오류</h1>
          <p className="text-gray-600 mb-6">유효한 주문이 없습니다.</p>
          <Button onClick={() => setLocation("/")} className="w-full">
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  if (getOrderQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p>주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-6">주문 정보를 불러올 수 없습니다.</p>
          <Button onClick={() => setLocation("/")} className="w-full">
            홈으로 돌아가기
          </Button>
        </Card>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!shippingInfo) {
      toast.error("배송 정보를 찾을 수 없습니다.");
      return;
    }

    setIsLoading(true);

    try {
      await createShipmentMutation.mutateAsync({
        orderId: order.id,
        ...shippingInfo,
      });

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

      await tossPayments.requestPayment("CARD", {
        amount: order.totalAmount,
        orderId: order.orderNumber,
        orderName: `MNI ACV Order #${order.orderNumber}`,
        customerName: shippingInfo.recipientName,
        customerEmail: "customer@example.com",
        successUrl: `${window.location.origin}/payment-success/${order.id}`,
        failUrl: `${window.location.origin}/payment-failed/${order.id}`,
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      if (error.code === "USER_CANCELLED") {
        toast.info("결제가 취소되었습니다.");
      } else {
        toast.error(error.message || "결제 중 오류가 발생했습니다.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 font-courier">PAYMENT</h1>

        <div className="grid grid-cols-1 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 font-courier">ORDER INFORMATION</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">
                  {new Date(order.orderedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex justify-between pt-4 border-t">
                <span className="font-bold">Total Amount</span>
                <span className="font-bold text-lg">
                  ₩{order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {shippingInfo && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 font-courier">SHIPPING INFORMATION</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-medium">{shippingInfo.recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-medium">{shippingInfo.recipientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postal Code</span>
                  <span className="font-medium">{shippingInfo.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address</span>
                  <span className="font-medium text-right max-w-xs">
                    {shippingInfo.address} {shippingInfo.addressDetail}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg font-courier"
              size="lg"
            >
              {isLoading ? "처리 중..." : "결제하기"}
            </Button>
            <Button
              onClick={() => setLocation("/checkout")}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              배송 정보 수정
            </Button>
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-bold mb-2 text-sm">테스트 결제 정보</h3>
            <p className="text-xs text-gray-600 mb-2">
              이 결제는 테스트 모드입니다. 실제 결제가 진행되지 않습니다.
            </p>
            <p className="text-xs text-gray-600">
              테스트 카드: 4000 0000 0000 0002 (유효기간: 12/25, CVC: 123)
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
