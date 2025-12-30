import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ExternalLink, Loader2, Search as SearchIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Search() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results, isLoading, refetch } = trpc.search.query.useQuery(
    {
      query: searchQuery,
      category: category === "all" ? undefined : category,
      limit: 10,
    },
    { enabled: !!searchQuery }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchQuery(query);
      refetch();
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      law: "قانون",
      jurisprudence: "فقه",
      majalla: "مجلة الأحكام",
      historical: "تاريخي",
      administrative: "إداري",
      reference: "مرجع",
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      law: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      jurisprudence: "bg-green-500/10 text-green-700 dark:text-green-400",
      majalla: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      historical: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      administrative: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      reference: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return colors[cat] || colors.reference;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <SearchIcon className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">البحث في قاعدة المعرفة</h1>
              </div>
            </div>
            <Button asChild>
              <Link href="/chat">ابدأ المحادثة</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <SearchIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold text-foreground">ابحث في قاعدة المعرفة</h2>
              <p className="text-lg text-muted-foreground">
                ابحث عن المعلومات القانونية والشرعية المتعلقة بالأوقاف الإسلامية
              </p>
            </div>

            <Card className="border-2">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="ابحث عن موضوع، قانون، أو حكم شرعي..."
                      className="flex-1 text-base"
                    />
                    <Button type="submit" disabled={!query.trim() || isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <SearchIcon className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">التصنيف:</span>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الكل</SelectItem>
                        <SelectItem value="law">قانون</SelectItem>
                        <SelectItem value="jurisprudence">فقه</SelectItem>
                        <SelectItem value="majalla">مجلة الأحكام</SelectItem>
                        <SelectItem value="historical">تاريخي</SelectItem>
                        <SelectItem value="administrative">إداري</SelectItem>
                        <SelectItem value="reference">مرجع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            {searchQuery && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground">
                  نتائج البحث عن: <span className="text-primary">"{searchQuery}"</span>
                </h3>
                {results && (
                  <p className="text-sm text-muted-foreground mt-1">
                    تم العثور على {results.length} نتيجة
                  </p>
                )}
              </div>
            )}

            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && results && results.length > 0 && (
              <div className="space-y-4">
                {results.map((doc) => (
                  <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(doc.category)}>
                              {getCategoryLabel(doc.category)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              درجة الصلة: {doc.relevanceScore}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl">{doc.title}</CardTitle>
                          {doc.source && (
                            <CardDescription className="mt-2 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {doc.source}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                        {doc.content.substring(0, 300)}...
                      </p>
                      {doc.sourceUrl && (
                        <Button variant="link" className="mt-2 p-0 h-auto" asChild>
                          <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 ml-1" />
                            المصدر الأصلي
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && results && results.length === 0 && searchQuery && (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">لم يتم العثور على نتائج</h3>
                  <p className="text-muted-foreground mb-4">جرب استخدام كلمات مفتاحية مختلفة أو تصنيف آخر</p>
                  <Button asChild>
                    <Link href="/chat">اسأل النموذج مباشرة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {!searchQuery && (
              <Card>
                <CardContent className="py-12 text-center">
                  <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold text-foreground mb-2">ابدأ البحث</h3>
                  <p className="text-muted-foreground">
                    أدخل كلمات البحث في الأعلى للعثور على المعلومات المتعلقة بالأوقاف
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">روابط سريعة</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">القوانين الفلسطينية</CardTitle>
                  <CardDescription>قانون الأوقاف والتشريعات ذات الصلة</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setCategory("law");
                    setQuery("قانون");
                    setSearchQuery("قانون");
                  }}>
                    استعراض القوانين
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">الأحكام الفقهية</CardTitle>
                  <CardDescription>الأحكام الشرعية للوقف وشروطه</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setCategory("jurisprudence");
                    setQuery("فقه");
                    setSearchQuery("فقه");
                  }}>
                    استعراض الأحكام
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">مجلة الأحكام العدلية</CardTitle>
                  <CardDescription>القانون المدني العثماني</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setCategory("majalla");
                    setQuery("مجلة");
                    setSearchQuery("مجلة");
                  }}>
                    استعراض المجلة
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
