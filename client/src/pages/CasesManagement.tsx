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
import { Loader2, Plus, Search, Edit, Trash2, Scale, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

const caseTypeLabels: Record<string, string> = {
  ownership_dispute: "نزاع ملكية",
  boundary_dispute: "نزاع حدود",
  usage_violation: "مخالفة استخدام",
  inheritance: "ميراث",
  management_dispute: "نزاع إدارة",
  encroachment: "تعدي",
  other: "أخرى",
};

const statusLabels: Record<string, string> = {
  pending: "قيد النظر",
  under_investigation: "قيد التحقيق",
  in_court: "في المحكمة",
  resolved: "محلولة",
  closed: "مغلقة",
};

export default function CasesManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);

  const { data: cases, isLoading, refetch } = trpc.cases.list.useQuery({});
  const createCase = trpc.cases.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القضية بنجاح");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("فشل إضافة القضية: " + error.message);
    },
  });

  const updateCase = trpc.cases.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القضية بنجاح");
      refetch();
      setEditingCase(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast.error("فشل تحديث القضية: " + error.message);
    },
  });

  const deleteCase = trpc.cases.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القضية بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل حذف القضية: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const caseNumber = formData.get("caseNumber") as string;
    const title = formData.get("title") as string;
    const caseType = formData.get("caseType") as "ownership_dispute" | "boundary_dispute" | "usage_violation" | "inheritance" | "management_dispute" | "encroachment" | "other";
    const court = formData.get("court") as string;
    const filingDate = new Date(formData.get("filingDate") as string);
    const status = formData.get("status") as "pending" | "under_investigation" | "in_court" | "resolved" | "closed";
    const plaintiff = formData.get("plaintiff") as string || undefined;
    const defendant = formData.get("defendant") as string || undefined;
    const summary = formData.get("summary") as string || undefined;
    const propertyId = formData.get("propertyId") as string || undefined;

    if (editingCase) {
      updateCase.mutate({
        id: editingCase.id,
        data: { status, notes: summary }
      });
    } else {
      createCase.mutate({
        caseNumber,
        title,
        description: summary || "",
        caseType,
        court,
        filingDate,
        status,
        plaintiff,
        defendant,
        propertyId: propertyId ? parseInt(propertyId) : undefined,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه القضية؟")) {
      deleteCase.mutate({ id });
    }
  };

  const filteredCases = cases?.filter((c: any) => {
    const matchesSearch = c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
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
        { label: "إدارة القضايا" }
      ]} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة القضايا الوقفية</h1>
        </div>
        <p className="text-muted-foreground">
          إدارة القضايا والنزاعات المتعلقة بالأوقاف الإسلامية
        </p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setEditingCase(null);
      }}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="ml-2 h-4 w-4" />
            إضافة قضية جديدة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCase ? "تعديل القضية" : "إضافة قضية جديدة"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingCase && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caseNumber">رقم القضية *</Label>
                    <Input
                      id="caseNumber"
                      name="caseNumber"
                      required
                      placeholder="مثال: 123/2024"
                      defaultValue={editingCase?.caseNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="court">المحكمة *</Label>
                    <Input
                      id="court"
                      name="court"
                      required
                      placeholder="مثال: المحكمة الشرعية - رام الله"
                      defaultValue={editingCase?.court}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">عنوان القضية *</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                    placeholder="مثال: نزاع ملكية مسجد عمر بن الخطاب"
                    defaultValue={editingCase?.title}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="caseType">نوع القضية *</Label>
                    <Select name="caseType" defaultValue={editingCase?.caseType || "ownership_dispute"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ownership_dispute">نزاع ملكية</SelectItem>
                        <SelectItem value="boundary_dispute">نزاع حدود</SelectItem>
                        <SelectItem value="usage_violation">مخالفة استخدام</SelectItem>
                        <SelectItem value="inheritance">ميراث</SelectItem>
                        <SelectItem value="management_dispute">نزاع إدارة</SelectItem>
                        <SelectItem value="encroachment">تعدي</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filingDate">تاريخ رفع القضية *</Label>
                    <Input
                      id="filingDate"
                      name="filingDate"
                      type="date"
                      required
                      defaultValue={editingCase?.filingDate?.split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plaintiff">المدعي</Label>
                    <Input
                      id="plaintiff"
                      name="plaintiff"
                      placeholder="اسم المدعي"
                      defaultValue={editingCase?.plaintiff}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defendant">المدعى عليه</Label>
                    <Input
                      id="defendant"
                      name="defendant"
                      placeholder="اسم المدعى عليه"
                      defaultValue={editingCase?.defendant}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="propertyId">رقم العقار الوقفي (اختياري)</Label>
                  <Input
                    id="propertyId"
                    name="propertyId"
                    type="number"
                    placeholder="رقم العقار في النظام"
                    defaultValue={editingCase?.propertyId}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="status">الحالة *</Label>
              <Select name="status" defaultValue={editingCase?.status || "pending"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">قيد النظر</SelectItem>
                  <SelectItem value="under_investigation">قيد التحقيق</SelectItem>
                  <SelectItem value="in_court">في المحكمة</SelectItem>
                  <SelectItem value="resolved">محلولة</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="summary">ملخص القضية</Label>
              <Textarea
                id="summary"
                name="summary"
                rows={4}
                placeholder="ملخص موجز عن القضية وتفاصيلها..."
                defaultValue={editingCase?.summary}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingCase(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {editingCase ? "تحديث" : "إضافة"}
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
              placeholder="البحث بالعنوان أو رقم القضية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="حالة القضية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد النظر</SelectItem>
              <SelectItem value="under_investigation">قيد التحقيق</SelectItem>
              <SelectItem value="in_court">في المحكمة</SelectItem>
              <SelectItem value="resolved">محلولة</SelectItem>
              <SelectItem value="closed">مغلقة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCases && filteredCases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم القضية</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المحكمة</TableHead>
                <TableHead>تاريخ الرفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem: any) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-mono text-sm">
                    {caseItem.caseNumber}
                  </TableCell>
                  <TableCell className="font-semibold">{caseItem.title}</TableCell>
                  <TableCell>{caseTypeLabels[caseItem.caseType] || caseItem.caseType}</TableCell>
                  <TableCell>{caseItem.court}</TableCell>
                  <TableCell>
                    {new Date(caseItem.filingDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        caseItem.status === "resolved"
                          ? "bg-green-100 text-green-800"
                          : caseItem.status === "in_court"
                          ? "bg-blue-100 text-blue-800"
                          : caseItem.status === "under_investigation"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[caseItem.status] || caseItem.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/cases/${caseItem.id}`)}
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCase(caseItem);
                          setIsAddDialogOpen(true);
                        }}
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(caseItem.id)}
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
            <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد قضايا مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
