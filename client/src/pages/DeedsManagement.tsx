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
import { Loader2, Plus, Search, Edit, Trash2, ScrollText } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/Breadcrumbs";

const waqfTypeLabels: Record<string, string> = {
  charitable: "خيري",
  family: "ذري",
  mixed: "مختلط",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  disputed: "متنازع عليه",
  archived: "مؤرشف",
};

export default function DeedsManagement() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDeed, setEditingDeed] = useState<any>(null);

  const { data: deeds, isLoading, refetch } = trpc.deeds.list.useQuery({});
  const createDeed = trpc.deeds.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الحجة الوقفية بنجاح");
      refetch();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل إضافة الحجة الوقفية: " + error.message);
    },
  });

  const updateDeed = trpc.deeds.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحجة الوقفية بنجاح");
      refetch();
      setEditingDeed(null);
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث الحجة الوقفية: " + error.message);
    },
  });

  const deleteDeed = trpc.deeds.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحجة الوقفية بنجاح");
      refetch();
    },
    onError: (error: any) => {
      toast.error("فشل حذف الحجة الوقفية: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const deedNumber = formData.get("deedNumber") as string;
    const deedDate = new Date(formData.get("deedDate") as string);
    const hijriDate = formData.get("hijriDate") as string || undefined;
    const court = formData.get("court") as string;
    const judge = formData.get("judge") as string || undefined;
    const waqifName = formData.get("waqifName") as string;
    const waqifDetails = formData.get("waqifDetails") as string || undefined;
    const propertyDescription = formData.get("propertyDescription") as string;
    const propertyLocation = formData.get("propertyLocation") as string;
    const propertyBoundaries = formData.get("propertyBoundaries") as string || undefined;
    const propertyArea = formData.get("propertyArea") as string || undefined;
    const waqfType = formData.get("waqfType") as "charitable" | "family" | "mixed";
    const beneficiaries = formData.get("beneficiaries") as string;
    const waqifConditions = formData.get("waqifConditions") as string || undefined;
    const administratorName = formData.get("administratorName") as string || undefined;
    const administratorConditions = formData.get("administratorConditions") as string || undefined;
    const fullText = formData.get("fullText") as string || undefined;
    const summary = formData.get("summary") as string || undefined;
    const status = formData.get("status") as "active" | "inactive" | "disputed" | "archived";
    const notes = formData.get("notes") as string || undefined;
    const propertyId = formData.get("propertyId") as string || undefined;

    if (editingDeed) {
      updateDeed.mutate({
        id: editingDeed.id,
        data: { propertyDescription, beneficiaries, fullText, attachments: notes }
      });
    } else {
      createDeed.mutate({
        deedNumber,
        deedDate,
        hijriDate,
        court,
        judge,
        waqifName,
        waqifDetails,
        propertyDescription,
        propertyLocation,
        propertyBoundaries,
        propertyArea,
        waqfType,
        beneficiaries,
        waqifConditions,
        administratorName,
        administratorConditions,
        fullText,
        summary,
        status,
        notes,
        propertyId: propertyId ? parseInt(propertyId) : undefined,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحجة الوقفية؟")) {
      deleteDeed.mutate({ id });
    }
  };

  const filteredDeeds = deeds?.filter((deed: any) => {
    const matchesSearch = deed.waqifName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deed.deedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deed.propertyDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || deed.waqfType === filterType;
    return matchesSearch && matchesType;
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
        { label: "إدارة الحجج" }
      ]} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ScrollText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة الحجج الوقفية</h1>
        </div>
        <p className="text-muted-foreground">
          إدارة الحجج والوثائق الوقفية التاريخية والمعاصرة
        </p>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setEditingDeed(null);
      }}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="ml-2 h-4 w-4" />
            إضافة حجة وقفية جديدة
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDeed ? "تعديل الحجة الوقفية" : "إضافة حجة وقفية جديدة"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingDeed && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="deedNumber">رقم الحجة *</Label>
                    <Input
                      id="deedNumber"
                      name="deedNumber"
                      required
                      placeholder="مثال: 789/1920"
                      defaultValue={editingDeed?.deedNumber}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deedDate">تاريخ الحجة (ميلادي) *</Label>
                    <Input
                      id="deedDate"
                      name="deedDate"
                      type="date"
                      required
                      defaultValue={editingDeed?.deedDate?.split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hijriDate">التاريخ الهجري</Label>
                    <Input
                      id="hijriDate"
                      name="hijriDate"
                      placeholder="مثال: 15 رمضان 1338"
                      defaultValue={editingDeed?.hijriDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="court">المحكمة الشرعية *</Label>
                    <Input
                      id="court"
                      name="court"
                      required
                      placeholder="مثال: المحكمة الشرعية - القدس"
                      defaultValue={editingDeed?.court}
                    />
                  </div>
                  <div>
                    <Label htmlFor="judge">القاضي الشرعي</Label>
                    <Input
                      id="judge"
                      name="judge"
                      placeholder="اسم القاضي"
                      defaultValue={editingDeed?.judge}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="waqifName">اسم الواقف *</Label>
                    <Input
                      id="waqifName"
                      name="waqifName"
                      required
                      placeholder="اسم الواقف الكامل"
                      defaultValue={editingDeed?.waqifName}
                    />
                  </div>
                  <div>
                    <Label htmlFor="waqfType">نوع الوقف *</Label>
                    <Select name="waqfType" defaultValue={editingDeed?.waqfType || "charitable"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="charitable">خيري</SelectItem>
                        <SelectItem value="family">ذري</SelectItem>
                        <SelectItem value="mixed">مختلط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="waqifDetails">تفاصيل الواقف</Label>
                  <Textarea
                    id="waqifDetails"
                    name="waqifDetails"
                    rows={2}
                    placeholder="معلومات إضافية عن الواقف..."
                    defaultValue={editingDeed?.waqifDetails}
                  />
                </div>

                <div>
                  <Label htmlFor="propertyLocation">موقع العقار *</Label>
                  <Input
                    id="propertyLocation"
                    name="propertyLocation"
                    required
                    placeholder="مثال: القدس - حارة المغاربة"
                    defaultValue={editingDeed?.propertyLocation}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="propertyBoundaries">حدود العقار</Label>
                    <Textarea
                      id="propertyBoundaries"
                      name="propertyBoundaries"
                      rows={2}
                      placeholder="الحدود الأربعة للعقار..."
                      defaultValue={editingDeed?.propertyBoundaries}
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyArea">المساحة</Label>
                    <Input
                      id="propertyArea"
                      name="propertyArea"
                      placeholder="مثال: 500 متر مربع"
                      defaultValue={editingDeed?.propertyArea}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="administratorName">اسم الناظر</Label>
                  <Input
                    id="administratorName"
                    name="administratorName"
                    placeholder="اسم ناظر الوقف"
                    defaultValue={editingDeed?.administratorName}
                  />
                </div>

                <div>
                  <Label htmlFor="waqifConditions">شروط الواقف</Label>
                  <Textarea
                    id="waqifConditions"
                    name="waqifConditions"
                    rows={3}
                    placeholder="الشروط التي وضعها الواقف..."
                    defaultValue={editingDeed?.waqifConditions}
                  />
                </div>

                <div>
                  <Label htmlFor="administratorConditions">شروط النظارة</Label>
                  <Textarea
                    id="administratorConditions"
                    name="administratorConditions"
                    rows={2}
                    placeholder="شروط إدارة الوقف..."
                    defaultValue={editingDeed?.administratorConditions}
                  />
                </div>

                <div>
                  <Label htmlFor="status">الحالة *</Label>
                  <Select name="status" defaultValue={editingDeed?.status || "active"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                      <SelectItem value="disputed">متنازع عليه</SelectItem>
                      <SelectItem value="archived">مؤرشف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="propertyId">رقم العقار في النظام (اختياري)</Label>
                  <Input
                    id="propertyId"
                    name="propertyId"
                    type="number"
                    placeholder="رقم العقار"
                    defaultValue={editingDeed?.propertyId}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="propertyDescription">وصف العقار الموقوف *</Label>
              <Textarea
                id="propertyDescription"
                name="propertyDescription"
                rows={3}
                required={!editingDeed}
                placeholder="وصف تفصيلي للعقار الموقوف..."
                defaultValue={editingDeed?.propertyDescription}
              />
            </div>

            <div>
              <Label htmlFor="beneficiaries">الجهة الموقوف عليها *</Label>
              <Textarea
                id="beneficiaries"
                name="beneficiaries"
                rows={2}
                required={!editingDeed}
                placeholder="المستفيدون من الوقف..."
                defaultValue={editingDeed?.beneficiaries}
              />
            </div>

            <div>
              <Label htmlFor="summary">ملخص الحجة</Label>
              <Textarea
                id="summary"
                name="summary"
                rows={3}
                placeholder="ملخص موجز للحجة الوقفية..."
                defaultValue={editingDeed?.summary}
              />
            </div>

            {!editingDeed && (
              <div>
                <Label htmlFor="fullText">النص الكامل للحجة</Label>
                <Textarea
                  id="fullText"
                  name="fullText"
                  rows={6}
                  placeholder="النص الكامل للحجة الوقفية..."
                  defaultValue={editingDeed?.fullText}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="ملاحظات إضافية..."
                defaultValue={editingDeed?.notes}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingDeed(null);
                }}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {editingDeed ? "تحديث" : "إضافة"}
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
              placeholder="البحث باسم الواقف أو رقم الحجة أو وصف العقار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="نوع الوقف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="charitable">خيري</SelectItem>
              <SelectItem value="family">ذري</SelectItem>
              <SelectItem value="mixed">مختلط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDeeds && filteredDeeds.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الحجة</TableHead>
                <TableHead>اسم الواقف</TableHead>
                <TableHead>نوع الوقف</TableHead>
                <TableHead>المحكمة</TableHead>
                <TableHead>تاريخ الحجة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeeds.map((deed: any) => (
                <TableRow key={deed.id}>
                  <TableCell className="font-mono text-sm">
                    {deed.deedNumber}
                  </TableCell>
                  <TableCell className="font-semibold">{deed.waqifName}</TableCell>
                  <TableCell>{waqfTypeLabels[deed.waqfType] || deed.waqfType}</TableCell>
                  <TableCell className="max-w-xs truncate">{deed.court}</TableCell>
                  <TableCell>
                    {new Date(deed.deedDate).toLocaleDateString('ar-EG')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        deed.status === "active"
                          ? "bg-green-100 text-green-800"
                          : deed.status === "disputed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[deed.status] || deed.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDeed(deed);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(deed.id)}
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
            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد حجج وقفية مسجلة</p>
          </div>
        )}
      </div>
    </div>
  );
}
