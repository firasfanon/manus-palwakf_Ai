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
import { Loader2, Plus, Search, Edit, Trash2, BookOpen, HelpCircle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categoryLabels: Record<string, string> = {
  law: "قوانين",
  jurisprudence: "فقه",
  majalla: "مجلة الأحكام",
  historical: "تاريخي",
  administrative: "إداري",
  reference: "مرجع",
};

const faqCategoryLabels: Record<string, string> = {
  general: "عام",
  conditions: "شروط الوقف",
  types: "أنواع الوقف",
  management: "إدارة الوقف",
  legal: "قانوني",
  jurisprudence: "فقهي",
};

export default function KnowledgeManagement() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isAddDocDialogOpen, setIsAddDocDialogOpen] = useState(false);
  const [isAddFaqDialogOpen, setIsAddFaqDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  // Knowledge Documents
  const { data: documents, isLoading: docsLoading, refetch: refetchDocs } = trpc.knowledge.list.useQuery({});
  const createDoc = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الوثيقة بنجاح");
      refetchDocs();
      setIsAddDocDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل إضافة الوثيقة: " + error.message);
    },
  });

  const updateDoc = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الوثيقة بنجاح");
      refetchDocs();
      setEditingDoc(null);
      setIsAddDocDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث الوثيقة: " + error.message);
    },
  });

  const deleteDoc = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الوثيقة بنجاح");
      refetchDocs();
    },
    onError: (error: any) => {
      toast.error("فشل حذف الوثيقة: " + error.message);
    },
  });

  // FAQs
  const { data: faqs, isLoading: faqsLoading, refetch: refetchFaqs } = trpc.faqs.list.useQuery({});
  const createFaq = trpc.faqs.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة السؤال بنجاح");
      refetchFaqs();
      setIsAddFaqDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل إضافة السؤال: " + error.message);
    },
  });

  const updateFaq = trpc.faqs.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث السؤال بنجاح");
      refetchFaqs();
      setEditingFaq(null);
      setIsAddFaqDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("فشل تحديث السؤال: " + error.message);
    },
  });

  const deleteFaq = trpc.faqs.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف السؤال بنجاح");
      refetchFaqs();
    },
    onError: (error: any) => {
      toast.error("فشل حذف السؤال: " + error.message);
    },
  });

  const handleDocSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const category = formData.get("category") as "law" | "jurisprudence" | "majalla" | "historical" | "administrative" | "reference";
    const tags = formData.get("tags") as string || undefined;

    if (editingDoc) {
      updateDoc.mutate({
        id: editingDoc.id,
        title,
        content,
        tags,
      });
    } else {
      createDoc.mutate({
        title,
        content,
        category,
        tags,
      });
    }
  };

  const handleFaqSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const category = formData.get("category") as "general" | "conditions" | "types" | "management" | "legal" | "jurisprudence";

    if (editingFaq) {
      updateFaq.mutate({
        id: editingFaq.id,
        question,
        answer,
        category,
      });
    } else {
      createFaq.mutate({
        question,
        answer,
        category,
      });
    }
  };

  const handleDeleteDoc = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الوثيقة؟")) {
      deleteDoc.mutate({ id });
    }
  };

  const handleDeleteFaq = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
      deleteFaq.mutate({ id });
    }
  };

  const filteredDocs = documents?.filter((doc: any) => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredFaqs = faqs?.filter((faq: any) => {
    return faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase());
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
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "إدارة البيانات"},
        {label: "المعرفة"},
      ]} />

