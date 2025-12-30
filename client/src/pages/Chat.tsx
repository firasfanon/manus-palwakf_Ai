import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// ScrollArea removed - using plain div with overflow-y-auto
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, Download, Loader2, MessageSquare, Paperclip, Plus, Scale, Search, Send, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { ReferencesDisplay } from "@/components/ReferencesDisplay";
import { TypingIndicator } from "@/components/TypingIndicator";
import { MessageRating } from "@/components/MessageRating";
import { SuggestedQuestions } from "@/components/SuggestedQuestions";
import { exportConversationToPDF } from "@/lib/exportPDF";

export default function Chat() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const extractTextMutation = trpc.file.extractText.useMutation();

  // Handle URL parameters (message from Home page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMessage = params.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
      // Clear URL params after reading
      window.history.replaceState({}, '', '/chat');
    }
  }, []);

  const handleExportPDF = () => {
    if (!conversationData?.messages) return;
    
    const messages = conversationData.messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      references: msg.references,
    }));
    
    const title = conversationData.conversation.title || "محادثة جديدة";
    exportConversationToPDF(messages, title);
  };

  const { data: conversations, refetch: refetchConversations } = trpc.chat.myConversations.useQuery();
  
  // Filter conversations based on search query
  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (conv.title || "محادثة جديدة").toLowerCase();
    return title.includes(query);
  });
  const { data: conversationData, refetch: refetchMessages } = trpc.chat.getConversation.useQuery(
    { id: currentConversationId! },
    { enabled: !!currentConversationId }
  );

  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      refetchConversations();
      if (currentConversationId === deletingConversationId) {
        setCurrentConversationId(null);
      }
      setDeletingConversationId(null);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversationMutation.mutateAsync({
        category: "general",
      });
      setCurrentConversationId(newConv.id);
      await refetchConversations();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentConversationId || isSubmitting) return;

    setIsSubmitting(true);
    let userMessage = message;
    
    // Append file content if uploaded
    if (uploadedFile && extractedText) {
      userMessage = `${message}\n\n[ملف مرفق: ${uploadedFile.name}]\n${extractedText}`;
    }
    
    setMessage("");
    setUploadedFile(null);
    setExtractedText("");

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        message: userMessage,
      });
      await refetchMessages();
      await refetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessage(message); // Restore original message without file content
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: "عام",
      legal: "قانوني",
      jurisprudence: "فقهي",
      administrative: "إداري",
      historical: "تاريخي",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      legal: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      jurisprudence: "bg-green-500/10 text-green-700 dark:text-green-400",
      administrative: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      historical: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
    return colors[category] || colors.general;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">يجب تسجيل الدخول</h2>
            <p className="text-muted-foreground">الرجاء تسجيل الدخول للوصول إلى المحادثة</p>
            <Button asChild>
              <Link href="/">العودة للرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Scale className="w-6 h-6 text-primary" />
                <h1 className="text-lg font-bold">المحادثة مع النموذج</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentConversationId && conversationData?.messages && conversationData.messages.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <Download className="w-4 h-4 ml-1" />
                  تصدير PDF
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/faqs">
                  <BookOpen className="w-4 h-4 ml-1" />
                  الأسئلة الشائعة
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-l bg-card/30 flex flex-col">
          <div className="p-4 border-b space-y-3">
            <Button className="w-full" onClick={handleNewConversation} disabled={createConversationMutation.isPending}>
              {createConversationMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              محادثة جديدة
            </Button>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ابحث في المحادثات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {filteredConversations && filteredConversations.length === 0 && searchQuery && (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد محادثات مطابقة</p>
                  <p className="text-xs text-muted-foreground mt-1">جرّب البحث بكلمات أخرى</p>
                </div>
              )}
              {filteredConversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`relative group rounded-lg transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  <button
                    onClick={() => setCurrentConversationId(conv.id)}
                    className="w-full text-right p-3 pr-10"
                  >
                    <div className={`font-medium text-sm line-clamp-2 ${
                      currentConversationId === conv.id ? "text-primary" : "text-foreground"
                    }`}>
                      {conv.title || "محادثة جديدة"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString("ar-EG")}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("هل أنت متأكد من حذف هذه المحادثة؟")) {
                        setDeletingConversationId(conv.id);
                        deleteConversationMutation.mutate({ id: conv.id });
                      }
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    disabled={deletingConversationId === conv.id}
                  >
                    {deletingConversationId === conv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
              {!conversations?.length && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  لا توجد محادثات سابقة
                  <br />
                  ابدأ محادثة جديدة
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {currentConversationId ? (
            <>
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6">
                  {conversationData?.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose-arabic">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.sources && msg.role === "assistant" && (
                          <ReferencesDisplay references={JSON.parse(msg.sources)} />
                        )}
                        {msg.role === "assistant" && (
                          <MessageRating messageId={msg.id} />
                        )}
                      </div>
                    </div>
                  ))}
                  {isSubmitting && <TypingIndicator />}
                  {!conversationData?.messages.length && !isSubmitting && (
                    <SuggestedQuestions
                      onQuestionClick={(question) => {
                        setMessage(question);
                        // Auto-submit after a short delay to allow state update
                        setTimeout(() => {
                          const form = document.querySelector('form');
                          if (form) {
                            form.requestSubmit();
                          }
                        }, 100);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t bg-card/50 p-4">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                  {/* File upload display */}
                  {uploadedFile && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{uploadedFile.name}</span>
                        {extractTextMutation.isPending && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedFile(null);
                          setExtractedText("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                          
                          // Extract text
                          try {
                            const reader = new FileReader();
                            const fileData = await new Promise<string>((resolve, reject) => {
                              reader.onload = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                resolve(base64);
                              };
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });

                            const result = await extractTextMutation.mutateAsync({
                              fileData,
                              mimeType: file.type,
                            });

                            if (result.success && result.text) {
                              setExtractedText(result.text);
                            } else {
                              alert(result.error || "فشل استخراج النص");
                              setUploadedFile(null);
                            }
                          } catch (error) {
                            console.error("File extraction error:", error);
                            alert("حدث خطأ أثناء معالجة الملف");
                            setUploadedFile(null);
                          }
                        }
                      }}
                    />
                    
                    {/* Paperclip button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب سؤالك هنا..."
                      className="flex-1 text-base"
                      disabled={isSubmitting}
                    />
                    <Button type="submit" disabled={!message.trim() || isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  {conversationData?.conversation && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>التصنيف:</span>
                      <Badge className={getCategoryColor(conversationData.conversation.category)} variant="outline">
                        {getCategoryLabel(conversationData.conversation.category)}
                      </Badge>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">مرحباً بك</h2>
                <p className="text-muted-foreground max-w-md">
                  اختر محادثة من القائمة أو ابدأ محادثة جديدة للحصول على استشارات حول الأوقاف الإسلامية
                </p>
                <Button onClick={handleNewConversation}>
                  <Plus className="w-4 h-4 ml-2" />
                  ابدأ محادثة جديدة
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
