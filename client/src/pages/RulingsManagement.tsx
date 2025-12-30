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
import { Loader2, Plus, Search, Edit, Trash2, Gavel, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

const rulingTypeLabels: Record<string, string> = {
  initial: "ابتدائي",
  appeal: "استئناف",
  supreme: "عليا",
  cassation: "نقض",
};

const statusLabels: Record<string, string> = {
  final: "نهائي",
  appealable: "قابل للاستئناف",
  appealed: "مستأنف",
};

export default function RulingsManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRuling, setEditingRuling] = useState<any>(null);

  const { data: rulings, isLoading, refetch } = trpc.rulings.list.useQuery({});
  const createRuling = trpc.rulings.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الحكم القضائي بنجاح");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("فشل إضافة الحكم القضائي: " + error.message);
    },
  });

  const updateRuling = trpc.rulings.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحكم القضائي بنجاح");
      refetch();
      setEditingRuling(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("فشل تحديث الحكم القضائي: " + error.message);
    },
  });

  const deleteRuling = trpc.rulings.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحكم القضائي بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل حذف الحكم القضائي: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const caseNumber = formData.get("caseNumber") as string;
    const title = formData.get("title") as string;
    const court = formData.get("court") as string;
    const judge = formData.get("judge") as string || undefined;
    const rulingDate = new Date(formData.get("rulingDate") as string);
    const rulingType = formData.get("rulingType") as "initial" | "appeal" | "supreme" | "cassation";
    const subject = formData.get("subject") as string;
    const summary = formData.get("summary") as string;
    const fullText = formData.get("fullText") as string || undefined;
    const legalPrinciple = formData.get("legalPrinciple") as string || undefined;
    const status = formData.get("status") as "final" | "appealable" | "appealed";
    const caseId = formData.get("caseId") as string || undefined;
    const propertyId = formData.get("propertyId") as string || undefined;

    if (editingRuling) {
      updateRuling.mutate({
        id: editingRuling.id,
        data: { status, summary, legalPrinciple }
      });
    } else {
      createRuling.mutate({
        caseNumber,
        title,
        court,
        judge,
        rulingDate,
        rulingType,
        subject,
        summary,
        fullText,
        legalPrinciple,
        status,
        caseId: caseId ? parseInt(caseId) : undefined,
        propertyId: propertyId ? parseInt(propertyId) : undefined,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الحكم القضائي؟")) {
      deleteRuling.mutate({ id });
    }
  };

  const filteredRulings = rulings?.filter((ruling: any) => {
    const matchesSearch = ruling.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruling.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ruling.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || ruling.rulingType === filterType;
    return matchesSearch && matchesType;
  });

  if (authLoading || !user) {
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
        { label: "إدارة الأحكام" }
      ]} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gavel className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة الأحكام القضائية</h1>
        </div>
        <p className="text-muted-foreground">
          إدارة الأحكام والقرارات القضائية المتعلقة بالأوقاف الإسلامية
        </p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setEditingRuling(null);
      }}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="ml-2 h-4 w-4" />
            إضافة حكم قضائي جديد
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRuling ? "تعديل الحكم القضائي" : "إضافة حكم قضائي جديد"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingRuling && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caseNumber">رقم القضية *</Label>
                    <Input
                      id="caseNumber"
                      name="caseNumber"
                      required
                      placeholder="مثال: 456/2024"
                      defaultValue={editingRuling?.caseNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rulingDate">تاريخ الحكم *</Label>
                    <Input
                      id="rulingDate"
                      name="rulingDate"
                      type="date"
                      required
                      defaultValue={editingRuling?.rulingDate?.split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">عنوان الحكم *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="مثال: حكم في قضية نزاع ملكية مسجد عمر"
                    defaultValue={editingRuling?.title}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="court">المحكمة *</Label>
                    <Input
                      id="court"
                      name="court"
                      required
                      placeholder="مثال: المحكمة الشرعية العليا - القدس"
                      defaultValue={editingRuling?.court}
                    />
                  </div>
                  <div>
                    <Label htmlFor="judge">القاضي</Label>
                    <Input
                      id="judge"
                      name="judge"
                      placeholder="اسم القاضي"
                      defaultValue={editingRuling?.judge}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rulingType">نوع الحكم *</Label>
                    <Select name="rulingType" defaultValue={editingRuling?.rulingType || "initial"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">ابتدائي</SelectItem>
                        <SelectItem value="appeal">استئناف</SelectItem>
                        <SelectItem value="supreme">عليا</SelectItem>
                        <SelectItem value="cassation">نقض</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="caseId">رقم القضية في النظام (اختياري)</Label>
                    <Input
                      id="caseId"
                      name="caseId"
                      type="number"
                      placeholder="رقم القضية"
                      defaultValue={editingRuling?.caseId}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">موضوع الحكم *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    required
                    placeholder="مثال: نزاع ملكية عقار وقفي"
                    defaultValue={editingRuling?.subject}
                  />
                </div>

                <div>
                  <Label htmlFor="propertyId">رقم العقار الوقفي (اختياري)</Label>
                  <Input
                    id="propertyId"
                    name="propertyId"
                    type="number"
                    placeholder="رقم العقار في النظام"
                    defaultValue={editingRuling?.propertyId}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="summary">ملخص الحكم *</Label>
              <Textarea
                id="summary"
                name="summary"
                rows={4}
                required={!editingRuling}
                placeholder="ملخص موجز للحكم القضائي..."
                defaultValue={editingRuling?.summary}
              />
            </div>

            {!editingRuling && (
              <div>
                <Label htmlFor="fullText">النص الكامل للحكم</Label>
                <Textarea
                  id="fullText"
                  name="fullText"
                  rows={6}
                  placeholder="النص الكامل للحكم القضائي..."
                  defaultValue={editingRuling?.fullText}
                />
              </div>
            )}

            <div>
              <Label htmlFor="legalPrinciple">المبدأ القانوني المستخلص</Label>
              <Textarea
                id="legalPrinciple"
                name="legalPrinciple"
                rows={3}
                placeholder="المبدأ القانوني المستخلص من الحكم..."
                defaultValue={editingRuling?.legalPrinciple}
              />
            </div>

            <div>
              <Label htmlFor="status">حالة الحكم *</Label>
              <Select name="status" defaultValue={editingRuling?.status || "final"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final">نهائي</SelectItem>
                  <SelectItem value="appealable">قابل للاستئناف</SelectItem>
                  <SelectItem value="appealed">مستأنف</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingRuling(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {editingRuling ? "تحديث" : "إضافة"}
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
              placeholder="البحث بالعنوان أو رقم القضية أو الموضوع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="نوع الحكم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="initial">ابتدائي</SelectItem>
              <SelectItem value="appeal">استئناف</SelectItem>
              <SelectItem value="supreme">عليا</SelectItem>
              <SelectItem value="cassation">نقض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRulings && filteredRulings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم القضية</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المحكمة</TableHead>
                <TableHead>تاريخ الحكم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRulings.map((ruling: any) => (
                <TableRow key={ruling.id}>
                  <TableCell className="font-mono text-sm">
                    {ruling.caseNumber}
                  </TableCell>
                  <TableCell className="font-semibold max-w-xs truncate">
                    {ruling.title}
                  </TableCell>
                  <TableCell>{rulingTypeLabels[ruling.rulingType] || ruling.rulingType}</TableCell>
                  <TableCell className="max-w-xs truncate">{ruling.court}</TableCell>
                  <TableCell>
                    {new Date(ruling.rulingDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        ruling.status === "final"
                          ? "bg-green-100 text-green-800"
                          : ruling.status === "appealable"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {statusLabels[ruling.status] || ruling.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/rulings/${ruling.id}`)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRuling(ruling);
                          setIsAddDialogOpen(true);
                        }}
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ruling.id)}
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد أحكام قضائية مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
