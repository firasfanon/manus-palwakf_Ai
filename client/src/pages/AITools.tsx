import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Search,
  FileSearch,
  Scale,
  TrendingUp,
  Target,
  Library,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AITools() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى الأدوات الذكية</p>
        <Button onClick={() => navigate("/")}>العودة للصفحة الرئيسية</Button>
      </div>
    );
  }

  const tools = [
    {
      title: "التصنيف التلقائي",
      description: "تصنيف الوثائق والقضايا تلقائياً حسب النوع والفئة",
      icon: FileText,
      href: "/admin/tools/classify",
      color: "text-blue-500",
    },
    {
      title: "استخراج المعلومات",
      description: "استخراج المعلومات والكيانات من النصوص القانونية",
      icon: Search,
      href: "/admin/tools/extract",
      color: "text-green-500",
    },
    {
      title: "التلخيص الذكي",
      description: "تلخيص الأحكام والوثائق الطويلة بشكل ذكي",
      icon: FileSearch,
      href: "/admin/tools/summarize",
      color: "text-purple-500",
    },
    {
      title: "مقارنة الأحكام",
      description: "مقارنة الأحكام القضائية وتحليل الفروقات",
      icon: Scale,
      href: "/admin/tools/compare",
      color: "text-orange-500",
    },
    {
      title: "تحليل السوابق",
      description: "تحليل السوابق القضائية المشابهة",
      icon: TrendingUp,
      href: "/admin/tools/precedents",
      color: "text-pink-500",
    },
    {
      title: "توقع النتائج",
      description: "توقع نتائج القضايا بناءً على السوابق",
      icon: Target,
      href: "/admin/tools/predict",
      color: "text-red-500",
    },
    {
      title: "المكتبة الرقمية",
      description: "البحث المتقدم في جميع الوثائق والمراجع",
      icon: Library,
      href: "/admin/library",
      color: "text-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Breadcrumbs items={[
          { label: "إدارة النظام", href: "/admin/dashboard" },
          { label: "الأدوات الذكية" }
        ]} />
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">الأدوات الذكية</h1>
            <p className="text-muted-foreground mt-2">
              أدوات الذكاء الصناعي المتقدمة للتحليل القانوني والوقفي
            </p>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.title}
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                onClick={() => navigate(tool.href)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-accent ${tool.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              معلومات مهمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              • جميع الأدوات تستخدم نماذج ذكاء صناعي متقدمة مدربة على القوانين الفلسطينية
              ومجلة الأحكام العدلية
            </p>
            <p>• النتائج تعتمد على قاعدة المعرفة المتوفرة في النظام</p>
            <p>• يمكن تحسين دقة النتائج بإضافة المزيد من الوثائق والأحكام القضائية</p>
            <p>• جميع العمليات محمية ومقتصرة على المسؤولين فقط</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
