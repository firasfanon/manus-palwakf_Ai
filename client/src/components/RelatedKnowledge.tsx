import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ExternalLink, Scale, Scroll, Clock, FileText } from "lucide-react";
import { Link } from "wouter";

const categoryLabels: Record<string, string> = {
  law: "قانوني",
  jurisprudence: "فقهي",
  majalla: "مجلة الأحكام",
  historical: "تاريخي",
  administrative: "إداري",
  reference: "مرجع",
};

const categoryIcons: Record<string, any> = {
  law: Scale,
  jurisprudence: BookOpen,
  majalla: Scroll,
  historical: Clock,
  administrative: FileText,
  reference: BookOpen,
};

interface RelatedKnowledgeProps {
  query: string;
}

export function RelatedKnowledge({ query }: RelatedKnowledgeProps) {
  // استخدام any type مؤقتاً لتجاوز مشكلة الـ types
  const knowledgeRouter = trpc.knowledge as any;
  const { data: searchResults, isLoading } = knowledgeRouter.search.useQuery(
    {
      query,
      limit: 5,
    },
    {
      enabled: query.length > 3, // فقط ابحث إذا كان الاستعلام أطول من 3 أحرف
    }
  );

  if (!query || query.length <= 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            مراجع ذات صلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-4">
            ابدأ المحادثة لعرض المراجع ذات الصلة
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            مراجع ذات صلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!searchResults || searchResults.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            مراجع ذات صلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-4">
            لا توجد مراجع ذات صلة بهذا الموضوع
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          مراجع ذات صلة ({searchResults.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {searchResults.items.map((doc: any) => {
          const Icon = categoryIcons[doc.category] || BookOpen;
          return (
            <Link key={doc.id} href={`/knowledge-base/${doc.id}`}>
              <div className="p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="flex items-start gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <Icon className="h-3 w-3 ml-1" />
                    {categoryLabels[doc.category]}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                  {doc.title}
                </h4>
                {doc.source && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    المصدر: {doc.source}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                  <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-600" />
                </div>
              </div>
            </Link>
          );
        })}
        {searchResults.total > 5 && (
          <Link href={`/knowledge-base?query=${encodeURIComponent(query)}`}>
            <div className="text-center py-2">
              <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                عرض جميع النتائج ({searchResults.total})
              </span>
            </div>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
