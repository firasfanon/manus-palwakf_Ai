import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLoginUrl } from "@/const";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { BookOpen, LogIn, LogOut, MessageSquare, Scale, Search, Sparkles, UserPlus, Users, Paperclip, Mic, Send, User, Loader2, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const extractTextMutation = trpc.file.extractText.useMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const MAX_GUEST_MESSAGES = 3;
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const chatMutation = trpc.chat.sendMessage.useMutation();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick questions pool
  const allQuestions = [
    { text: "ما هي شروط الوقف في الفقه الإسلامي؟", icon: BookOpen, color: "text-green-600" },
    { text: "كيف يتم توثيق الحجج الوقفية في فلسطين؟", icon: Scale, color: "text-purple-600" },
    { text: "ما الفرق بين الوقف الذري والوقف الخيري؟", icon: BookOpen, color: "text-green-600" },
    { text: "كيف تُدار الأموال الوقفية وفق القانون الفلسطيني؟", icon: Scale, color: "text-purple-600" },
    { text: "ما هي أنواع الأوقاف في الشريعة الإسلامية؟", icon: BookOpen, color: "text-green-600" },
    { text: "كيف يتم تسجيل الوقف قانونياً في فلسطين؟", icon: Scale, color: "text-purple-600" },
    { text: "ما هي حقوق المستفيدين من الوقف؟", icon: Users, color: "text-blue-600" },
    { text: "كيف يمكن إنهاء الوقف أو تغيير شروطه؟", icon: Scale, color: "text-purple-600" },
    { text: "ما هي واجبات ناظر الوقف؟", icon: Users, color: "text-blue-600" },
    { text: "كيف يتم تقييم الأملاك الوقفية؟", icon: Scale, color: "text-purple-600" },
    { text: "ما هي الأحكام الفقهية لوقف العقارات؟", icon: BookOpen, color: "text-green-600" },
    { text: "كيف يتم حل النزاعات الوقفية؟", icon: Scale, color: "text-purple-600" },
  ];

  // Randomly select 4 questions on component mount
  const [displayedQuestions] = useState(() => {
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  });

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    // تحقق من حد الرسائل للزوار
    if (!isAuthenticated) {
      if (guestMessageCount >= MAX_GUEST_MESSAGES) {
        setShowLimitDialog(true);
        return;
      }
      setGuestMessageCount(prev => prev + 1);
    }

    // إضافة رسالة المستخدم
    const userMessage = { role: "user" as const, content: message };
    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");
    setShowChat(true);

    // للمستخدمين المسجلين: إرسال للنموذج
    if (isAuthenticated) {
      try {
        // إنشاء conversation إذا لم يكن موجوداً
        let convId = conversationId;
        if (!convId) {
          const newConv = await createConversationMutation.mutateAsync({
            title: currentMessage.substring(0, 100),
            category: "general",
          });
          convId = newConv.id;
          setConversationId(convId);
        }

        // إرسال الرسالة
        const response = await chatMutation.mutateAsync({
          conversationId: convId,
          message: currentMessage,
        });

        // إضافة رد النموذج
        setChatMessages(prev => [...prev, { role: "assistant", content: response.message }]);
      } catch (error) {
        console.error("Chat error:", error);
        setChatMessages(prev => [...prev, { 
          role: "assistant", 
          content: "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى." 
        }]);
      }
    } else {
      // للزوار: عرض رسالة توضيحية
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "مرحباً! للحصول على إجابات مفصلة ومحادثات غير محدودة، يرجى تسجيل الدخول." 
      }]);
    }
  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleVoiceInput = () => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("متصفحك لا يدعم ميزة التعرف على الصوت. الرجاء استخدام Chrome أو Edge.");
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      return;
    }

    // Start recording
    setIsRecording(true);
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA"; // Arabic language
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage((prev) => prev + (prev ? " " : "") + transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      
      if (event.error === "not-allowed") {
        alert("الرجاء السماح باستخدام الميكروفون في إعدادات المتصفح.");
      } else if (event.error === "no-speech") {
        alert("لم يتم التعرف على أي كلام. الرجاء المحاولة مرة أخرى.");
      } else {
        alert(`حدث خطأ: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsRecording(false);
      alert("فشل بدء التسجيل. الرجاء المحاولة مرة أخرى.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="pt-8 pb-16">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>مدعوم بالذكاء الصناعي المتقدم</span>
            </div>
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              مساعدك الذكي المتخصص في
              <br />
              <span className="text-primary">الأوقاف الإسلامية في فلسطين</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              نموذج ذكاء صناعي شامل يستند إلى القوانين الفلسطينية، مجلة الأحكام العدلية، والمراجع الشرعية
              والتاريخية لتقديم استشارات دقيقة حول الأوقاف الإسلامية
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <>
                  {/* زر المحادثة - أكبر وأكثر بروزاً */}
                  <Button size="lg" asChild className="text-xl px-12 py-6 shadow-lg hover:shadow-xl transition-all">
                    <Link href="/chat">
                      <MessageSquare className="w-6 h-6 ml-2" />
                      ابدأ المحادثة الآن
                    </Link>
                  </Button>
                  
                  {/* الأزرار الثانوية */}
                  <div className="flex items-center gap-3">
                    <Button size="lg" variant="outline" asChild className="text-base px-6">
                      <Link href="/faqs">
                        <BookOpen className="w-4 h-4 ml-2" />
                        الأسئلة الشائعة
                      </Link>
                    </Button>
                    <Button size="lg" variant="ghost" onClick={handleLogout} className="text-base px-6">
                      <LogOut className="w-4 h-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* زر المحادثة معطل للزوار */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button 
                            size="lg" 
                            disabled 
                            className="text-xl px-12 py-6 shadow-lg opacity-60 cursor-not-allowed"
                          >
                            <MessageSquare className="w-6 h-6 ml-2" />
                            ابدأ المحادثة الآن
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-base p-4">
                        <p className="font-medium">سجّل الدخول للاستفادة من جميع الخدمات</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* الأزرار الثانوية */}
                  <div className="flex items-center gap-3">
                    <Button size="lg" variant="outline" asChild className="text-base px-6">
                      <a href={getLoginUrl()}>
                        <LogIn className="w-4 h-4 ml-2" />
                        تسجيل الدخول
                      </a>
                    </Button>
                    <Button size="lg" variant="ghost" asChild className="text-base px-6">
                      <a href={getLoginUrl()}>
                        <UserPlus className="w-4 h-4 ml-2" />
                        إنشاء حساب
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="text-base px-6">
                      <Link href="/faqs">
                        <BookOpen className="w-4 h-4 ml-2" />
                        الأسئلة الشائعة
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Chat Box - moved here under buttons */}
            <div className="mt-8 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">جرّب النموذج الآن</h3>
              <p className="text-muted-foreground">اطرح سؤالك واحصل على إجابة فورية</p>
            </div>
            
            {/* عرض المحادثة inline - فوق مربع السؤال */}
            {showChat && chatMessages.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        المحادثة
                      </CardTitle>
                      <CardDescription>
                        {!isAuthenticated && `${guestMessageCount}/${MAX_GUEST_MESSAGES} رسائل مستخدمة`}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من مسح المحادثة؟ سيتم حذف جميع الرسائل.')) {
                          setChatMessages([]);
                          setShowChat(false);
                          setMessage('');
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      مسح المحادثة
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex gap-3 p-4 rounded-lg",
                          msg.role === "user" 
                            ? "bg-primary/10 ml-8" 
                            : "bg-muted mr-8"
                        )}
                      >
                        <div className="flex-shrink-0">
                          {msg.role === "user" ? (
                            <User className="h-5 w-5 text-primary" />
                          ) : (
                            <Sparkles className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          {msg.role === "assistant" ? (
                            <Streamdown>{msg.content}</Streamdown>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {chatMutation.isPending && (
                      <div className="flex gap-3 p-4 rounded-lg bg-muted mr-8">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">جاري الكتابة...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* مربع السؤال - مصغر مثل Manus */}
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Textarea مصغر */}
                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب سؤالك هنا..."
                      className="min-h-[80px] max-h-[200px] resize-none pr-4 text-sm leading-relaxed"
                      style={{ overflow: "hidden" }}
                    />
                  </div>

                  {/* Selected File Display */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{selectedFile.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFile(null)}
                      >
                        حذف
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isAuthenticated ? (
                        <>
                          {/* File Upload Button - للمسجلين فقط */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            title="إرفاق ملف"
                          >
                            <Paperclip className="w-5 h-5" />
                          </Button>

                          {/* Voice Input Button - للمسجلين فقط */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleVoiceInput}
                            className={isRecording ? "bg-red-100 border-red-300 animate-pulse" : ""}
                            title={isRecording ? "اضغط لإيقاف التسجيل" : "إدخال صوتي"}
                          >
                            <Mic className={`w-5 h-5 ${isRecording ? "text-red-600" : ""}`} />
                          </Button>
                          {isRecording && (
                            <span className="text-xs text-red-600 animate-pulse">جاري التسجيل...</span>
                          )}
                        </>
                      ) : (
                        <>
                          {/* أزرار معطلة للزوار مع tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    <Paperclip className="w-5 h-5" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>سجّل الدخول لرفع الملفات</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    <Mic className="w-5 h-5" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>سجّل الدخول لاستخدام المساعد الصوتي</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                    </div>

                    {/* Send Button */}
                    <Button
                      size="lg"
                      onClick={handleSend}
                      disabled={!message.trim() && !selectedFile}
                      className="px-8"
                    >
                      <Send className="w-5 h-5 ml-2" />
                      إرسال
                    </Button>
                  </div>

                  {/* Helper Text */}
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-muted-foreground">
                      اضغط Enter للإرسال أو Shift+Enter لسطر جديد
                    </p>
                    {!isAuthenticated && (
                      <p className="text-primary font-medium">
                        {MAX_GUEST_MESSAGES - guestMessageCount} رسائل متبقية
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Quick Question Examples */}
            <div className="mt-8">
              <p className="text-sm text-muted-foreground text-center mb-4">أو جرّب أحد هذه الأسئلة:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {displayedQuestions.map((q, index) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setMessage(q.text)}
                      className="p-4 text-right border-2 border-muted hover:border-primary/50 rounded-lg transition-all bg-card hover:bg-accent/10 hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${q.color} group-hover:scale-110 transition-transform`} />
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {q.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">المميزات الرئيسية</h3>
            <p className="text-muted-foreground text-lg">نظام متكامل لخدمة الباحثين والمختصين في مجال الأوقاف</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>محادثة ذكية تفاعلية</CardTitle>
                <CardDescription>
                  تفاعل مباشر مع النموذج للحصول على إجابات فورية ودقيقة حول أي استفسار يتعلق بالأوقاف الإسلامية
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>مرجعية قانونية شاملة</CardTitle>
                <CardDescription>
                  يستند النموذج إلى القوانين الفلسطينية الحالية، مجلة الأحكام العدلية العثمانية، والتشريعات
                  التاريخية
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>مراجع فقهية موثوقة</CardTitle>
                <CardDescription>
                  يعتمد على المصادر الفقهية الإسلامية المعتمدة والأحكام الشرعية المتعلقة بالوقف وشروطه وأنواعه
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>بحث متقدم في المعرفة</CardTitle>
                <CardDescription>
                  نظام بحث ذكي يستخدم تقنيات RAG للعثور على المعلومات الأكثر صلة من قاعدة المعرفة الشاملة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>استشارات متخصصة</CardTitle>
                <CardDescription>
                  يقدم استشارات قانونية وشرعية متخصصة في مجالات إدارة الأوقاف، التوثيق، والإجراءات الإدارية
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>تصنيف تلقائي للأسئلة</CardTitle>
                <CardDescription>
                  يحلل النموذج طبيعة السؤال تلقائياً ويصنفه (قانوني، فقهي، إداري، تاريخي) لتقديم إجابة أكثر دقة
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">المجالات المغطاة</h3>
              <p className="text-muted-foreground text-lg">يغطي النموذج جميع جوانب الأوقاف الإسلامية في فلسطين</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">القوانين والتشريعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>قانون الأوقاف والشؤون الدينية رقم 26 لسنة 1966 وتعديلاته</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>قرار بقانون رقم 2 لسنة 2023 بشأن تعديل قانون الأوقاف</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>التشريعات العثمانية التاريخية المتعلقة بالأوقاف</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">الأحكام الفقهية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>شروط صحة الوقف وأركانه</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>أنواع الأوقاف (خيري، ذري، مختلط)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>أحكام النظارة والإدارة</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">مجلة الأحكام العدلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>القواعد الفقهية الكلية (99 قاعدة)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>أحكام الوقف في المجلة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>التطبيقات القانونية المعاصرة</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">الجوانب الإدارية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>إجراءات توثيق الوقف</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>دور وزارة الأوقاف والجهات المختصة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>إدارة الأموال الوقفية وتنميتها</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t py-8 bg-card/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">نموذج الذكاء الصناعي للأوقاف الإسلامية</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/faqs" className="hover:text-primary transition-colors">
                الأسئلة الشائعة
              </Link>
              <Link href="/knowledge" className="hover:text-primary transition-colors">
                قاعدة المعرفة
              </Link>
              <Link href="/search" className="hover:text-primary transition-colors">
                البحث
              </Link>
            </div>
          </div>
          <div className="text-center mt-6 text-sm text-muted-foreground">
            <p>© 2024 نموذج الذكاء الصناعي للأوقاف الإسلامية في فلسطين. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Dialog للحد الأقصى للرسائل */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              وصلت إلى الحد الأقصى للرسائل
            </DialogTitle>
            <DialogDescription className="text-right pt-4 space-y-4">
              <p>
                لقد استخدمت <strong>{MAX_GUEST_MESSAGES} رسائل مجانية</strong> من أصل {MAX_GUEST_MESSAGES}.
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  للمتابعة والحصول على معلومات أكثر، يرجى تسجيل الدخول للاستفادة من:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>محادثات غير محدودة</li>
                    <li>المساعد الصوتي</li>
                    <li>رفع الملفات وتحليلها</li>
                    <li>حفظ المحادثات</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button asChild className="flex-1">
              <a href={getLoginUrl()}>
                <LogIn className="w-4 h-4 ml-2" />
                تسجيل الدخول
              </a>
            </Button>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)} className="flex-1">
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
