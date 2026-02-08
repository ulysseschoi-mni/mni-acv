import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, ChevronLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDropDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const dropId = params?.id ? parseInt(params.id as string) : null;

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [limitedQuantity, setLimitedQuantity] = useState<string>("");
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // 관리자 권한 확인
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-marker text-5xl mb-4">Access Denied</h1>
          <p className="font-mono text-gray-600 mb-8">관리자만 접근할 수 있습니다.</p>
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

  if (!dropId) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-marker text-5xl mb-4">Not Found</h1>
          <p className="font-mono text-gray-600 mb-8">Drop을 찾을 수 없습니다.</p>
          <Button
            onClick={() => setLocation("/admin/drops")}
            className="bg-black text-white font-mono font-bold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            Back to Drops
          </Button>
        </div>
      </div>
    );
  }

  // Drop 조회
  const { data: drop, isLoading: dropLoading, refetch: refetchDrop } = trpc.drops.getById.useQuery(dropId);

  // Drop 상품 조회
  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = trpc.drops.getProducts.useQuery(dropId);

  // Drop 통계 조회
  const { data: stats, isLoading: statsLoading } = trpc.drops.getStats.useQuery(dropId);

  // 모든 상품 조회 (추가용)
  const { data: allProducts } = trpc.products.list.useQuery();

  // 상품 추가 뮤테이션
  const addProductMutation = trpc.drops.addProduct.useMutation({
    onSuccess: () => {
      toast.success("상품이 추가되었습니다");
      setSelectedProductId("");
      setLimitedQuantity("");
      refetchProducts();
      refetchDrop();
    },
    onError: (error) => {
      toast.error(error.message || "상품 추가에 실패했습니다");
    },
  });

  // 상품 제거 뮤테이션
  const removeProductMutation = trpc.drops.removeProduct.useMutation({
    onSuccess: () => {
      toast.success("상품이 제거되었습니다");
      refetchProducts();
      refetchDrop();
    },
    onError: (error) => {
      toast.error(error.message || "상품 제거에 실패했습니다");
    },
  });

  // 수량 수정 뮤테이션
  const updateQuantityMutation = trpc.drops.updateProductQuantity.useMutation({
    onSuccess: () => {
      toast.success("수량이 수정되었습니다");
      refetchProducts();
      refetchDrop();
    },
    onError: (error) => {
      toast.error(error.message || "수량 수정에 실패했습니다");
    },
  });

  const handleAddProduct = () => {
    if (!selectedProductId || !limitedQuantity) {
      toast.error("상품과 수량을 선택하세요");
      return;
    }

    setIsAddingProduct(true);
    addProductMutation.mutate({
      dropId,
      productId: parseInt(selectedProductId),
      limitedQuantity: parseInt(limitedQuantity),
    });
    setIsAddingProduct(false);
  };

  const handleRemoveProduct = (productId: number) => {
    if (confirm("정말로 이 상품을 제거하시겠습니까?")) {
      removeProductMutation.mutate({
        dropId,
        productId,
      });
    }
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error("수량은 0보다 커야 합니다");
      return;
    }

    updateQuantityMutation.mutate({
      dropId,
      productId,
      limitedQuantity: newQuantity,
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "ended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (dropLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-marker text-5xl mb-4">Not Found</h1>
          <p className="font-mono text-gray-600 mb-8">Drop을 찾을 수 없습니다.</p>
          <Button
            onClick={() => setLocation("/admin/drops")}
            className="bg-black text-white font-mono font-bold py-3 px-6 border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            Back to Drops
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/admin/drops")}
            className="flex items-center gap-2 font-mono text-sm mb-4 hover:text-brand-periwinkle transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-marker text-5xl md:text-6xl mb-2">{drop.name}</h1>
              <p className="font-mono text-gray-600">{drop.description}</p>
            </div>
            <span className={`inline-block px-4 py-2 rounded font-mono text-sm font-bold ${getStatusBadgeColor(drop.status)}`}>
              {drop.status === "upcoming" ? "예정" : drop.status === "active" ? "진행 중" : "종료"}
            </span>
          </div>
        </div>

        {/* Drop Info */}
        <Card className="p-6 border-2 border-black mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-mono text-xs text-gray-600 mb-1">시작 시간</p>
              <p className="font-mono font-bold">{formatDate(drop.startDate)}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-gray-600 mb-1">종료 시간</p>
              <p className="font-mono font-bold">{formatDate(drop.endDate)}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-gray-600 mb-1">상품 수</p>
              <p className="font-mono font-bold">{stats?.totalProducts || 0}개</p>
            </div>
            <div>
              <p className="font-mono text-xs text-gray-600 mb-1">판매율</p>
              <p className="font-mono font-bold">{stats?.soldPercentage || 0}%</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <h2 className="font-marker text-3xl mb-4">상품 관리</h2>

            {/* Add Product Form */}
            <Card className="p-6 border-2 border-black mb-6">
              <h3 className="font-mono font-bold mb-4">상품 추가</h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono font-bold mb-2">상품 선택</label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger className="border-2 border-black">
                      <SelectValue placeholder="상품을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts?.map((product: any) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-mono font-bold mb-2">한정 수량</label>
                  <Input
                    type="number"
                    min="1"
                    value={limitedQuantity}
                    onChange={(e) => setLimitedQuantity(e.target.value)}
                    placeholder="수량을 입력하세요"
                    className="border-2 border-black font-mono"
                  />
                </div>

                <Button
                  onClick={handleAddProduct}
                  disabled={isAddingProduct || addProductMutation.isPending}
                  className="w-full bg-black text-white font-mono font-bold py-2 border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  상품 추가
                </Button>
              </div>
            </Card>

            {/* Products List */}
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (products || []).length === 0 ? (
              <Card className="p-8 text-center border-2 border-black">
                <p className="font-mono text-gray-600">추가된 상품이 없습니다</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {(products || []).map((product: any) => (
                  <Card key={product.id} className="p-4 border-2 border-black">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-mono font-bold">{product.name}</p>
                        <p className="font-mono text-sm text-gray-600">
                          한정: {product.limitedQuantity} | 판매: {product.soldQuantity} | 남은 수량: {product.remainingQuantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={product.limitedQuantity}
                          onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value))}
                          className="w-20 border-2 border-black font-mono text-sm"
                        />
                        <Button
                          onClick={() => handleRemoveProduct(product.id)}
                          size="sm"
                          className="bg-red-100 text-red-800 font-mono font-bold border-2 border-red-800 hover:bg-red-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Statistics Section */}
          <div>
            <h2 className="font-marker text-3xl mb-4">판매 통계</h2>

            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <Card className="p-6 border-2 border-black">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="font-mono font-bold">전체 통계</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-mono text-xs text-gray-600 mb-1">총 상품 수</p>
                      <p className="font-mono font-bold text-2xl">{stats.totalProducts}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-600 mb-1">한정 수량</p>
                      <p className="font-mono font-bold text-2xl">{stats.totalLimited}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-600 mb-1">판매 수량</p>
                      <p className="font-mono font-bold text-2xl">{stats.totalSold}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-600 mb-1">판매율</p>
                      <p className="font-mono font-bold text-2xl">{stats.soldPercentage}%</p>
                    </div>
                  </div>
                </Card>

                {/* Product Stats */}
                {stats.products && stats.products.length > 0 && (
                  <Card className="p-6 border-2 border-black">
                    <h3 className="font-mono font-bold mb-4">상품별 통계</h3>
                    <div className="space-y-3">
                      {stats.products.map((p: any) => (
                        <div key={p.productId} className="border-t pt-3">
                          <p className="font-mono text-xs font-bold mb-1">{p.productName}</p>
                          <div className="flex justify-between font-mono text-xs text-gray-600">
                            <span>한정: {p.limitedQuantity}</span>
                            <span>판매: {p.soldQuantity}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 mt-2">
                            <div
                              className="bg-black h-2 rounded transition-all"
                              style={{
                                width: `${p.limitedQuantity > 0 ? (p.soldQuantity / p.limitedQuantity) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => dropId && setLocation(`/admin/drops/${dropId}/edit`)}
            className="flex-1 bg-brand-periwinkle text-black font-mono font-bold py-3 border-2 border-black hover:bg-white transition-all"
          >
            Drop 정보 수정
          </Button>
          <Button
            onClick={() => setLocation("/admin/drops")}
            className="flex-1 bg-gray-200 text-black font-mono font-bold py-3 border-2 border-black hover:bg-gray-300 transition-all"
          >
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
