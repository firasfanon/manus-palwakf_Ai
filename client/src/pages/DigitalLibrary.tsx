import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AlertCircle, FileText, Library, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function DigitalLibrary() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState<string>("all");

  const { data: documents, isLoading } = trpc.digitalLibrary.list.useQuery({});

  const stats = { totalDocuments: 0, rulings: 0, deeds: 0, instructions: 0 };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <Button onClick={() => navigate("/")}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Breadcrumbs items={[
        { label: "إدارة النظام", href: "/admin/dashboard" },
        { label: "المكتبة الرقمية" }
      ]} />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">المكتبة الرقمية</h1>
              <p className="text-muted-foreground mt-1">
                أرشيف شامل لجميع الوثائق والمراجع القانونية
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/tools")}>
            العودة
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  إجمالي الوثائق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  الأحكام القضائية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rulings || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  الحجج الوقفية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.deeds || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  التعليمات الوزارية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.instructions || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>البحث في المكتبة</CardTitle>
            <CardDescription>
              ابحث في جميع الوثائق والمراجع القانونية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="ابحث عن وثيقة، حكم، أو تعليمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="نوع الوثيقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="ruling">أحكام قضائية</SelectItem>
                  <SelectItem value="deed">حجج وقفية</SelectItem>
                  <SelectItem value="instruction">تعليمات وزارية</SelectItem>
                  <SelectItem value="law">قوانين</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Search className="ml-2 h-4 w-4" />
                بحث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>الوثائق</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.category} • {doc.date}
                        </p>
                        {doc.summary && (
                          <p className="text-sm mt-2 line-clamp-2">{doc.summary}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد وثائق متاحة
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