<div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">إدارة قاعدة المعرفة</h1>
        </div>
        <p className="text-muted-foreground">
          إدارة الوثائق المعرفية والأسئلة الشائعة
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="documents">الوثائق المعرفية</TabsTrigger>
          <TabsTrigger value="faqs">الأسئلة الشائعة</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Dialog open={isAddDocDialogOpen} onOpenChange={(open) => {
            setIsAddDocDialogOpen(open);
            if (!open) setEditingDoc(null);
          }}>
            <DialogTrigger asChild>
              <Button className="mb-6">
                <Plus className="ml-2 h-4 w-4" />
                إضافة وثيقة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDoc ? "تعديل الوثيقة" : "إضافة وثيقة جديدة"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleDocSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الوثيقة *</Label>
                  <Input
                    id="title"
                    name="title"
                    required={!editingDoc}
                    placeholder="مثال: قانون الأوقاف الفلسطيني"
                    defaultValue={editingDoc?.title}
                  />
                </div>

                {!editingDoc && (
                  <div>
                    <Label htmlFor="category">التصنيف *</Label>
                    <Select name="category" defaultValue={editingDoc?.category || "law"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="law">قوانين</SelectItem>
                        <SelectItem value="jurisprudence">فقه</SelectItem>
                        <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                        <SelectItem value="historical">تاريخي</SelectItem>
                        <SelectItem value="administrative">إداري</SelectItem>
                        <SelectItem value="reference">مرجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="content">محتوى الوثيقة *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={10}
                    required={!editingDoc}
                    placeholder="المحتوى الكامل للوثيقة..."
                    defaultValue={editingDoc?.content}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">الوسوم (مفصولة بفواصل)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="مثال: أوقاف، قانون، فلسطين"
                    defaultValue={editingDoc?.tags}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDocDialogOpen(false);
                      setEditingDoc(null);
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingDoc ? "تحديث" : "إضافة"}
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
                  placeholder="البحث في الوثائق..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="التصنيف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  <SelectItem value="law">قوانين</SelectItem>
                  <SelectItem value="jurisprudence">فقه</SelectItem>
                  <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                  <SelectItem value="historical">تاريخي</SelectItem>
                  <SelectItem value="administrative">إداري</SelectItem>
                  <SelectItem value="reference">مرجع</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDocs && filteredDocs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>التصنيف</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-semibold max-w-md truncate">
                        {doc.title}
                      </TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {categoryLabels[doc.category] || doc.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(doc.createdAt).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingDoc(doc);
                              setIsAddDocDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDoc(doc.id)}
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
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد وثائق مسجلة</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <Dialog open={isAddFaqDialogOpen} onOpenChange={(open) => {
            setIsAddFaqDialogOpen(open);
            if (!open) setEditingFaq(null);
          }}>
            <DialogTrigger asChild>
              <Button className="mb-6">
                <Plus className="ml-2 h-4 w-4" />
                إضافة سؤال جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFaq ? "تعديل السؤال" : "إضافة سؤال جديد"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleFaqSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="question">السؤال *</Label>
                  <Input
                    id="question"
                    name="question"
                    required={!editingFaq}
                    placeholder="مثال: ما هي شروط الوقف الصحيح؟"
                    defaultValue={editingFaq?.question}
                  />
                </div>

                <div>
                  <Label htmlFor="answer">الإجابة *</Label>
                  <Textarea
                    id="answer"
                    name="answer"
                    rows={6}
                    required={!editingFaq}
                    placeholder="الإجابة التفصيلية على السؤال..."
                    defaultValue={editingFaq?.answer}
                  />
                </div>

                <div>
                  <Label htmlFor="category">التصنيف *</Label>
                  <Select name="category" defaultValue={editingFaq?.category || "general"}>
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

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddFaqDialogOpen(false);
                      setEditingFaq(null);
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingFaq ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="bg-card rounded-lg border p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الأسئلة الشائعة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {faqsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFaqs && filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq: any) => (
                  <div key={faq.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <h3 className="font-semibold text-lg">{faq.question}</h3>
                        </div>
                        <p className="text-muted-foreground mr-7">{faq.answer}</p>
                        {faq.category && (
                          <span className="inline-block mt-2 mr-7 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            {faq.category}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingFaq(faq);
                            setIsAddFaqDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFaq(faq.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد أسئلة شائعة مسجلة</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
