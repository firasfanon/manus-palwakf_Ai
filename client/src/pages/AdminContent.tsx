import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { HelpCircle, FileText, Edit, Trash2, CheckCircle, XCircle, Download } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { toast } from "sonner";
import Papa from "papaparse";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  viewCount: number;
};

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("faqs");
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "general" as "general" | "conditions" | "types" | "management" | "legal" | "jurisprudence",
    isActive: true,
  });

  // FAQs
  const { data: faqs, isLoading: faqsLoading, refetch: refetchFAQs } = trpc.admin.content.faqs.list.useQuery({});
  
  const updateFAQMutation = trpc.admin.content.faqs.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث السؤال بنجاح");
      refetchFAQs();
      setEditingFAQ(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFAQMutation = trpc.admin.content.faqs.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف السؤال بنجاح");
      refetchFAQs();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category as any,
      isActive: faq.isActive,
    });
  };

  const handleUpdateFAQ = () => {
    if (!editingFAQ) return;
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    updateFAQMutation.mutate({
      id: editingFAQ.id,
      ...faqForm,
    });
  };

  const exportFAQsToCSV = () => {
    if (!faqs || faqs.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const csvData = faqs.map((faq) => ({
      "السؤال": faq.question,
      "الجواب": faq.answer,
      "الفئة": categoryLabels[faq.category] || faq.category,
      "الحالة": faq.isActive ? "نشط" : "غير نشط",
      "المشاهدات": faq.viewCount,
    }));

    const csv = Papa.unparse(csvData, { header: true, delimiter: "," });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `faqs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  const exportDocumentsToCSV = () => {
    if (!documents || documents.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const csvData = documents.map((doc) => ({
      "العنوان": doc.title,
      "الفئة": categoryLabels[doc.category] || doc.category,
      "المصدر": doc.source || "-",
      "الحالة": doc.isActive ? "نشط" : "غير نشط",
    }));

    const csv = Papa.unparse(csvData, { header: true, delimiter: "," });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `documents_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  // Documents
  const { data: documents, isLoading: docsLoading, refetch: refetchDocs } = trpc.admin.content.documents.list.useQuery({});
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [docForm, setDocForm] = useState({ title: "", content: "", category: "reference" as any, source: "", isActive: true });

  const updateDocMutation = trpc.admin.content.documents.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المرجع بنجاح");
      setEditingDoc(null);
      refetchDocs();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteDocMutation = trpc.admin.content.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستند بنجاح");
      refetchDocs();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setDocForm({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      source: doc.source || "",
      isActive: doc.isActive,
    });
  };

  const handleUpdateDoc = () => {
    if (!editingDoc) return;
    if (!docForm.title.trim() || !docForm.content.trim()) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    updateDocMutation.mutate({
      id: editingDoc.id,
      ...docForm,
    });
  };

  const categoryLabels: Record<string, string> = {
    general: "عام",
    conditions: "شروط الوقف",
    types: "أنواع الوقف",
    management: "إدارة الوقف",
    legal: "قانوني",
    jurisprudence: "فقهي",
    law: "قوانين",
    majalla: "مجلة الأحكام",
    historical: "تاريخي",
    administrative: "إداري",
    reference: "مرجع",
  };

  return (
    <div dir="rtl" className="container mx-auto py-8">
            <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "إدارة المحتوى"},
      ]} />

<div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">إدارة المحتوى</h1>
        <p className="text-muted-foreground">
          إدارة الأسئلة الشائعة والمراجع. للتحكم بالثيمات والخطوط والشعار والفوتر والقوائم، يرجى زيارة <a href="/admin/settings" className="text-primary hover:underline">صفحة إعدادات الموقع</a>.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 gap-2">
          <TabsTrigger value="faqs">
            <HelpCircle className="h-4 w-4 ml-2" />
            الأسئلة الشائعة
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 ml-2" />
            المراجع
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={exportFAQsToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير CSV
            </Button>
          </div>
          {faqsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            </div>
          ) : !faqs || faqs.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد أسئلة شائعة</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">السؤال</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">المشاهدات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="font-medium max-w-md truncate">
                        {faq.question}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[faq.category] || faq.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{faq.viewCount}</TableCell>
                      <TableCell>
                        {faq.isActive ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 ml-1" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditFAQ(faq as FAQ)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
                                deleteFAQMutation.mutate({ id: faq.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={exportDocumentsToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير CSV
            </Button>
          </div>
          {docsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد مراجع</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">المصدر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-md truncate">
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[doc.category] || doc.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {doc.source || "-"}
                      </TableCell>
                      <TableCell>
                        {doc.isActive ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 ml-1" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDoc(doc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا المستند؟")) {
                                deleteDocMutation.mutate({ id: doc.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit FAQ Dialog */}
      <Dialog open={!!editingFAQ} onOpenChange={(open) => !open && setEditingFAQ(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل السؤال الشائع</DialogTitle>
            <DialogDescription>
              قم بتعديل السؤال والإجابة والفئة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>السؤال</Label>
              <Input
                value={faqForm.question}
                onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                placeholder="أدخل السؤال"
              />
            </div>
            <div>
              <Label>الإجابة</Label>
              <Textarea
                value={faqForm.answer}
                onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                placeholder="أدخل الإجابة"
                rows={5}
              />
            </div>
            <div>
              <Label>الفئة</Label>
              <Select
                value={faqForm.category}
                onValueChange={(value) => setFaqForm({ ...faqForm, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">عام</SelectItem>
                  <SelectItem value="conditions">شروط الوقف</SelectItem>
                  <SelectItem value="types">أنواع الوقف</SelectItem>
                  <SelectItem value="management">إدارة الوقف</SelectItem>
                  <SelectItem value="legal">قانوني</SelectItem>
                  <SelectItem value="jurisprudence">فقهي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={faqForm.isActive}
                onCheckedChange={(checked) => setFaqForm({ ...faqForm, isActive: checked })}
              />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFAQ(null)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateFAQ}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المرجع</DialogTitle>
            <DialogDescription>
              قم بتعديل عنوان ومحتوى المرجع
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input
                value={docForm.title}
                onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                placeholder="أدخل العنوان"
              />
            </div>
            <div>
              <Label>المحتوى</Label>
              <Textarea
                value={docForm.content}
                onChange={(e) => setDocForm({ ...docForm, content: e.target.value })}
                placeholder="أدخل المحتوى"
                rows={8}
              />
            </div>
            <div>
              <Label>الفئة</Label>
              <Select
                value={docForm.category}
                onValueChange={(value) => setDocForm({ ...docForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="law">قوانين</SelectItem>
                  <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                  <SelectItem value="historical">تاريخي</SelectItem>
                  <SelectItem value="administrative">إداري</SelectItem>
                  <SelectItem value="reference">مرجع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المصدر</Label>
              <Input
                value={docForm.source}
                onChange={(e) => setDocForm({ ...docForm, source: e.target.value })}
                placeholder="أدخل المصدر (اختياري)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={docForm.isActive}
                onCheckedChange={(checked) => setDocForm({ ...docForm, isActive: checked })}
              />
              <Label>نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDoc(null)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateDoc}>
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
