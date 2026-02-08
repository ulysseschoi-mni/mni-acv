import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

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

  // 모든 Drop 조회
  const { data: drops, isLoading: dropsLoading, refetch: refetchDrops } = trpc.drops.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  // 자동 새로고침 설정 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchDrops();
    }, 30000); // 30초마다 새로고침

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refetchDrops]);

  // 통계 계산
  const dropsList = Array.isArray(drops) ? drops : drops?.items || [];
  const stats = {
    totalDrops: dropsList.length,
    upcomingDrops: dropsList.filter((d: any) => d.status === "upcoming").length,
    activeDrops: dropsList.filter((d: any) => d.status === "active").length,
    endedDrops: dropsList.filter((d: any) => d.status === "ended").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 border-blue-200";
      case "active":
        return "bg-green-50 border-green-200";
      case "ended":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock className="w-5 h-5" />;
      case "active":
        return <TrendingUp className="w-5 h-5" />;
      case "ended":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-marker text-5xl md:text-6xl mb-2">관리자 대시보드</h1>
          <p className="font-mono text-gray-600">Drop 관리 및 판매 통계를 한눈에 확인하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Drops */}
          <Card className="p-6 border-2 border-black">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold">전체 Drop</h3>
              <Package className="w-5 h-5" />
            </div>
            <p className="font-marker text-4xl mb-2">{stats.totalDrops}</p>
            <p className="font-mono text-xs text-gray-600">총 Drop 개수</p>
          </Card>

          {/* Upcoming Drops */}
          <Card className="p-6 border-2 border-blue-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold text-blue-800">예정</h3>
              <Clock className="w-5 h-5 text-blue-800" />
            </div>
            <p className="font-marker text-4xl mb-2 text-blue-800">{stats.upcomingDrops}</p>
            <p className="font-mono text-xs text-blue-600">곧 시작할 Drop</p>
          </Card>

          {/* Active Drops */}
          <Card className="p-6 border-2 border-green-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold text-green-800">진행 중</h3>
              <TrendingUp className="w-5 h-5 text-green-800" />
            </div>
            <p className="font-marker text-4xl mb-2 text-green-800">{stats.activeDrops}</p>
            <p className="font-mono text-xs text-green-600">현재 진행 중인 Drop</p>
          </Card>

          {/* Ended Drops */}
          <Card className="p-6 border-2 border-gray-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono font-bold text-gray-800">종료</h3>
              <CheckCircle className="w-5 h-5 text-gray-800" />
            </div>
            <p className="font-marker text-4xl mb-2 text-gray-800">{stats.endedDrops}</p>
            <p className="font-mono text-xs text-gray-600">종료된 Drop</p>
          </Card>
        </div>

        {/* Drop List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-marker text-3xl">모든 Drop</h2>
            <Button
              onClick={() => setLocation("/admin/drops/new")}
              className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 Drop 생성
            </Button>
          </div>

          {dropsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : dropsList.length === 0 ? (
            <Card className="p-8 text-center border-2 border-black">
              <p className="font-mono text-gray-600 mb-4">생성된 Drop이 없습니다</p>
              <Button
                onClick={() => setLocation("/admin/drops/new")}
                className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all"
              >
                첫 Drop 생성하기
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {dropsList.map((drop: any) => (
                <Card
                  key={drop.id}
                  className={`p-6 border-2 cursor-pointer hover:shadow-lg transition-all ${getStatusColor(drop.status)}`}
                  onClick={() => setLocation(`/admin/drops/${drop.id}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-mono font-bold text-lg">{drop.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded font-mono text-xs font-bold ${getStatusBadgeColor(drop.status)}`}>
                          {drop.status === "upcoming" ? "예정" : drop.status === "active" ? "진행 중" : "종료"}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-gray-600 mb-3">{drop.description}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-mono text-xs text-gray-600 mb-1">시작</p>
                          <p className="font-mono font-bold text-sm">{formatDate(drop.startDate)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-gray-600 mb-1">종료</p>
                          <p className="font-mono font-bold text-sm">{formatDate(drop.endDate)}</p>
                        </div>
                        <div>
                          <p className="font-mono text-xs text-gray-600 mb-1">상품 수</p>
                          <p className="font-mono font-bold text-sm">{drop.productCount || 0}개</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                      {getStatusIcon(drop.status)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setLocation("/admin/drops")}
            className="flex-1 bg-brand-periwinkle text-black font-mono font-bold py-3 border-2 border-black hover:bg-white transition-all"
          >
            Drop 관리 페이지로 이동
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="flex-1 bg-gray-200 text-black font-mono font-bold py-3 border-2 border-black hover:bg-gray-300 transition-all"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
