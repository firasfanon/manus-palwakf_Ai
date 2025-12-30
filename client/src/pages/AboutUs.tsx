import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Users, Award, BookOpen, Scale } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="py-20 border-b">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Scale className="w-4 h-4" />
              <span>عن المشروع</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground leading-tight">
              نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              مشروع رائد يجمع بين التكنولوجيا الحديثة والتراث الإسلامي لخدمة قضية الأوقاف في فلسطين
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">رسالتنا</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  توفير منصة متكاملة تعتمد على الذكاء الصناعي لتقديم استشارات قانونية وفقهية دقيقة حول الأوقاف الإسلامية في فلسطين، بما يساهم في حماية الأوقاف وتنميتها وتوثيقها بشكل علمي ومنهجي.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  نسعى لتسهيل الوصول إلى المعلومات القانونية والشرعية المتعلقة بالأوقاف، وتقديم أدوات ذكية تساعد الباحثين والمختصين في اتخاذ قرارات مستنيرة.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">رؤيتنا</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  أن نكون المرجع الأول والأشمل في مجال الأوقاف الإسلامية في فلسطين، من خلال دمج التقنيات الحديثة مع التراث الفقهي والقانوني الغني.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  نطمح لبناء قاعدة معرفية شاملة تخدم الأجيال القادمة وتحافظ على الإرث الوقفي الفلسطيني من خلال التوثيق الرقمي والأرشفة الذكية.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">ما يميز مشروعنا</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                نجمع بين الأصالة والحداثة لتقديم خدمة متميزة في مجال الأوقاف
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>قاعدة معرفية شاملة</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    نجمع القوانين الفلسطينية، مجلة الأحكام العدلية، التشريعات العثمانية، والمراجع الفقهية في منصة واحدة سهلة الوصول.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Scale className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>دقة قانونية وفقهية</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    نعتمد على مصادر موثوقة ومراجع معتمدة لضمان دقة المعلومات والاستشارات المقدمة في المسائل القانونية والشرعية.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>تقنية متقدمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    نستخدم أحدث تقنيات الذكاء الصناعي ومعالجة اللغة الطبيعية لتقديم إجابات دقيقة وسريعة على استفساراتكم.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">من نخدم</CardTitle>
                <CardDescription>المشروع مصمم لخدمة فئات متنوعة من المهتمين بالأوقاف</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">الباحثون والأكاديميون</h3>
                    <p className="text-sm text-muted-foreground">
                      للحصول على معلومات دقيقة ومراجع موثوقة في مجال الأوقاف الإسلامية
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">المحامون والقانونيون</h3>
                    <p className="text-sm text-muted-foreground">
                      للاستعانة بالقوانين والتشريعات المتعلقة بالأوقاف في القضايا القانونية
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">موظفو وزارة الأوقاف</h3>
                    <p className="text-sm text-muted-foreground">
                      لتسهيل الإجراءات الإدارية والحصول على المعلومات القانونية بسرعة
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">المهتمون بالتراث الإسلامي</h3>
                    <p className="text-sm text-muted-foreground">
                      للتعرف على تاريخ الأوقاف في فلسطين وأهميتها الحضارية والاجتماعية
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">التغطية الشاملة</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              يغطي النموذج جميع جوانب الأوقاف الإسلامية في فلسطين من النواحي القانونية والفقهية والتاريخية والإدارية
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-right">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">القوانين والتشريعات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• قانون الأوقاف الفلسطيني وتعديلاته</p>
                  <p>• التشريعات العثمانية التاريخية</p>
                  <p>• القوانين الأردنية السابقة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الأحكام الفقهية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• شروط صحة الوقف وأركانه</p>
                  <p>• أنواع الأوقاف وأحكامها</p>
                  <p>• أحكام النظارة والإدارة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">مجلة الأحكام العدلية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• القواعد الفقهية الكلية</p>
                  <p>• أحكام الوقف في المجلة</p>
                  <p>• التطبيقات القانونية المعاصرة</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الجوانب الإدارية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• إجراءات توثيق الوقف</p>
                  <p>• دور وزارة الأوقاف</p>
                  <p>• إدارة الأموال الوقفية</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
