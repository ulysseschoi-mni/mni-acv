import { useState, useEffect } from "react";
import * as React from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, Trash2, ChevronLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// S3 업로드 함수
async function uploadImageToS3(file: File, dropId: number): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    throw new Error("S3 업로드 실패");
  }
}

export default function AdminDropBanner() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const dropId = params?.id ? parseInt(params.id as string) : null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);

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
  const { data: drop, isLoading: dropLoading } = trpc.drops.getById.useQuery(dropId);

  // Drop 업데이트 mutation
  const updateDropMutation = trpc.drops.update.useMutation({
    onSuccess: () => {
      toast.success("Banner image saved");
      setSelectedFile(null);
      setPreviewUrl("");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save banner");
      setIsUploading(false);
    },
  });

  // 현재 배너 URL 설정
  useEffect(() => {
    if (drop && (drop as any).bannerUrl) {
      setCurrentBannerUrl((drop as any).bannerUrl);
    }
  }, [drop]);

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다");
      return;
    }

    // 이미지 파일 확인
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 선택할 수 있습니다");
      return;
    }

    setSelectedFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드
  const handleUpload = async () => {
    if (!selectedFile || !dropId) {
      toast.error("파일을 선택하세요");
      return;
    }

    setIsUploading(true);

    try {
      // S3에 업로드
      const imageUrl = await uploadImageToS3(selectedFile, dropId);

      // Drop 정보 업데이트 (bannerUrl 저장)
      updateDropMutation.mutate({
        id: dropId,
        bannerUrl: imageUrl,
      });
    } catch (error) {
      toast.error("이미지 업로드에 실패했습니다");
      console.error(error);
    } finally {
      setIsUploading(false);
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation(`/admin/drops/${dropId}`)}
            className="flex items-center gap-2 font-mono text-sm mb-4 hover:text-brand-periwinkle transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="font-marker text-5xl md:text-6xl mb-2">배너 이미지 관리</h1>
          <p className="font-mono text-gray-600">{drop.name} - 배너 이미지를 업로드하세요</p>
        </div>

        {/* Upload Section */}
        <Card className="p-8 border-2 border-black mb-8">
          <h2 className="font-mono font-bold mb-6">이미지 업로드</h2>

          {/* Preview */}
          {previewUrl ? (
            <div className="mb-6">
              <p className="font-mono text-sm font-bold mb-3">미리보기</p>
              <div className="relative w-full h-64 bg-gray-100 rounded border-2 border-black overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : currentBannerUrl ? (
            <div className="mb-6">
              <p className="font-mono text-sm font-bold mb-3">현재 배너 이미지</p>
              <div className="relative w-full h-64 bg-gray-100 rounded border-2 border-black overflow-hidden">
                <img src={currentBannerUrl} alt="Current Banner" className="w-full h-full object-cover" />
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="font-mono text-sm font-bold mb-3">현재 배너 이미지</p>
              <div className="w-full h-64 bg-gray-100 rounded border-2 border-dashed border-black flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="font-mono text-sm text-gray-600">배너 이미지가 없습니다</p>
                </div>
              </div>
            </div>
          )}

          {/* File Input */}
          <div className="mb-6">
            <label className="block font-mono font-bold mb-3">이미지 선택</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full font-mono border-2 border-black rounded p-3 cursor-pointer"
            />
            <p className="font-mono text-xs text-gray-600 mt-2">
              지원 형식: JPG, PNG, GIF (최대 5MB)
            </p>
          </div>

          {/* Upload Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-black text-white font-mono font-bold py-3 border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  업로드
                </>
              )}
            </Button>
            {selectedFile && (
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl("");
                }}
                className="flex-1 bg-gray-200 text-black font-mono font-bold py-3 border-2 border-black hover:bg-gray-300 transition-all"
              >
                취소
              </Button>
            )}
          </div>
        </Card>

        {/* Info */}
        <Card className="p-6 border-2 border-brand-periwinkle bg-blue-50">
          <h3 className="font-mono font-bold mb-3">배너 이미지 가이드</h3>
          <ul className="font-mono text-sm space-y-2 text-gray-700">
            <li>• 권장 크기: 1200 x 400px</li>
            <li>• 지원 형식: JPG, PNG, GIF</li>
            <li>• 최대 파일 크기: 5MB</li>
            <li>• Drop 페이지의 상단에 배너로 표시됩니다</li>
          </ul>
        </Card>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => setLocation(`/admin/drops/${dropId}`)}
            className="w-full bg-gray-200 text-black font-mono font-bold py-3 border-2 border-black hover:bg-gray-300 transition-all"
          >
            돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
