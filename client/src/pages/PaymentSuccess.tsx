import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment-success/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  useEffect(() => {
    if (orderId) {
      // 3초 후 자동으로 주문 완료 페이지로 이동
      const timer = setTimeout(() => {
        setLocation(`/order-complete/${orderId}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [orderId, setLocation]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <CheckCircle className="w-24 h-24 text-green-600 animate-bounce" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 font-courier">PAYMENT SUCCESS</h1>
        <p className="text-gray-600 mb-8">결제가 성공적으로 완료되었습니다.</p>
        <p className="text-sm text-gray-500 mb-8">
          주문 완료 페이지로 이동 중입니다...
        </p>
        <Button
          onClick={() => setLocation(`/order-complete/${orderId}`)}
          className="bg-black text-white hover:bg-gray-800 font-courier"
        >
          주문 상세 보기
        </Button>
      </div>
    </div>
  );
}
