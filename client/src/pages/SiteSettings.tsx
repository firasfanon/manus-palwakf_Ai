import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Palette, Type, Image as ImageIcon, Menu, Settings, Sparkles } from "lucide-react";
import { LivePreview } from "@/components/LivePreview";
import { LogoUploader } from "@/components/LogoUploader";
import { ThemeSelector } from "@/components/ThemeSelector";
import type { Theme } from "@/lib/themes";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

export default function SiteSettings() {
  const { data: settings, isLoading, refetch } = trpc.siteSettings.get.useQuery();
  const { refetch: refetchContext } = useSiteSettings();
  const updateMutation = trpc.siteSettings.update.useMutation({
    onSuccess: () => {
      alert("تم حفظ الإعدادات بنجاح");
      refetch();
      refetchContext(); // تحديث SiteSettingsContext
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const [formData, setFormData] = useState({
    siteName: settings?.siteName || "",
    siteDescription: settings?.siteDescription || "",
    primaryColor: settings?.primaryColor || "#2563eb",
    secondaryColor: settings?.secondaryColor || "#10b981",
    backgroundColor: settings?.backgroundColor || "#ffffff",
    textColor: settings?.textColor || "#1f2937",
    accentColor: settings?.accentColor || "#f59e0b",
    headingFont: settings?.headingFont || "'Cairo', sans-serif",
    bodyFont: settings?.bodyFont || "'Tajawal', sans-serif",
    baseFontSize: settings?.baseFontSize || 16,
    logoUrl: settings?.logoUrl || "",
    menuItems: [] as { label: string; href: string; order: number }[],
    footerText: settings?.footerText || "",
    showSocialLinks: settings?.showSocialLinks ?? true,
    socialLinks: [] as { platform: string; url: string; icon: string }[],
  });

  // Update form data when settings load
  if (settings && formData.siteName === "" && settings.siteName) {
    setFormData({
      siteName: settings.siteName || "",
      siteDescription: settings.siteDescription || "",
      primaryColor: settings.primaryColor || "#2563eb",
      secondaryColor: settings.secondaryColor || "#10b981",
      backgroundColor: settings.backgroundColor || "#ffffff",
      textColor: settings.textColor || "#1f2937",
      accentColor: settings.accentColor || "#f59e0b",
      headingFont: settings.headingFont || "'Cairo', sans-serif",
      bodyFont: settings.bodyFont || "'Tajawal', sans-serif",
      menuItems: settings.menuItems ? JSON.parse(settings.menuItems) : [],
      baseFontSize: settings.baseFontSize || 16,
      logoUrl: settings.logoUrl || "",
      footerText: settings.footerText || "",
      showSocialLinks: settings.showSocialLinks ?? true,
      socialLinks: settings.socialLinks ? JSON.parse(settings.socialLinks) : [],
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      menuItems: JSON.stringify(formData.menuItems),
      socialLinks: JSON.stringify(formData.socialLinks),
    };
    updateMutation.mutate(dataToSave);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">إعدادات الموقع</h1>
        <p className="text-muted-foreground mt-2">
          قم بتخصيص مظهر وإعدادات الموقع حسب احتياجاتك
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">
              <Settings className="w-4 h-4 ml-2" />
              عام
            </TabsTrigger>
            <TabsTrigger value="colors">
              <Palette className="w-4 h-4 ml-2" />
              الألوان
            </TabsTrigger>
            <TabsTrigger value="typography">
              <Type className="w-4 h-4 ml-2" />
              الخطوط
            </TabsTrigger>
            <TabsTrigger value="branding">
              <ImageIcon className="w-4 h-4 ml-2" />
              الشعار
            </TabsTrigger>
            <TabsTrigger value="menu">
              <Menu className="w-4 h-4 ml-2" />
              القوائم
            </TabsTrigger>
            <TabsTrigger value="themes">
              <Sparkles className="w-4 h-4 ml-2" />
              الثيمات
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
                <CardDescription>
                  قم بتحديث المعلومات الأساسية للموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">اسم الموقع</Label>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) =>
                      setFormData({ ...formData, siteName: e.target.value })
                    }
                    placeholder="نموذج الذكاء الصناعي للأوقاف"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">وصف الموقع</Label>
                  <Textarea
                    id="siteDescription"
                    value={formData.siteDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        siteDescription: e.target.value,
                      })
                    }
                    placeholder="نموذج ذكاء صناعي شامل..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">نص حقوق النشر (Footer)</Label>
                  <Input
                    id="footerText"
                    value={formData.footerText}
                    onChange={(e) =>
                      setFormData({ ...formData, footerText: e.target.value })
                    }
                    placeholder="© 2024 جميع الحقوق محفوظة"
                  />
                </div>

                <div className="space-y-4">
                  <Label>روابط وسائل التواصل الاجتماعي</Label>
                  <div className="space-y-3">
                    {formData.socialLinks.map((link, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs">المنصة</Label>
                          <Input
                            value={link.platform}
                            onChange={(e) => {
                              const newLinks = [...formData.socialLinks];
                              newLinks[index].platform = e.target.value;
                              setFormData({ ...formData, socialLinks: newLinks });
                            }}
                            placeholder="Facebook"
                          />
                        </div>
                        <div className="flex-[2] space-y-2">
                          <Label className="text-xs">الرابط</Label>
                          <Input
                            value={link.url}
                            onChange={(e) => {
                              const newLinks = [...formData.socialLinks];
                              newLinks[index].url = e.target.value;
                              setFormData({ ...formData, socialLinks: newLinks });
                            }}
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newLinks = formData.socialLinks.filter((_, i) => i !== index);
                            setFormData({ ...formData, socialLinks: newLinks });
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          socialLinks: [...formData.socialLinks, { platform: "", url: "", icon: "" }],
                        });
                      }}
                    >
                      + إضافة رابط
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ألوان الموقع</CardTitle>
                <CardDescription>
                  قم بتخصيص لوحة الألوان الخاصة بالموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reset Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        primaryColor: "#2563eb",
                        secondaryColor: "#10b981",
                        backgroundColor: "#ffffff",
                        textColor: "#1f2937",
                        accentColor: "#f59e0b",
                      });
                    }}
                  >
                    استعادة الألوان الافتراضية
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">اللون الأساسي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondaryColor: e.target.value,
                        })
                      }
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">لون الخلفية</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">لون النص</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) =>
                        setFormData({ ...formData, textColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) =>
                        setFormData({ ...formData, textColor: e.target.value })
                      }
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">لون التمييز</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({ ...formData, accentColor: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) =>
                        setFormData({ ...formData, accentColor: e.target.value })
                      }
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
                </div>

                {/* Color Preview */}
                <div className="p-4 border rounded-lg space-y-3">
                  <p className="text-sm font-medium">معاينة الألوان:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center">
                      <div
                        className="h-16 rounded border"
                        style={{ backgroundColor: formData.primaryColor }}
                      />
                      <p className="text-xs mt-1 text-muted-foreground">أساسي</p>
                    </div>
                    <div className="flex-1 text-center">
                      <div
                        className="h-16 rounded border"
                        style={{ backgroundColor: formData.secondaryColor }}
                      />
                      <p className="text-xs mt-1 text-muted-foreground">ثانوي</p>
                    </div>
                    <div className="flex-1 text-center">
                      <div
                        className="h-16 rounded border"
                        style={{ backgroundColor: formData.accentColor }}
                      />
                      <p className="text-xs mt-1 text-muted-foreground">تمييز</p>
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ backgroundColor: formData.backgroundColor, color: formData.textColor }}>
                    <p className="text-sm">نص تجريبي بلون الخلفية والنص المخصص</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography */}
          <TabsContent value="typography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الخطوط</CardTitle>
                <CardDescription>
                  قم بتخصيص الخطوط المستخدمة في الموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headingFont">خط العناوين</Label>
                  <select
                    id="headingFont"
                    value={formData.headingFont}
                    onChange={(e) =>
                      setFormData({ ...formData, headingFont: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="'Cairo', sans-serif">Cairo - القاهرة</option>
                    <option value="'Tajawal', sans-serif">Tajawal - تجوال</option>
                    <option value="'Amiri', serif">Amiri - أميري</option>
                    <option value="'Almarai', sans-serif">Almarai - المراعي</option>
                    <option value="'Changa', sans-serif">Changa - شنقة</option>
                    <option value="'El Messiri', sans-serif">El Messiri - المسيري</option>
                    <option value="'Harmattan', sans-serif">Harmattan - هرمتان</option>
                    <option value="'Lateef', serif">Lateef - لطيف</option>
                    <option value="'Lemonada', cursive">Lemonada - ليمونادة</option>
                    <option value="'Mada', sans-serif">Mada - مدى</option>
                    <option value="'Markazi Text', serif">Markazi Text - مركزي</option>
                    <option value="'Reem Kufi', sans-serif">Reem Kufi - ريم كوفي</option>
                    <option value="'Scheherazade New', serif">Scheherazade - شهرزاد</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFont">خط النص</Label>
                  <select
                    id="bodyFont"
                    value={formData.bodyFont}
                    onChange={(e) =>
                      setFormData({ ...formData, bodyFont: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="'Cairo', sans-serif">Cairo - القاهرة</option>
                    <option value="'Tajawal', sans-serif">Tajawal - تجوال</option>
                    <option value="'Amiri', serif">Amiri - أميري</option>
                    <option value="'Almarai', sans-serif">Almarai - المراعي</option>
                    <option value="'Changa', sans-serif">Changa - شنقة</option>
                    <option value="'El Messiri', sans-serif">El Messiri - المسيري</option>
                    <option value="'Harmattan', sans-serif">Harmattan - هرمتان</option>
                    <option value="'Lateef', serif">Lateef - لطيف</option>
                    <option value="'Lemonada', cursive">Lemonada - ليمونادة</option>
                    <option value="'Mada', sans-serif">Mada - مدى</option>
                    <option value="'Markazi Text', serif">Markazi Text - مركزي</option>
                    <option value="'Reem Kufi', sans-serif">Reem Kufi - ريم كوفي</option>
                    <option value="'Scheherazade New', serif">Scheherazade - شهرزاد</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseFontSize">حجم الخط الأساسي (px)</Label>
                  <Input
                    id="baseFontSize"
                    type="number"
                    value={formData.baseFontSize}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baseFontSize: parseInt(e.target.value),
                      })
                    }
                    min="12"
                    max="24"
                  />
                </div>

                {/* Font Preview */}
                <div className="p-4 border rounded-lg space-y-3">
                  <p className="text-sm font-medium">معاينة الخطوط:</p>
                  <div className="space-y-2">
                    <div style={{ fontFamily: formData.headingFont, fontSize: '24px', fontWeight: 'bold' }}>
                      هذا عنوان تجريبي بخط العناوين
                    </div>
                    <div style={{ fontFamily: formData.bodyFont, fontSize: formData.baseFontSize + 'px' }}>
                      هذا نص تجريبي بخط النص الأساسي. يمكنك رؤية كيف سيظهر الخط في الموقع بعد الحفظ.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الشعار والعلامة التجارية</CardTitle>
                <CardDescription>
                  قم برفع شعار الموقع والأيقونة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LogoUploader
                  logoUrl={formData.logoUrl}
                  onLogoChange={(url) => setFormData({ ...formData, logoUrl: url })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu */}
          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>إدارة القوائم</CardTitle>
                <CardDescription>
                  أضف ورتّب عناصر القائمة الرئيسية في الموقع
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Menu Items */}
                <div className="space-y-2">
                  {formData.menuItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">العنوان</Label>
                          <Input
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...formData.menuItems];
                              newItems[index].label = e.target.value;
                              setFormData({ ...formData, menuItems: newItems });
                            }}
                            placeholder="مثل: الرئيسية"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">الرابط</Label>
                          <Input
                            value={item.href}
                            onChange={(e) => {
                              const newItems = [...formData.menuItems];
                              newItems[index].href = e.target.value;
                              setFormData({ ...formData, menuItems: newItems });
                            }}
                            placeholder="مثل: /"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (index > 0) {
                              const newItems = [...formData.menuItems];
                              [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
                              setFormData({ ...formData, menuItems: newItems });
                            }
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (index < formData.menuItems.length - 1) {
                              const newItems = [...formData.menuItems];
                              [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                              setFormData({ ...formData, menuItems: newItems });
                            }
                          }}
                          disabled={index === formData.menuItems.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newItems = formData.menuItems.filter((_, i) => i !== index);
                          setFormData({ ...formData, menuItems: newItems });
                        }}
                      >
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add New Item */}
                <Button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      menuItems: [
                        ...formData.menuItems,
                        { label: "", href: "", order: formData.menuItems.length },
                      ],
                    });
                  }}
                  className="w-full"
                >
                  + إضافة عنصر جديد
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes */}
          <TabsContent value="themes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الثيمات الجاهزة</CardTitle>
                <CardDescription>
                  اختر ثيم جاهز لتطبيقه فورًا على جميع إعدادات الموقع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector
                  onThemeSelect={(theme) => {
                    setFormData({
                      ...formData,
                      primaryColor: theme.colors.primaryColor,
                      secondaryColor: theme.colors.secondaryColor,
                      accentColor: theme.colors.accentColor,
                      backgroundColor: theme.colors.backgroundColor,
                      textColor: theme.colors.textColor,
                      headingFont: theme.fonts.headingFont,
                      bodyFont: theme.fonts.bodyFont,
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
            </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            إلغاء
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
            </form>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-1">
            <LivePreview
              primaryColor={formData.primaryColor}
              secondaryColor={formData.secondaryColor}
              backgroundColor={formData.backgroundColor}
              textColor={formData.textColor}
              accentColor={formData.accentColor}
              headingFont={formData.headingFont}
              bodyFont={formData.bodyFont}
              fontSize={formData.baseFontSize === 14 ? "small" : formData.baseFontSize === 18 ? "large" : "medium"}
            />
          </div>
        </div>
      </div>
    );
  }
