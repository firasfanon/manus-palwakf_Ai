import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Send, Trash2, Edit, Calendar } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useState } from "react";

type NotificationType = "announcement" | "update" | "maintenance" | "alert";
type NotificationStatus = "draft" | "scheduled" | "sent" | "cancelled";
type TargetAudience = "all" | "admins" | "users" | "specific";

export default function AdminNotifications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | "all">("all");
  
  const { data, isLoading, refetch } = trpc.notifications.list.useQuery({
    type: filterType === "all" ? undefined : filterType,
    status: filterStatus === "all" ? undefined : filterStatus,
    page: 1,
    limit: 50,
  });

  const createMutation = trpc.notifications.create.useMutation({
    onSuccess: () => {
      alert("تم إنشاء الإشعار بنجاح");
      setIsCreateDialogOpen(false);
      refetch();
      setFormData({
        title: "",
        content: "",
        type: "announcement",
        targetAudience: "all",
        status: "draft",
      });
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const sendMutation = trpc.notifications.send.useMutation({
    onSuccess: (result) => {
      alert(`تم إرسال الإشعار بنجاح إلى ${result.sentCount} مستخدم`);
      refetch();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      alert("تم حذف الإشعار بنجاح");
      refetch();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement" as NotificationType,
    targetAudience: "all" as TargetAudience,
    status: "draft" as "draft" | "scheduled" | "sent",
  });

  const handleCreate = () => {
    if (!formData.title || !formData.content) {
      alert("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleSend = (id: number) => {
    if (confirm("هل أنت متأكد من إرسال هذا الإشعار؟")) {
      sendMutation.mutate({ id });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الإشعار؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      announcement: "إعلان",
      update: "تحديث",
      maintenance: "صيانة",
      alert: "تنبيه",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "مسودة",
      scheduled: "مجدول",
      sent: "تم الإرسال",
      cancelled: "ملغي",
    };
    return labels[status] || status;
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      all: "الجميع",
      admins: "المسؤولين",
      users: "المستخدمين",
      specific: "محدد",
    };
    return labels[audience] || audience;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      scheduled: "outline",
      sent: "default",
      cancelled: "destructive",
    };
    return colors[status] || "default";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      announcement: "default",
      update: "secondary",
      maintenance: "destructive",
      alert: "outline",
    };
    return colors[type] || "default";
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="container mx-auto py-8">
              <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "الإشعارات"},
      ]} />

<div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-8 h-8" />
            إدارة الإشعارات
          </h1>
          <p className="text-muted-foreground mt-2">إنشاء وإرسال إشعارات للمستخدمين</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          إشعار جديد
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>تصفية الإشعارات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="announcement">إعلان</SelectItem>
                  <SelectItem value="update">تحديث</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                  <SelectItem value="alert">تنبيه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="scheduled">مجدول</SelectItem>
                  <SelectItem value="sent">تم الإرسال</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإشعارات ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.notifications && data.notifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الجمهور المستهدف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>عدد المرسل إليهم</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(notification.type)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getAudienceLabel(notification.targetAudience)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(notification.status)}>
                        {getStatusLabel(notification.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{notification.sentCount}</TableCell>
                    <TableCell>
                      {new Date(notification.createdAt).toLocaleDateString("ar-EG")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {notification.status === "draft" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSend(notification.id)}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(notification.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد إشعارات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إنشاء إشعار جديد</DialogTitle>
            <DialogDescription>
              قم بإنشاء إشعار جديد لإرساله للمستخدمين
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان الإشعار"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">المحتوى *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="محتوى الإشعار..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as NotificationType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">إعلان</SelectItem>
                    <SelectItem value="update">تحديث</SelectItem>
                    <SelectItem value="maintenance">صيانة</SelectItem>
                    <SelectItem value="alert">تنبيه</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">الجمهور المستهدف</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetAudience: value as TargetAudience })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الجميع</SelectItem>
                    <SelectItem value="admins">المسؤولين فقط</SelectItem>
                    <SelectItem value="users">المستخدمين فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
