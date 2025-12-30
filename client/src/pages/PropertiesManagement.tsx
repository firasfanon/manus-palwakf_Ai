import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Search, Edit, Trash2, Building2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

const propertyTypeLabels: Record<string, string> = {
  mosque: "مسجد",
  cemetery: "مقبرة",
  agricultural_land: "أرض زراعية",
  building: "مبنى",
  shrine: "مقام",
  school: "مدرسة",
  clinic: "عيادة",
  other: "أخرى",
};

const statusLabels: Record<string, string> = {
  active: "نشط",
  inactive: "معطل",
  disputed: "متنازع عليه",
  under_development: "قيد التطوير",
};

export default function PropertiesManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  const { data: properties, isLoading, refetch } = trpc.properties.list.useQuery({});
  const createProperty = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العقار بنجاح");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("فشل إضافة العقار: " + error.message);
    },
  });

  const updateProperty = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث العقار بنجاح");
      setEditingProperty(null);
      refetch();
    },
    onError: (error) => {
      toast.error("فشل تحديث العقار: " + error.message);
    },
  });

  const deleteProperty = trpc.properties.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العقار بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error("فشل حذف العقار: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const nationalKey = formData.get("nationalKey") as string;
    const name = formData.get("name") as string;
    const propertyType = formData.get("type") as "mosque" | "building" | "agricultural_land" | "shrine" | "cemetery" | "school" | "clinic" | "other";
    const governorate = formData.get("governorate") as string;
    const city = formData.get("city") as string;
    const address = formData.get("address") as string || undefined;
    const area = formData.get("area") as string || undefined;
    const status = formData.get("status") as "active" | "inactive" | "disputed" | "under_development";
    const description = formData.get("description") as string || undefined;
    const waqfType = "charitable" as "charitable" | "family" | "mixed";

    if (editingProperty) {
      updateProperty.mutate({ 
        id: editingProperty.id, 
        data: { name, status, description } 
      });
    } else {
      createProperty.mutate({ 
        nationalKey, 
        name, 
        propertyType, 
        governorate, 
        city, 
        address, 
        area, 
        waqfType,
        status, 
        description 
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العقار؟")) {
      deleteProperty.mutate({ id });
    }
  };

  const filteredProperties = properties?.filter((prop: any) => {
    const matchesSearch = prop.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.nationalKey?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || prop.propertyType === filterType;
    return matchesSearch && matchesType;
  });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              عذراً، هذه الصفحة متاحة للمسؤولين فقط
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto py-8">
      <Breadcrumbs items={[
        { label: "إدارة النظام", href: "/admin/dashboard" },
        { label: "إدارة العقارات" }
      ]} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">إدارة العقارات الوقفية</CardTitle>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة عقار جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProperty ? "تعديل العقار" : "إضافة عقار جديد"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nationalKey">المفتاح الوطني *</Label>
                      <Input
                        id="nationalKey"
                        name="nationalKey"
                        defaultValue={editingProperty?.nationalKey}
                        placeholder="Pw-01-001-0001-M"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">اسم العقار *</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={editingProperty?.name}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">نوع العقار *</Label>
                      <Select name="type" defaultValue={editingProperty?.propertyType || "mosque"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mosque">مسجد</SelectItem>
                          <SelectItem value="cemetery">مقبرة</SelectItem>
                          <SelectItem value="agricultural_land">أرض زراعية</SelectItem>
                          <SelectItem value="building">مبنى</SelectItem>
                          <SelectItem value="shrine">مقام</SelectItem>
                          <SelectItem value="school">مدرسة</SelectItem>
                          <SelectItem value="clinic">عيادة</SelectItem>
                          <SelectItem value="other">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">الحالة *</Label>
                      <Select name="status" defaultValue={editingProperty?.status || "active"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="disputed">متنازع عليه</SelectItem>
                          <SelectItem value="inactive">معطل</SelectItem>
                          <SelectItem value="under_development">قيد التطوير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="governorate">المحافظة *</Label>
                      <Input
                        id="governorate"
                        name="governorate"
                        defaultValue={editingProperty?.governorate}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">المدينة/القرية *</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={editingProperty?.city}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">العنوان التفصيلي</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editingProperty?.address}
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">المساحة (متر مربع)</Label>
                    <Input
                      id="area"
                      name="area"
                      type="number"
                      step="0.01"
                      defaultValue={editingProperty?.area}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="w-full min-h-[100px] p-2 border rounded-md"
                      defaultValue={editingProperty?.description}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingProperty(null);
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit">
                      {editingProperty ? "تحديث" : "إضافة"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو المفتاح الوطني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="نوع العقار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="mosque">مسجد</SelectItem>
                <SelectItem value="cemetery">مقبرة</SelectItem>
                <SelectItem value="agricultural_land">أرض زراعية</SelectItem>
                <SelectItem value="building">مبنى</SelectItem>
                <SelectItem value="shrine">مقام</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProperties && filteredProperties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المفتاح الوطني</TableHead>
                  <TableHead>اسم العقار</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المحافظة</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property: any) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-mono text-sm">
                      {property.nationalKey}
                    </TableCell>
                    <TableCell className="font-semibold">{property.name}</TableCell>
                    <TableCell>{propertyTypeLabels[property.propertyType] || property.propertyType}</TableCell>
                    <TableCell>{property.governorate}</TableCell>
                    <TableCell>{property.city}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          property.status === "active"
                            ? "bg-green-100 text-green-800"
                            : property.status === "disputed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[property.status] || property.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/properties/${property.id}`)}
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProperty(property)}
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(property.id)}
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
            <div className="text-center py-8 text-muted-foreground">
              لا توجد عقارات وقفية
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
