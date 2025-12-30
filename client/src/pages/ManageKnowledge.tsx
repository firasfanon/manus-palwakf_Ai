import { useState } from "react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, BookOpen, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type KnowledgeDocument = {
  id: number;
  title: string;
  content: string;
  category: string;
  source?: string | null;
  sourceUrl?: string | null;
  tags?: string | null;
  isActive: boolean;
  createdAt: Date;
};

type FormData = {
  title: string;
  content: string;
  category: "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
  source: string;
  sourceUrl: string;
  pdfUrl?: string;
  tags: string;
};

const categoryLabels: Record<string, string> = {
  law: "قانوني",
  jurisprudence: "فقهي",
  majalla: "مجلة الأحكام",
  historical: "تاريخي",
  administrative: "إداري",
  reference: "مرجع",
};

export default function ManageKnowledge() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    category: "reference",
    source: "",
    sourceUrl: "",
    pdfUrl: "",
    tags: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.knowledge.list.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      closeDialog();
      alert("تم إضافة المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const updateMutation = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      closeDialog();
      alert("تم تحديث المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      alert("تم حذف المرجع بنجاح!");
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const uploadPdfMutation = trpc.knowledge.uploadPdf.useMutation({
    onError: (error) => {
      alert(`خطأ في رفع الملف: ${error.message}`);
      setIsUploading(false);
    },
  });

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({
      title: "",
      content: "",
      category: "reference",
      source: "",
      sourceUrl: "",
      tags: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (doc: KnowledgeDocument) => {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category as FormData["category"],
      source: doc.source || "",
      sourceUrl: doc.sourceUrl || "",
      tags: doc.tags || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("الرجاء ملء حقل العنوان");
      return;
    }

    let finalFormData = { ...formData };

    // Upload PDF if selected
    if (pdfFile) {
      setIsUploading(true);
      try {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(pdfFile);
        });

        const uploadResult = await uploadPdfMutation.mutateAsync({
          fileName: pdfFile.name,
          fileData: base64Data,
          fileType: pdfFile.type,
        });

        finalFormData.pdfUrl = uploadResult.url;
        
        // If text was extracted and content is empty, use extracted text
        if (uploadResult.extractedText && !finalFormData.content.trim()) {
          finalFormData.content = uploadResult.extractedText;
          // Update formData to show extracted text in UI
          setFormData(prev => ({
            ...prev,
            content: uploadResult.extractedText
          }));
        }
        
        setIsUploading(false);
      } catch (error) {
        console.error("Error uploading PDF:", error);
        alert("فشل رفع ملف PDF. الرجاء المحاولة مرة أخرى.");
        setIsUploading(false);
        return;
      }
    }
    
    // Check content after PDF upload
    if (!finalFormData.content.trim()) {
      alert("الرجاء ملء حقل المحتوى أو رفع ملف PDF");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...finalFormData,
      });
    } else {
      createMutation.mutate(finalFormData);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`هل أنت متأكد من حذف المرجع "${title}"؟`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Breadcrumbs items={[
        { label: "إدارة النظام", href: "/admin/dashboard" },
        { label: "إدارة المراجع" }
      ]} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                إدارة قاعدة المعرفة
              </CardTitle>
              <CardDescription>إضافة وتعديل وحذف المراجع القانونية والفقهية</CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              إضافة مرجع جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المراجع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                <SelectItem value="law">قانوني</SelectItem>
                <SelectItem value="jurisprudence">فقهي</SelectItem>
                <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                <SelectItem value="historical">تاريخي</SelectItem>
                <SelectItem value="administrative">إداري</SelectItem>
                <SelectItem value="reference">مرجع</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد مراجع. ابدأ بإضافة مرجع جديد!
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                          {categoryLabels[doc.category] || doc.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.source || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString("ar-EG")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/knowledge/${doc.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(doc)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(doc.id, doc.title)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل مرجع" : "إضافة مرجع جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل معلومات المرجع أدناه"
                : "أدخل معلومات المرجع الجديد"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  العنوان <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="مثال: قانون الأراضي العثماني - المادة 1"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">
                  الفئة <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as FormData["category"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="law">قانوني</SelectItem>
                    <SelectItem value="jurisprudence">فقهي</SelectItem>
                    <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                    <SelectItem value="historical">تاريخي</SelectItem>
                    <SelectItem value="administrative">إداري</SelectItem>
                    <SelectItem value="reference">مرجع</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">
                  المحتوى <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="أدخل نص المادة أو المرجع..."
                  rows={8}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source">المصدر</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="مثال: قانون الأراضي العثماني (1858)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sourceUrl">رابط المصدر</Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, sourceUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">الكلمات المفتاحية</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="مثال: وقف، أراضي، ملكية (مفصولة بفواصل)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pdf">رفع ملف PDF (اختياري)</Label>
                <Input
                  id="pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPdfFile(file);
                    }
                  }}
                />
                {pdfFile && (
                  <p className="text-sm text-muted-foreground">
                    ملف محدد: {pdfFile.name}
                  </p>
                )}
                {formData.pdfUrl && (
                  <p className="text-sm text-blue-600">
                    <a href={formData.pdfUrl} target="_blank" rel="noopener noreferrer">
                      عرض الملف المرفوع
                    </a>
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              >
                {isUploading
                  ? "جاري رفع الملف..."
                  : editingId
                  ? "حفظ التعديلات"
                  : "إضافة المرجع"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
