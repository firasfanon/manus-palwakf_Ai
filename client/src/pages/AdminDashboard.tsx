import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, MessageSquare, HelpCircle, FileText, Activity, TrendingUp, Download, 
  ArrowUp, ArrowDown, LayoutDashboard, BarChart3, Building2, Gavel, FileCheck, 
  ScrollText, Sparkles, Library, BookOpen, FolderOpen, Bell, Cog, Shield
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";

type TimeRange = 7 | 30 | 90 | 365;

export default function AdminDashboard() {
  const [userGrowthRange, setUserGrowthRange] = useState<TimeRange>(30);
  const [activityRange, setActivityRange] = useState<TimeRange>(7);

  const { data: stats, isLoading } = trpc.admin.systemStats.useQuery();
  const { data: userGrowth } = trpc.admin.charts.userGrowth.useQuery({ days: userGrowthRange });
  const { data: conversationActivity } = trpc.admin.charts.conversationActivity.useQuery({ days: activityRange });
  const { data: faqDistribution } = trpc.admin.charts.faqDistribution.useQuery();

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Mock previous period data
  const previousStats = {
    totalUsers: Math.max(0, stats?.totalUsers ? stats.totalUsers - Math.floor(stats.totalUsers * 0.15) : 0),
    totalConversations: Math.max(0, stats?.totalConversations ? stats.totalConversations - Math.floor(stats.totalConversations * 0.12) : 0),
    totalMessages: Math.max(0, stats?.totalMessages ? stats.totalMessages - Math.floor(stats.totalMessages * 0.18) : 0),
  };

  const handleExportPDF = () => {
    alert("جاري تصدير التقرير...");
    window.print();
  };

  // Colors for pie chart
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Category labels in Arabic
  const categoryLabels: Record<string, string> = {
    general: "عام",
    conditions: "شروط",
    types: "أنواع",
    management: "إدارة",
    legal: "قانوني",
    jurisprudence: "فقهي",
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="container mx-auto py-8">
              <Breadcrumbs items={[
        {label: "لوحة التحكم"},
      ]} />

<div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div dir="rtl" className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">لا توجد بيانات</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      description: `${stats.activeUsers} نشط في آخر 30 يوم`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      growth: calculateGrowth(stats.totalUsers, previousStats.totalUsers),
    },
    {
      title: "المحادثات",
      value: stats.totalConversations,
      icon: MessageSquare,
      description: `${stats.recentConversations} في آخر 7 أيام`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      growth: calculateGrowth(stats.totalConversations, previousStats.totalConversations),
    },
    {
      title: "الرسائل",
      value: stats.totalMessages,
      icon: Activity,
      description: "إجمالي الرسائل المتبادلة",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      growth: calculateGrowth(stats.totalMessages, previousStats.totalMessages),
    },
    {
      title: "الأسئلة الشائعة",
      value: stats.totalFAQs,
      icon: HelpCircle,
      description: "أسئلة متاحة للمستخدمين",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      growth: 0,
    },
    {
      title: "المراجع والوثائق",
      value: stats.totalDocuments,
      icon: FileText,
      description: "مستندات في قاعدة المعرفة",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      growth: 0,
    },
    {
      title: "معدل النشاط",
      value: `${Math.round((stats.recentConversations / stats.totalConversations) * 100) || 0}%`,
      icon: TrendingUp,
      description: "نسبة النشاط الأسبوعي",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      growth: 0,
    },
  ];

  return (
    <div dir="rtl" className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم المسؤول</h1>
          <p className="text-muted-foreground">
            إحصائيات شاملة عن النظام والمستخدمين
          </p>
        </div>
        <Button onClick={handleExportPDF} variant="outline">
          <Download className="w-4 h-4 ml-2" />
          تصدير PDF
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  {stat.growth !== 0 && (
                    <span className={`flex items-center text-xs font-medium ${stat.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                      {stat.growth > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(stat.growth)}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">التحليلات والرسوم البيانية</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* User Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>نمو المستخدمين</CardTitle>
                <div className="flex gap-2">
                  {([7, 30, 90, 365] as TimeRange[]).map((days) => (
                    <Button
                      key={days}
                      variant={userGrowthRange === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUserGrowthRange(days)}
                    >
                      {days === 7 ? "أسبوع" : days === 30 ? "شهر" : days === 90 ? "3 أشهر" : "سنة"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userGrowth && userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" style={{ fontSize: "12px" }} />
                    <YAxis style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="مستخدمين"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>

          {/* Conversation Activity Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>نشاط المحادثات</CardTitle>
                <div className="flex gap-2">
                  {([7, 30] as TimeRange[]).map((days) => (
                    <Button
                      key={days}
                      variant={activityRange === days ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActivityRange(days)}
                    >
                      {days === 7 ? "أسبوع" : "شهر"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {conversationActivity && conversationActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversationActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" style={{ fontSize: "12px" }} />
                    <YAxis style={{ fontSize: "12px" }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="conversations"
                      fill="#10b981"
                      name="محادثات"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>

          {/* FAQ Distribution Chart */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>توزيع الأسئلة الشائعة</CardTitle>
            </CardHeader>
            <CardContent>
              {faqDistribution && faqDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={faqDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${categoryLabels[entry.category] || entry.category}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {faqDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  لا توجد بيانات
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Sections */}
      <div className="space-y-8">
        {/* إدارة النظام */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            إدارة النظام
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Link href="/admin/dashboard">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <LayoutDashboard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">لوحة الإحصائيات</p>
                      <p className="text-sm text-muted-foreground">
                        عرض الإحصائيات والرسوم البيانية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">التحليلات المتقدمة</p>
                      <p className="text-sm text-muted-foreground">
                        تحليلات تفصيلية ومتقدمة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* إدارة البيانات */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            إدارة البيانات
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/properties">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-50">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة العقارات</p>
                      <p className="text-sm text-muted-foreground">
                        العقارات الوقفية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/cases">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <Gavel className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة القضايا</p>
                      <p className="text-sm text-muted-foreground">
                        القضايا الوقفية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/rulings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-cyan-50">
                      <FileCheck className="h-6 w-6 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة الأحكام</p>
                      <p className="text-sm text-muted-foreground">
                        الأحكام القضائية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/deeds">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-pink-50">
                      <ScrollText className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة الحجج</p>
                      <p className="text-sm text-muted-foreground">
                        الحجج الوقفية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/instructions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-indigo-50">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة التعليمات</p>
                      <p className="text-sm text-muted-foreground">
                        التعليمات الوزارية
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* الأدوات والمكتبة */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            الأدوات والمكتبة
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/tools">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-yellow-50">
                      <Sparkles className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">الأدوات الذكية</p>
                      <p className="text-sm text-muted-foreground">
                        أدوات الذكاء الصناعي
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/library">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-red-50">
                      <Library className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">المكتبة الرقمية</p>
                      <p className="text-sm text-muted-foreground">
                        الوثائق والمستندات
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/knowledge">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-teal-50">
                      <BookOpen className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة المراجع</p>
                      <p className="text-sm text-muted-foreground">
                        قاعدة المعرفة
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/files">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-slate-50">
                      <FolderOpen className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة الملفات</p>
                      <p className="text-sm text-muted-foreground">
                        الملفات والمرفقات
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* النظام */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Cog className="w-6 h-6 text-primary" />
            النظام
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة المستخدمين</p>
                      <p className="text-sm text-muted-foreground">
                        المستخدمين والصلاحيات
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/content">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-50">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إدارة المحتوى</p>
                      <p className="text-sm text-muted-foreground">
                        FAQs والوثائق
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/notifications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-50">
                      <Bell className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">الإشعارات</p>
                      <p className="text-sm text-muted-foreground">
                        إدارة الإشعارات
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/system-settings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50">
                      <Cog className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">إعدادات النظام</p>
                      <p className="text-sm text-muted-foreground">
                        إعدادات الموقع
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
