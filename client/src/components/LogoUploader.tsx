import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

interface LogoUploaderProps {
  logoUrl: string;
  onLogoChange: (url: string) => void;
}

export function LogoUploader({ logoUrl, onLogoChange }: LogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const uploadMutation = trpc.files.upload.useMutation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة فقط");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("حجم الملف يجب أن يكون أقل من 2 ميجابايت");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Upload to S3
        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          fileSize: file.size,
        });

        // Update logo URL
        onLogoChange(result.fileUrl);
        setIsUploading(false);
      };

      reader.onerror = () => {
        alert("حدث خطأ أثناء قراءة الملف");
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("حدث خطأ أثناء رفع الملف");
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="logo-upload">رفع شعار الموقع</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("logo-upload")?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 ml-2" />
            {isUploading ? "جاري الرفع..." : "اختر صورة"}
          </Button>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {logoUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveLogo}
            >
              <X className="w-4 h-4 ml-1" />
              إزالة
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          الحجم الأقصى: 2 ميجابايت. الصيغ المدعومة: PNG, JPG, SVG, WebP
        </p>
      </div>

      {logoUrl && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm font-medium mb-3">معاينة الشعار:</p>
          <div className="flex items-center justify-center p-4 bg-white rounded border">
            <img
              src={logoUrl}
              alt="Logo Preview"
              className="max-h-24 max-w-full object-contain"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 break-all">
            الرابط: {logoUrl}
          </p>
        </div>
      )}
    </div>
  );
}
