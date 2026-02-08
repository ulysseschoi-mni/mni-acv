import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface FormData {
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export default function AdminDropForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const dropId = params?.id ? parseInt(params.id) : null;
  const isEdit = !!dropId;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Drop 조회 (수정 시)
  const { data: drop, isLoading: dropLoading } = trpc.drops.getById.useQuery(dropId || 0, {
    enabled: isEdit,
  });

  useEffect(() => {
    if (drop && isEdit) {
      const startDate = new Date(drop.startDate);
      const endDate = new Date(drop.endDate);

      setFormData({
        name: drop.name,
        description: drop.description || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
      });
    }
  }, [drop, isEdit]);

  // Drop 생성/수정 뮤테이션
  const createMutation = trpc.drops.create.useMutation({
    onSuccess: () => {
      toast.success("Drop이 생성되었습니다");
      setLocation("/admin/drops");
    },
    onError: (error) => {
      toast.error(error.message || "Drop 생성에 실패했습니다");
    },
  });

  const updateMutation = trpc.drops.update.useMutation({
    onSuccess: () => {
      toast.success("Drop이 수정되었습니다");
      setLocation("/admin/drops");
    },
    onError: (error) => {
      toast.error(error.message || "Drop 수정에 실패했습니다");
    },
  });

  // 유효성 검증
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Drop 이름은 필수입니다";
    }

    if (!formData.startDate) {
      newErrors.startDate = "시작 날짜는 필수입니다";
    }

    if (!formData.startTime) {
      newErrors.startTime = "시작 시간은 필수입니다";
    }

    if (!formData.endDate) {
      newErrors.endDate = "종료 날짜는 필수입니다";
    }

    if (!formData.endTime) {
      newErrors.endTime = "종료 시간은 필수입니다";
    }

    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (startDateTime >= endDateTime) {
        newErrors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (isEdit && dropId) {
        updateMutation.mutate({
          id: dropId,
          name: formData.name,
          description: formData.description || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
        });
      } else {
        createMutation.mutate({
          name: formData.name,
          description: formData.description || undefined,
          startDate: startDateTime,
          endDate: endDateTime,
        });
      }
    } catch (error) {
      toast.error("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 필드 수정 시 해당 필드의 에러 제거
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (dropLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/admin/drops")}
            className="flex items-center gap-2 font-mono text-sm mb-4 hover:text-brand-periwinkle transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-marker text-5xl md:text-6xl mb-2">
            {isEdit ? "Drop 수정" : "새 Drop 생성"}
          </h1>
          <p className="font-mono text-gray-600">
            {isEdit ? "Drop 정보를 수정합니다" : "새로운 Drop을 생성합니다"}
          </p>
        </div>

        {/* Form */}
        <Card className="p-8 border-2 border-black">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drop Name */}
            <div>
              <label className="block font-mono font-bold mb-2">
                Drop 이름 <span className="text-red-600">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="예: Summer Collection 2024"
                className={`font-mono border-2 ${errors.name ? "border-red-600" : "border-black"}`}
              />
              {errors.name && <p className="text-red-600 font-mono text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block font-mono font-bold mb-2">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Drop에 대한 설명을 입력하세요"
                className="w-full font-mono border-2 border-black rounded p-3 resize-none"
                rows={4}
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono font-bold mb-2">
                  시작 날짜 <span className="text-red-600">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className={`font-mono border-2 ${errors.startDate ? "border-red-600" : "border-black"}`}
                />
                {errors.startDate && <p className="text-red-600 font-mono text-sm mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block font-mono font-bold mb-2">
                  시작 시간 <span className="text-red-600">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className={`font-mono border-2 ${errors.startTime ? "border-red-600" : "border-black"}`}
                />
                {errors.startTime && <p className="text-red-600 font-mono text-sm mt-1">{errors.startTime}</p>}
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono font-bold mb-2">
                  종료 날짜 <span className="text-red-600">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className={`font-mono border-2 ${errors.endDate ? "border-red-600" : "border-black"}`}
                />
                {errors.endDate && <p className="text-red-600 font-mono text-sm mt-1">{errors.endDate}</p>}
              </div>
              <div>
                <label className="block font-mono font-bold mb-2">
                  종료 시간 <span className="text-red-600">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  className={`font-mono border-2 ${errors.endTime ? "border-red-600" : "border-black"}`}
                />
                {errors.endTime && <p className="text-red-600 font-mono text-sm mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                onClick={() => setLocation("/admin/drops")}
                className="flex-1 bg-gray-200 text-black font-mono font-bold py-3 border-2 border-black hover:bg-gray-300 transition-all"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-black text-white font-mono font-bold py-3 border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </>
                ) : isEdit ? (
                  "수정 완료"
                ) : (
                  "생성"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
