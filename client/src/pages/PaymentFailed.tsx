import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/payment-failed/:orderId");
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

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
    <div className="min-h-screen flex items-center justify-center bg-white py-12">
      <div className="container max-w-md mx-auto px-4">
        <Card className="p-8 border-2 border-red-300">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold mb-2 text-center font-courier">
            PAYMENT FAILED
          </h1>
          <p className="text-gray-600 text-center mb-8">
            결제 처리 중 오류가 발생했습니다.
          </p>

          <div className="bg-red-50 border border-red-200 rounded p-4 mb-8">
            <p className="text-sm text-gray-600 mb-2">Order Number</p>
            <p className="font-mono font-bold text-red-600">Order #{orderId}</p>
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-sm text-gray-600">
              결제가 실패했습니다. 다음 중 하나의 이유일 수 있습니다:
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>카드 한도 초과</li>
              <li>카드 유효 기간 만료</li>
              <li>잘못된 카드 정보</li>
              <li>네트워크 오류</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setLocation(`/payment/${orderId}`)}
              className="w-full bg-black text-white hover:bg-gray-800 h-12 font-courier"
              size="lg"
            >
              다시 결제하기
            </Button>
            <Button
              onClick={() => setLocation("/cart")}
              variant="outline"
              className="w-full"
            >
              장바구니로 돌아가기
            </Button>
            <Button
              onClick={() => setLocation("/")}
              variant="ghost"
              className="w-full"
            >
              홈으로 돌아가기
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-gray-600 mb-2">문제가 계속되나요?</p>
            <p className="text-sm text-gray-600">
              고객 지원팀에 문의하세요: support@mni-acv.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
