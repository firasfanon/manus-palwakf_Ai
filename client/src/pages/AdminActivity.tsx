import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, HelpCircle, RefreshCw } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function AdminActivity() {
  const [type, setType] = useState<"all" | "conversations" | "messages" | "faqs">("all");
  const [limit, setLimit] = useState(50);

  const { data: activities, isLoading, refetch } = trpc.admin.activityLog.useQuery({
    type,
    limit,
  });

  const typeLabels: Record<string, string> = {
    all: "الكل",
    conversation: "محادثة",
    message: "رسالة",
    faq: "سؤال شائع",
  };

  const typeIcons: Record<string, any> = {
    conversation: MessageSquare,
    message: MessageSquare,
    faq: HelpCircle,
  };

  return (
    <div dir="rtl" className="container mx-auto py-8">
            <Breadcrumbs items={[
        {label: "لوحة التحكم", href: "/admin/dashboard"},
        {label: "سجل النشاط"},
      ]} />

<div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">سجل النشاط</h1>
        <p className="text-muted-foreground">
          متابعة آخر الأنشطة والأحداث في النظام
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={type} onValueChange={(value: any) => setType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنشطة</SelectItem>
            <SelectItem value="conversations">المحادثات</SelectItem>
            <SelectItem value="faqs">الأسئلة الشائعة</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={limit.toString()}
          onValueChange={(value) => setLimit(parseInt(value))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 نشاط</SelectItem>
            <SelectItem value="50">50 نشاط</SelectItem>
            <SelectItem value="100">100 نشاط</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">لا توجد أنشطة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = typeIcons[activity.type] || MessageSquare;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {typeLabels[activity.type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          #{activity.id}
                        </span>
                      </div>
                      <p className="font-medium mb-1">{activity.title}</p>
                      {activity.userName && (
                        <p className="text-sm text-muted-foreground">
                          بواسطة: {activity.userName}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground text-left">
                      {new Date(activity.createdAt).toLocaleString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
