import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Settings, Mail, Users, MessageSquare, AlertTriangle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useState, useEffect } from "react";


export default function AdminSystemSettings() {
  const { data: settings, isLoading, refetch } = trpc.systemSettings.get.useQuery();
  const updateMutation = trpc.systemSettings.update.useMutation({
    onSuccess: () => {
      alert("تم حفظ إعدادات النظام بنجاح");
      refetch();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    // User & Registration
    registrationEnabled: true,
    dailyQuestionLimit: 50,
    requireEmailVerification: false,
    
    // Welcome Messages
    welcomeMessageEnabled: true,
    welcomeMessageTitle: "مرحباً بك في نظام الأوقاف الإسلامية",
    welcomeMessageContent: "",
    
    // Email Settings
    emailEnabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    emailFromAddress: "",
    emailFromName: "",
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        registrationEnabled: settings.registrationEnabled ?? true,
        dailyQuestionLimit: settings.dailyQuestionLimit ?? 50,
        requireEmailVerification: settings.requireEmailVerification ?? false,
        welcomeMessageEnabled: settings.welcomeMessageEnabled ?? true,
        welcomeMessageTitle: settings.welcomeMessageTitle ?? "مرحباً بك في نظام الأوقاف الإسلامية",
        welcomeMessageContent: settings.welcomeMessageContent ?? "",
        emailEnabled: settings.emailEnabled ?? false,
        smtpHost: settings.smtpHost ?? "",
        smtpPort: settings.smtpPort ?? 587,
        smtpUser: settings.smtpUser ?? "",
        smtpPassword: settings.smtpPassword ?? "",
        emailFromAddress: settings.emailFromAddress ?? "",
        emailFromName: settings.emailFromName ?? "",
        maintenanceMode: settings.maintenanceMode ?? false,
        maintenanceMessage: settings.maintenanceMessage ?? "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="container mx-auto py-8">
              <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "إعدادات النظام"},
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8" />
          إعدادات النظام
        </h1>
        <p className="text-muted-foreground mt-2">إدارة الإعدادات العامة للنظام</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 ml-2" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="welcome">
              <MessageSquare className="w-4 h-4 ml-2" />
              رسائل الترحيب
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 ml-2" />
              البريد الإلكتروني
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <AlertTriangle className="w-4 h-4 ml-2" />
              الصيانة
            </TabsTrigger>
          </TabsList>

          {/* Users & Registration Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المستخدمين والتسجيل</CardTitle>
                <CardDescription>إدارة التسجيل والحدود اليومية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="registrationEnabled">السماح بالتسجيل</Label>
                    <p className="text-sm text-muted-foreground">
                      السماح للمستخدمين الجدد بإنشاء حسابات
                    </p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={formData.registrationEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, registrationEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyQuestionLimit">حد الأسئلة اليومية</Label>
                  <Input
                    id="dailyQuestionLimit"
                    type="number"
                    min="1"
                    value={formData.dailyQuestionLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyQuestionLimit: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    عدد الأسئلة المسموح بها للمستخدم الواحد يومياً
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requireEmailVerification">التحقق من البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">
                      طلب التحقق من البريد الإلكتروني عند التسجيل
                    </p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={formData.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requireEmailVerification: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Welcome Messages Tab */}
          <TabsContent value="welcome">
            <Card>
              <CardHeader>
                <CardTitle>رسائل الترحيب</CardTitle>
                <CardDescription>تخصيص رسائل الترحيب للمستخدمين الجدد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="welcomeMessageEnabled">تفعيل رسالة الترحيب</Label>
                    <p className="text-sm text-muted-foreground">
                      عرض رسالة ترحيب للمستخدمين الجدد عند التسجيل
                    </p>
                  </div>
                  <Switch
                    id="welcomeMessageEnabled"
                    checked={formData.welcomeMessageEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, welcomeMessageEnabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessageTitle">عنوان الرسالة</Label>
                  <Input
                    id="welcomeMessageTitle"
                    value={formData.welcomeMessageTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, welcomeMessageTitle: e.target.value })
                    }
                    placeholder="مرحباً بك في نظام الأوقاف الإسلامية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessageContent">محتوى الرسالة</Label>
                  <Textarea
                    id="welcomeMessageContent"
                    value={formData.welcomeMessageContent}
                    onChange={(e) =>
                      setFormData({ ...formData, welcomeMessageContent: e.target.value })
                    }
                    placeholder="اكتب محتوى رسالة الترحيب هنا..."
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    يمكنك استخدام Markdown لتنسيق النص
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings Tab */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات البريد الإلكتروني</CardTitle>
                <CardDescription>تكوين خادم SMTP لإرسال الرسائل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailEnabled">تفعيل البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">
                      السماح بإرسال رسائل البريد الإلكتروني
                    </p>
                  </div>
                  <Switch
                    id="emailEnabled"
                    checked={formData.emailEnabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, emailEnabled: checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">خادم SMTP</Label>
                    <Input
                      id="smtpHost"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">المنفذ</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) =>
                        setFormData({ ...formData, smtpPort: parseInt(e.target.value) })
                      }
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">اسم المستخدم</Label>
                    <Input
                      id="smtpUser"
                      value={formData.smtpUser}
                      onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">كلمة المرور</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={formData.smtpPassword}
                      onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailFromAddress">عنوان المرسل</Label>
                    <Input
                      id="emailFromAddress"
                      type="email"
                      value={formData.emailFromAddress}
                      onChange={(e) =>
                        setFormData({ ...formData, emailFromAddress: e.target.value })
                      }
                      placeholder="noreply@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailFromName">اسم المرسل</Label>
                    <Input
                      id="emailFromName"
                      value={formData.emailFromName}
                      onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
                      placeholder="نظام الأوقاف"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>وضع الصيانة</CardTitle>
                <CardDescription>تفعيل وضع الصيانة وتخصيص الرسالة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode">تفعيل وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">
                      عرض صفحة الصيانة لجميع المستخدمين (ما عدا المسؤولين)
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, maintenanceMode: checked })
                    }
                  />
                </div>

                {formData.maintenanceMode && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceMessage">رسالة الصيانة</Label>
                    <Textarea
                      id="maintenanceMessage"
                      value={formData.maintenanceMessage}
                      onChange={(e) =>
                        setFormData({ ...formData, maintenanceMessage: e.target.value })
                      }
                      placeholder="الموقع قيد الصيانة حالياً. سنعود قريباً..."
                      rows={4}
                    />
                  </div>
                )}

                {formData.maintenanceMode && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                          تحذير: وضع الصيانة مفعّل
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          المستخدمون العاديون لن يتمكنوا من الوصول إلى الموقع. المسؤولون فقط يمكنهم
                          تسجيل الدخول.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={updateMutation.isPending}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
