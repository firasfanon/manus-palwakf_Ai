import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Download,
  FileCheck,
  Languages,
  FileType,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocumentFilesManagerProps {
  documentId: number;
  isAdmin?: boolean;
}

export default function DocumentFilesManager({ documentId, isAdmin = false }: DocumentFilesManagerProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"original" | "translation" | "supplement" | "other">("original");
  const [language, setLanguage] = useState<string>("ar");
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: files, isLoading } = trpc.knowledge.getFiles.useQuery({ documentId });

  const addFileMutation = trpc.knowledge.addFile.useMutation({
    onSuccess: () => {
      utils.knowledge.getFiles.invalidate({ documentId });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setIsUploading(false);
      alert("تم رفع الملف بنجاح!");
    },
    onError: (error) => {
      setIsUploading(false);
      alert(`خطأ في رفع الملف: ${error.message}`);
    },
  });

  const deleteFileMutation = trpc.knowledge.deleteFile.useMutation({
    onSuccess: () => {
      utils.knowledge.getFiles.invalidate({ documentId });
      alert("تم حذف الملف بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ في حذف الملف: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        alert("يرجى اختيار ملف PDF فقط");
        return;
      }
      if (file.size > 16 * 1024 * 1024) {
        alert("حجم الملف يجب أن يكون أقل من 16 ميجابايت");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("يرجى اختيار ملف");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1];

        await addFileMutation.mutateAsync({
          documentId,
          fileName: selectedFile.name,
          fileData: base64Data,
          fileType,
          language,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  const handleDelete = (fileId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
      deleteFileMutation.mutate({ id: fileId });
    }
  };

  const fileTypeLabels: Record<string, string> = {
    original: "الملف الأصلي",
    translation: "ترجمة",
    supplement: "ملحق",
    other: "أخرى",
  };

  const languageLabels: Record<string, string> = {
    ar: "العربية",
    en: "الإنجليزية",
    he: "العبرية",
    tr: "التركية",
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "غير معروف";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} ميجابايت`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الملفات المرفقة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                الملفات المرفقة
              </CardTitle>
              <CardDescription>
                جميع ملفات PDF المرتبطة بهذا المرجع ({files?.length || 0} ملف)
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="ml-2 h-4 w-4" />
                رفع ملف جديد
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!files || files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد ملفات مرفقة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <Card key={file.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">{file.fileName || "ملف PDF"}</h4>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileType className="h-3 w-3" />
                            {fileTypeLabels[file.fileType] || file.fileType}
                          </Badge>
                          
                          {file.language && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Languages className="h-3 w-3" />
                              {languageLabels[file.language] || file.language}
                            </Badge>
                          )}
                          
                          {file.isOcr && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <FileCheck className="h-3 w-3" />
                              تم استخراج النص بـ OCR
                            </Badge>
                          )}
                          
                          <Badge variant="outline">
                            {formatFileSize(file.fileSize)}
                          </Badge>
                        </div>

                        {file.extractedText && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {file.extractedText.substring(0, 150)}...
                          </p>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.fileUrl, "_blank")}
                          >
                            <ExternalLink className="ml-2 h-4 w-4" />
                            فتح
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = file.fileUrl;
                              a.download = file.fileName || "document.pdf";
                              a.click();
                            }}
                          >
                            <Download className="ml-2 h-4 w-4" />
                            تحميل
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(file.id)}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>رفع ملف PDF جديد</DialogTitle>
            <DialogDescription>
              اختر ملف PDF لإضافته إلى هذا المرجع. سيتم استخراج النص تلقائياً.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">ملف PDF</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  الملف المختار: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">نوع الملف</Label>
              <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                <SelectTrigger id="fileType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">الملف الأصلي</SelectItem>
                  <SelectItem value="translation">ترجمة</SelectItem>
                  <SelectItem value="supplement">ملحق</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">اللغة</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">الإنجليزية</SelectItem>
                  <SelectItem value="he">العبرية</SelectItem>
                  <SelectItem value="tr">التركية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              إلغاء
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? "جاري الرفع..." : "رفع الملف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
