import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Image, File, Trash2, Download, Search, Filter, Link as LinkIcon, Unlink } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FilesManagement() {
  const { user, isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "documents" | "images" | "legal" | "administrative" | "other">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"documents" | "images" | "legal" | "administrative" | "other">("documents");
  
  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [fileToLink, setFileToLink] = useState<number | null>(null);
  const [linkEntityType, setLinkEntityType] = useState<"deed" | "case" | "property">("deed");
  const [linkEntityId, setLinkEntityId] = useState<string>("");

  const utils = trpc.useUtils();
  
  // Get files list
  const { data: filesData, isLoading } = trpc.files.list.useQuery({ category: fileTypeFilter });

  // Upload mutation
  const uploadMutation = trpc.files.upload.useMutation({
    onSuccess: () => {
      toast.success("تم رفع الملف بنجاح");
      setSelectedFile(null);
      setUploading(false);
      utils.files.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "فشل رفع الملف");
      setUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.files.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الملف بنجاح");
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      utils.files.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "فشل حذف الملف");
    },
  });

  // Link mutation
  const linkMutation = trpc.files.linkToEntity.useMutation({
    onSuccess: () => {
      toast.success("تم ربط الملف بنجاح");
      setLinkDialogOpen(false);
      setFileToLink(null);
      setLinkEntityId("");
      utils.files.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "فشل ربط الملف");
    },
  });

  // Unlink mutation
  const unlinkMutation = trpc.files.unlinkFromEntity.useMutation({
    onSuccess: () => {
      toast.success("تم إلغاء ربط الملف بنجاح");
      utils.files.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "فشل إلغاء ربط الملف");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (16MB limit)
      if (file.size > 16 * 1024 * 1024) {
        toast.error("حجم الملف يجب أن يكون أقل من 16 ميجابايت");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("الرجاء اختيار ملف");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];

        await uploadMutation.mutateAsync({
          fileName: selectedFile.name,
          fileData: base64Data,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
          category: selectedCategory,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("حدث خطأ أثناء رفع الملف");
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    setFileToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate({ id: fileToDelete });
    }
  };

  const handleLinkClick = (fileId: number) => {
    setFileToLink(fileId);
    setLinkDialogOpen(true);
  };

  const handleLinkSubmit = () => {
    if (!fileToLink || !linkEntityId) {
      toast.error("الرجاء إدخال رقم الكيان");
      return;
    }

    const entityId = parseInt(linkEntityId);
    if (isNaN(entityId)) {
      toast.error("رقم الكيان غير صحيح");
      return;
    }

    linkMutation.mutate({
      fileId: fileToLink,
      entityType: linkEntityType,
      entityId,
    });
  };

  const handleUnlink = (fileId: number) => {
    unlinkMutation.mutate({ fileId });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'images':
        return <Image className="h-4 w-4" />;
      case 'documents':
      case 'legal':
      case 'administrative':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      documents: "وثائق",
      images: "صور",
      legal: "قانونية",
      administrative: "إدارية",
      other: "أخرى",
    };
    return labels[category] || category;
  };

  const getEntityTypeLabel = (type: string | null) => {
    if (!type || type === "none") return null;
    const labels: Record<string, string> = {
      deed: "حجة وقف",
      case: "قضية",
      property: "عقار",
    };
    return labels[type] || type;
  };

  const filteredFiles = filesData?.filter((file) =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!isAuthenticated) {
    return (
      <div dir="rtl" className="container py-8">
              <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "الأدوات"},
        {label: "إدارة الملفات"},
      ]} />

<Card>
          <CardHeader>
            <CardTitle>الرجاء تسجيل الدخول</CardTitle>
            <CardDescription>يجب تسجيل الدخول للوصول إلى إدارة الملفات</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">إدارة الملفات</h1>
        <p className="text-muted-foreground">رفع وإدارة الملفات والمستندات</p>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">رفع ملفات</TabsTrigger>
          <TabsTrigger value="manage">إدارة الملفات</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>رفع ملف جديد</CardTitle>
              <CardDescription>اختر ملفاً لرفعه (الحد الأقصى 16 ميجابايت)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">اختر ملف</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} - {formatFileSize(selectedFile.size)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="documents">وثائق</SelectItem>
                    <SelectItem value="images">صور</SelectItem>
                    <SelectItem value="legal">قانونية</SelectItem>
                    <SelectItem value="administrative">إدارية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "جاري الرفع..." : "رفع الملف"}
              </Button>

              {/* Drag and drop area */}
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  أو اسحب وأفلت الملف هنا
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>الملفات المرفوعة</CardTitle>
              <CardDescription>إدارة وتنظيم الملفات</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث في الملفات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <Select value={fileTypeFilter} onValueChange={(value: any) => setFileTypeFilter(value)}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="ml-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="documents">وثائق</SelectItem>
                    <SelectItem value="images">صور</SelectItem>
                    <SelectItem value="legal">قانونية</SelectItem>
                    <SelectItem value="administrative">إدارية</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Files Table */}
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">لا توجد ملفات</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>النوع</TableHead>
                        <TableHead>اسم الملف</TableHead>
                        <TableHead>الحجم</TableHead>
                        <TableHead>التصنيف</TableHead>
                        <TableHead>مرتبط بـ</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead className="text-left">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            {getCategoryIcon(file.category)}
                          </TableCell>
                          <TableCell className="font-medium">{file.fileName}</TableCell>
                          <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getCategoryLabel(file.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {file.linkedEntityType && file.linkedEntityType !== "none" ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {getEntityTypeLabel(file.linkedEntityType)} #{file.linkedEntityId}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnlink(file.id)}
                                  disabled={unlinkMutation.isPending}
                                >
                                  <Unlink className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLinkClick(file.id)}
                              >
                                <LinkIcon className="h-3 w-3 ml-1" />
                                ربط
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(file.createdAt).toLocaleDateString('ar-EG')}
                          </TableCell>
                          <TableCell className="text-left">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a href={file.fileUrl} download target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(file.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Storage Info */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المساحة المستخدمة</span>
                  <span className="text-sm font-medium">
                    {formatFileSize(filteredFiles.reduce((acc, file) => acc + file.fileSize, 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الملف نهائياً ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link File Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ربط الملف</DialogTitle>
            <DialogDescription>
              اختر نوع الكيان ورقمه لربط الملف به
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entityType">نوع الكيان</Label>
              <Select value={linkEntityType} onValueChange={(value: any) => setLinkEntityType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deed">حجة وقف</SelectItem>
                  <SelectItem value="case">قضية</SelectItem>
                  <SelectItem value="property">عقار</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityId">رقم الكيان</Label>
              <Input
                id="entityId"
                type="number"
                placeholder="أدخل رقم الكيان"
                value={linkEntityId}
                onChange={(e) => setLinkEntityId(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleLinkSubmit} disabled={linkMutation.isPending}>
              {linkMutation.isPending ? "جاري الربط..." : "ربط"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
