import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Package, Truck, MapPin, Phone, User } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | null;
  orderedAt: Date;
  items: OrderItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Shipment {
  id: number;
  orderId: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail: string | null;
  postalCode: string | null;
  status: "pending" | "preparing" | "shipped" | "delivered" | "returned" | null;
  trackingNumber: string | null;
  shippingCompany: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingStatusSteps = [
  { key: "pending", label: "주문 접수", icon: Package },
  { key: "preparing", label: "배송 준비", icon: Package },
  { key: "shipped", label: "배송 중", icon: Truck },
  { key: "delivered", label: "배송 완료", icon: CheckCircle },
];

export default function OrderComplete() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/order-complete/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const { clearCart } = useCartStore();

  const getOrderQuery = trpc.orders.getById.useQuery(orderId || 0, {
    enabled: !!orderId,
  });

  const getShipmentQuery = trpc.orders.getShipment.useQuery(orderId || 0, {
    enabled: !!orderId,
  });

  useEffect(() => {
    if (getOrderQuery.data) {
      setOrder(getOrderQuery.data);
    }
  }, [getOrderQuery.data]);

  useEffect(() => {
    if (getShipmentQuery.data) {
      setShipment(getShipmentQuery.data);
    }
  }, [getShipmentQuery.data]);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

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

  if (getOrderQuery.isLoading || getShipmentQuery.isLoading) {
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

  const getShippingStatusIndex = () => {
    const statusMap: Record<string, number> = {
      pending: 0,
      preparing: 1,
      shipped: 2,
      delivered: 3,
    };
    return statusMap[shipment?.status || "pending"] || 0;
  };

  const currentStatusIndex = getShippingStatusIndex();

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* 주문 완료 헤더 */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2 font-courier">ORDER COMPLETE</h1>
          <p className="text-gray-600">주문이 성공적으로 완료되었습니다.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 주문 번호 및 기본 정보 */}
          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4 font-courier">ORDER INFORMATION</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Number</span>
                <span className="font-bold text-lg">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Date</span>
                <span className="font-medium">
                  {new Date(order.orderedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Status</span>
                <span
                  className={`font-bold px-3 py-1 rounded ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {order.status === "paid" ? "결제 완료" : "처리 중"}
                </span>
              </div>
            </div>
          </Card>

          {/* 주문 상품 목록 */}
          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4 font-courier">ORDER ITEMS</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center pb-4 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-bold">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        수량: {item.quantity}개 × ₩{item.unitPrice.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-bold text-lg">
                      ₩{item.totalPrice.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">상품 정보가 없습니다.</p>
              )}
              <div className="pt-4 border-t-2 border-black flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl">
                  ₩{order.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* 배송 정보 */}
          {shipment && (
            <Card className="p-6 border-2 border-black">
              <h2 className="text-xl font-bold mb-4 font-courier">SHIPPING INFORMATION</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">수령자</p>
                    <p className="font-bold">{shipment.recipientName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">연락처</p>
                    <p className="font-bold">{shipment.recipientPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">배송 주소</p>
                    <p className="font-bold">
                      [{shipment.postalCode}] {shipment.address}
                      {shipment.addressDetail && ` ${shipment.addressDetail}`}
                    </p>
                  </div>
                </div>
                {shipment.trackingNumber && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">추적 번호</p>
                    <p className="font-bold font-mono">{shipment.trackingNumber}</p>
                    {shipment.shippingCompany && (
                      <p className="text-sm text-gray-600 mt-1">
                        배송사: {shipment.shippingCompany}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 배송 상태 추적 */}
          {shipment && (
            <Card className="p-6 border-2 border-black">
              <h2 className="text-xl font-bold mb-6 font-courier">SHIPPING STATUS</h2>
              <div className="space-y-6">
                {/* 상태 진행 바 */}
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {ShippingStatusSteps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index <= currentStatusIndex;
                      return (
                        <div
                          key={step.key}
                          className="flex flex-col items-center flex-1"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                              isActive
                                ? "bg-black text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <p
                            className={`text-xs text-center font-bold ${
                              isActive ? "text-black" : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* 진행 바 */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{
                        width: `${(currentStatusIndex / (ShippingStatusSteps.length - 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* 현재 상태 설명 */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-gray-600 mb-1">현재 상태</p>
                  <p className="font-bold text-lg">
                    {ShippingStatusSteps[currentStatusIndex]?.label}
                  </p>
                  {shipment.shippedAt && (
                    <p className="text-sm text-gray-600 mt-2">
                      배송 시작: {new Date(shipment.shippedAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                  {shipment.deliveredAt && (
                    <p className="text-sm text-gray-600">
                      배송 완료: {new Date(shipment.deliveredAt).toLocaleDateString("ko-KR")}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-3">
            <Button
              onClick={() => setLocation("/")}
              className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg font-courier"
              size="lg"
            >
              계속 쇼핑하기
            </Button>
            <Button
              onClick={() => setLocation("/account/orders")}
              variant="outline"
              className="w-full"
            >
              주문 내역 보기
            </Button>
          </div>

          {/* 고객 지원 정보 */}
          <Card className="p-4 bg-gray-50 border border-gray-200">
            <h3 className="font-bold mb-2">고객 지원</h3>
            <p className="text-sm text-gray-600 mb-2">
              주문 관련 문의사항이 있으신가요?
            </p>
            <p className="text-sm text-gray-600">
              이메일: support@mni-acv.com | 전화: 1234-5678
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
