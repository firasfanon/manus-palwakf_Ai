import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, ExternalLink, Search } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function Knowledge() {
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { data: allDocs, isLoading } = trpc.knowledge.list.useQuery();
  const { data: docDetail } = trpc.knowledge.getById.useQuery(
    { id: selectedDoc! },
    { enabled: !!selectedDoc }
  );

  const categories = [
    { value: "all", label: "الكل" },
    { value: "law", label: "قانون" },
    { value: "jurisprudence", label: "فقه" },
    { value: "majalla", label: "مجلة الأحكام" },
    { value: "historical", label: "تاريخي" },
    { value: "administrative", label: "إداري" },
    { value: "reference", label: "مرجع" },
  ];

  // Function to highlight search term in text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">$1</mark>');
  };

  // Function to extract snippet around search term
  const extractSnippet = (text: string, search: string, maxLength: number = 200) => {
    if (!search.trim()) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    
    const lowerText = text.toLowerCase();
    const lowerSearch = search.toLowerCase();
    const index = lowerText.indexOf(lowerSearch);
    
    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }
    
    const start = Math.max(0, index - Math.floor(maxLength / 2));
    const end = Math.min(text.length, start + maxLength);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
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

  const filterDocs = (category: string) => {
    let docs = allDocs || [];
    
    // Filter by category
    if (category !== "all") {
      docs = docs.filter((doc) => doc.category === category);
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      docs = docs.filter((doc) => 
        doc.title.toLowerCase().includes(lowerSearch) ||
        doc.content.toLowerCase().includes(lowerSearch) ||
        doc.source?.toLowerCase().includes(lowerSearch)
      );
    }
    
    return docs;
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
                <BookOpen className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">قاعدة المعرفة</h1>
              </div>
            </div>
            <Button asChild>
              <Link href="/chat">ابدأ المحادثة</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-foreground">قاعدة المعرفة الشاملة</h2>
            <p className="text-lg text-muted-foreground">
              مكتبة شاملة من القوانين والأحكام الشرعية والمراجع التاريخية المتعلقة بالأوقاف الإسلامية في فلسطين
            </p>
            
            {/* Search Box */}
            <div className="relative max-w-2xl mx-auto mt-8">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في العناوين والمحتوى (يشمل البحث في محتوى ملفات PDF)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 text-base"
              />
            </div>
            
            {searchTerm && (
              <p className="text-sm text-muted-foreground">
                النتائج: {filterDocs(activeCategory).length} مرجع
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-8">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat.value} 
                    value={cat.value} 
                    className="text-sm"
                    onClick={() => setActiveCategory(cat.value)}
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat.value} value={cat.value}>
                  {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                          <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </CardHeader>
                          <CardContent>
                            <Skeleton className="h-20 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {filterDocs(cat.value).map((doc) => (
                        <Card
                          key={doc.id}
                          className="hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedDoc(doc.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge className={getCategoryColor(doc.category)}>
                                {categories.find((c) => c.value === doc.category)?.label || doc.category}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                            {doc.source && (
                              <CardDescription className="flex items-center gap-1 mt-2">
                                <BookOpen className="w-3 h-3" />
                                {doc.source}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div 
                              className="text-sm text-muted-foreground line-clamp-3 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: highlightText(
                                  extractSnippet(doc.content, searchTerm, 200),
                                  searchTerm
                                )
                              }}
                            />
                            {searchTerm && doc.pdfUrl && (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                يتضمن محتوى PDF
                              </p>
                            )}
                            <Button variant="link" className="mt-2 p-0 h-auto text-primary">
                              اقرأ المزيد ←
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {!isLoading && filterDocs(cat.value).length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-bold text-foreground mb-2">
                          لا توجد وثائق في هذا التصنيف
                        </h3>
                        <p className="text-muted-foreground">جرب تصنيفاً آخر أو استخدم البحث</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </section>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {docDetail?.title}
            </DialogTitle>
            {docDetail && (
              <div className="flex items-center gap-2 pt-2">
                <Badge className={getCategoryColor(docDetail.category)}>
                  {categories.find((c) => c.value === docDetail.category)?.label || docDetail.category}
                </Badge>
                {docDetail.source && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {docDetail.source}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {docDetail && (
              <div className="prose-arabic space-y-4">
                <p className="whitespace-pre-wrap leading-relaxed">{docDetail.content}</p>
                {docDetail.sourceUrl && (
                  <div className="pt-4 border-t">
                    <Button variant="outline" asChild>
                      <a href={docDetail.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 ml-2" />
                        المصدر الأصلي
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">إحصائيات قاعدة المعرفة</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">{allDocs?.length || 0}</CardTitle>
                  <CardDescription>وثيقة ومرجع</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">6</CardTitle>
                  <CardDescription>تصنيفات رئيسية</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-4xl text-primary">100+</CardTitle>
                  <CardDescription>سنة من التاريخ</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
