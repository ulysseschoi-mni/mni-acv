import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDrops() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<"upcoming" | "active" | "ended" | undefined>();
  const [page, setPage] = useState(0);
  const limit = 10;

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

  // Drop 목록 조회
  const { data: dropsData, isLoading, refetch } = trpc.drops.getAll.useQuery({
    status,
    limit,
    offset: page * limit,
  });

  // Drop 삭제
  const deleteMutation = trpc.drops.delete.useMutation({
    onSuccess: () => {
      toast.success("Drop이 삭제되었습니다");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Drop 삭제에 실패했습니다");
    },
  });

  const handleDelete = (dropId: number) => {
    if (confirm("정말로 이 Drop을 삭제하시겠습니까?")) {
      deleteMutation.mutate(dropId);
    }
  };

  const drops = dropsData?.items || [];
  const total = dropsData?.total || 0;
  const totalPages = Math.ceil(total / limit);

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

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 font-mono text-sm mb-4 hover:text-brand-periwinkle transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-marker text-5xl md:text-6xl mb-2">Drop 관리</h1>
          <p className="font-mono text-gray-600">모든 Drop을 관리하고 편집합니다</p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Status Filter */}
            <Select value={status || ""} onValueChange={(value) => {
              setStatus(value === "" ? undefined : (value as any));
              setPage(0);
            }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">모든 상태</SelectItem>
                <SelectItem value="upcoming">예정</SelectItem>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="ended">종료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button
            onClick={() => setLocation("/admin/drops/new")}
            className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            새 Drop 생성
          </Button>
        </div>

        {/* Drop List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : drops.length === 0 ? (
          <Card className="p-8 text-center border-2 border-black">
            <p className="font-mono text-gray-600 mb-4">Drop이 없습니다</p>
            <Button
              onClick={() => setLocation("/admin/drops/new")}
              className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all"
            >
              첫 Drop 생성
            </Button>
          </Card>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto border-2 border-black rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="px-4 py-3 text-left font-mono font-bold">이름</th>
                    <th className="px-4 py-3 text-left font-mono font-bold">상태</th>
                    <th className="px-4 py-3 text-left font-mono font-bold">시작 시간</th>
                    <th className="px-4 py-3 text-left font-mono font-bold">종료 시간</th>
                    <th className="px-4 py-3 text-center font-mono font-bold">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {drops.map((drop: any, index: number) => (
                    <tr
                      key={drop.id}
                      className={`border-t-2 border-black ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                      <td className="px-4 py-3 font-mono">{drop.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-3 py-1 rounded font-mono text-xs font-bold ${getStatusBadgeColor(drop.status)}`}>
                          {drop.status === "upcoming" ? "예정" : drop.status === "active" ? "진행 중" : "종료"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{formatDate(drop.startDate)}</td>
                      <td className="px-4 py-3 font-mono text-sm">{formatDate(drop.endDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => setLocation(`/admin/drops/${drop.id}`)}
                            size="sm"
                            className="bg-brand-periwinkle text-black font-mono font-bold border-2 border-black hover:bg-white transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(drop.id)}
                            size="sm"
                            disabled={drop.status === "active"}
                            className="bg-red-100 text-red-800 font-mono font-bold border-2 border-red-800 hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-mono">
                {page + 1} / {totalPages}
              </span>
              <Button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="bg-black text-white font-mono font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="mt-4 text-center font-mono text-sm text-gray-600">
              총 {total}개의 Drop
            </div>
          </>
        )}
      </div>
    </div>
  );
}
