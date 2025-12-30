import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Search, Edit, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";

const typeLabels: Record<string, string> = {
  circular: "تعميم",
  instruction: "تعليمات",
  decision: "قرار",
  regulation: "لائحة",
  guideline: "دليل إرشادي",
};

const categoryLabels: Record<string, string> = {
  administrative: "إداري",
  financial: "مالي",
  legal: "قانوني",
  technical: "فني",
  general: "عام",
};

export default function InstructionsManagement() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<any>(null);

  const { data: instructions, isLoading, refetch } = trpc.instructions.list.useQuery({});
  const createInstruction = trpc.instructions.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التعليمات الوزارية بنجاح");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل إضافة التعليمات الوزارية: " + error.message);
    },
  });

  const updateInstruction = trpc.instructions.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث التعليمات الوزارية بنجاح");
      refetch();
      setEditingInstruction(null);
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث التعليمات الوزارية: " + error.message);
    },
  });

  const deleteInstruction = trpc.instructions.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التعليمات الوزارية بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error("فشل حذف التعليمات الوزارية: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const instructionNumber = formData.get("instructionNumber") as string;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as "circular" | "instruction" | "decision" | "regulation" | "guideline";
    const category = formData.get("category") as "administrative" | "financial" | "legal" | "technical" | "general";
    const issueDate = new Date(formData.get("issueDate") as string);
    const effectiveDate = formData.get("effectiveDate") ? new Date(formData.get("effectiveDate") as string) : undefined;
    const expiryDate = formData.get("expiryDate") ? new Date(formData.get("expiryDate") as string) : undefined;
    const issuedBy = formData.get("issuedBy") as string || undefined;
    const tags = formData.get("tags") as string || undefined;

    if (editingInstruction) {
      updateInstruction.mutate({
        id: editingInstruction.id,
        data: { title, content, effectiveDate, expiryDate, tags }
      });
    } else {
      createInstruction.mutate({
        instructionNumber,
        title,
        content,
        type,
        category,
        issueDate,
        effectiveDate,
        expiryDate,
        issuedBy,
        tags,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه التعليمات الوزارية؟")) {
      deleteInstruction.mutate({ id });
    }
  };

  const filteredInstructions = instructions?.filter((instruction: any) => {
    const matchesSearch = instruction.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instruction.instructionNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instruction.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || instruction.type === filterType;
    const matchesCategory = filterCategory === "all" || instruction.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto py-8 px-4">
      <Breadcrumbs items={[
        { label: "إدارة النظام", href: "/admin/dashboard" },
        { label: "إدارة التعليمات" }
      ]} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة التعليمات الوزارية</h1>
        </div>
        <p className="text-muted-foreground">
          إدارة التعليمات والتعاميم والقرارات الصادرة عن وزارة الأوقاف
        </p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setEditingInstruction(null);
      }}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="ml-2 h-4 w-4" />
            إضافة تعليمات وزارية جديدة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstruction ? "تعديل التعليمات الوزارية" : "إضافة تعليمات وزارية جديدة"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingInstruction && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructionNumber">رقم التعليمات *</Label>
                    <Input
                      id="instructionNumber"
                      name="instructionNumber"
                      required
                      placeholder="مثال: 15/2024"
                      defaultValue={editingInstruction?.instructionNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issueDate">تاريخ الإصدار *</Label>
                    <Input
                      id="issueDate"
                      name="issueDate"
                      type="date"
                      required
                      defaultValue={editingInstruction?.issueDate?.split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">نوع الوثيقة *</Label>
                    <Select name="type" defaultValue={editingInstruction?.type || "instruction"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circular">تعميم</SelectItem>
                        <SelectItem value="instruction">تعليمات</SelectItem>
                        <SelectItem value="decision">قرار</SelectItem>
                        <SelectItem value="regulation">لائحة</SelectItem>
                        <SelectItem value="guideline">دليل إرشادي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">التصنيف *</Label>
                    <Select name="category" defaultValue={editingInstruction?.category || "general"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="administrative">إداري</SelectItem>
                        <SelectItem value="financial">مالي</SelectItem>
                        <SelectItem value="legal">قانوني</SelectItem>
                        <SelectItem value="technical">فني</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="issuedBy">الجهة المصدرة</Label>
                  <Input
                    id="issuedBy"
                    name="issuedBy"
                    placeholder="مثال: وزارة الأوقاف والشؤون الدينية"
                    defaultValue={editingInstruction?.issuedBy}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="effectiveDate">تاريخ السريان</Label>
                    <Input
                      id="effectiveDate"
                      name="effectiveDate"
                      type="date"
                      defaultValue={editingInstruction?.effectiveDate?.split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      type="date"
                      defaultValue={editingInstruction?.expiryDate?.split('T')[0]}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="title">عنوان التعليمات *</Label>
              <Input
                id="title"
                name="title"
                required={!editingInstruction}
                placeholder="مثال: تعليمات إدارة الأوقاف الخيرية"
                defaultValue={editingInstruction?.title}
              />
            </div>

            <div>
              <Label htmlFor="content">محتوى التعليمات *</Label>
              <Textarea
                id="content"
                name="content"
                rows={8}
                required={!editingInstruction}
                placeholder="النص الكامل للتعليمات الوزارية..."
                defaultValue={editingInstruction?.content}
              />
            </div>

            <div>
              <Label htmlFor="tags">الوسوم (مفصولة بفواصل)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="مثال: إدارة، أوقاف، تنظيم"
                defaultValue={editingInstruction?.tags}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingInstruction(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {editingInstruction ? "تحديث" : "إضافة"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-lg border p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالعنوان أو رقم التعليمات أو المحتوى..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="نوع الوثيقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="circular">تعميم</SelectItem>
              <SelectItem value="instruction">تعليمات</SelectItem>
              <SelectItem value="decision">قرار</SelectItem>
              <SelectItem value="regulation">لائحة</SelectItem>
              <SelectItem value="guideline">دليل إرشادي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              <SelectItem value="administrative">إداري</SelectItem>
              <SelectItem value="financial">مالي</SelectItem>
              <SelectItem value="legal">قانوني</SelectItem>
              <SelectItem value="technical">فني</SelectItem>
              <SelectItem value="general">عام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredInstructions && filteredInstructions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم التعليمات</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstructions.map((instruction: any) => (
                <TableRow key={instruction.id}>
                  <TableCell className="font-mono text-sm">
                    {instruction.instructionNumber}
                  </TableCell>
                  <TableCell className="font-semibold max-w-md truncate">
                    {instruction.title}
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {typeLabels[instruction.type] || instruction.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {categoryLabels[instruction.category] || instruction.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(instruction.issueDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingInstruction(instruction);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(instruction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد تعليمات وزارية مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
