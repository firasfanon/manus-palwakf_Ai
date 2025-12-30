import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Users, Search, Shield, UserX, ChevronLeft, ChevronRight, MessageSquare, Calendar, Filter, X } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { toast } from "sonner";

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"admin" | "user" | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [lastSignedInAfter, setLastSignedInAfter] = useState("");
  const [lastSignedInBefore, setLastSignedInBefore] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const limit = 20;

  // Fetch users
  const { data, isLoading, refetch } = trpc.admin.users.list.useQuery({
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    createdAfter: createdAfter || undefined,
    createdBefore: createdBefore || undefined,
    lastSignedInAfter: lastSignedInAfter || undefined,
    lastSignedInBefore: lastSignedInBefore || undefined,
    page,
    limit,
  });

  // Update role mutation
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير صلاحية المستخدم بنجاح");
      setRoleDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تغيير الصلاحية");
    },
  });

  // Delete user mutation
  const deleteUserMutation = trpc.admin.users.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم من النظام بنجاح");
      setDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تغيير الصلاحية");
    },
  });

  const handleUpdateRole = () => {
    if (selectedUserId) {
      updateRoleMutation.mutate({ userId: selectedUserId, role: newRole });
    }
  };

  const handleDeleteUser = () => {
    if (selectedUserId) {
      deleteUserMutation.mutate({ userId: selectedUserId });
    }
  };

  const openRoleDialog = (userId: number, currentRole: "admin" | "user") => {
    setSelectedUserId(userId);
    setNewRole(currentRole === "admin" ? "user" : "admin");
    setRoleDialogOpen(true);
  };

  const openDeleteDialog = (userId: number) => {
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setCreatedAfter("");
    setCreatedBefore("");
    setLastSignedInAfter("");
    setLastSignedInBefore("");
    setPage(1);
  };

  const hasActiveFilters = search || roleFilter !== "all" || createdAfter || createdBefore || lastSignedInAfter || lastSignedInBefore;

  return (
    <div dir="rtl" className="container mx-auto py-8">
            <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "إدارة المستخدمين"},
      ]} />

{/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-lg bg-blue-50">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">
              عرض وإدارة جميع مستخدمي النظام
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم أو البريد الإلكتروني..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pr-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(value: "admin" | "user" | "all") => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصلاحيات</SelectItem>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="w-full md:w-auto"
            >
              <Filter className="w-4 h-4 ml-2" />
              {showAdvancedFilters ? "إخفاء الفلاتر" : "بحث متقدم"}
            </Button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="w-full md:w-auto"
              >
                <X className="w-4 h-4 ml-2" />
                إعادة تعيين
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium mb-4">فلاتر التاريخ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Created Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ التسجيل</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="من"
                        value={createdAfter}
                        onChange={(e) => {
                          setCreatedAfter(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="إلى"
                        value={createdBefore}
                        onChange={(e) => {
                          setCreatedBefore(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Last Signed In Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">آخر دخول</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="من"
                        value={lastSignedInAfter}
                        onChange={(e) => {
                          setLastSignedInAfter(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="إلى"
                        value={lastSignedInBefore}
                        onChange={(e) => {
                          setLastSignedInBefore(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            {data ? `إجمالي ${data.total} مستخدم` : "جاري التحميل..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المعرف</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الصلاحية</TableHead>
                      <TableHead className="text-right">المحادثات</TableHead>
                      <TableHead className="text-right">تاريخ التسجيل</TableHead>
                      <TableHead className="text-right">آخر دخول</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {user.name?.charAt(0) || "؟"}
                              </span>
                            </div>
                            <span>{user.name || "غير محدد"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || "غير محدد"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? (
                              <Shield className="w-3 h-3 ml-1" />
                            ) : null}
                            {user.role === "admin" ? "مسؤول" : "مستخدم"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            <span>{user.conversationCount || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(user.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(user.lastSignedIn)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user.id, user.role)}
                            >
                              <Shield className="w-4 h-4 ml-1" />
                              تغيير الصلاحية
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(user.id)}
                            >
                              <UserX className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    صفحة {data.page} من {data.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد نتائج</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير صلاحية المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تغيير صلاحية هذا المستخدم؟
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: "admin" | "user") => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مسؤول</SelectItem>
                <SelectItem value="user">مستخدم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? "جاري التحديث..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع محادثاته ورسائله. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
