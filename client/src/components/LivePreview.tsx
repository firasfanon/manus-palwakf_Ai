import { Card } from "@/components/ui/card";

interface LivePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  fontSize: string;
}

export function LivePreview({
  primaryColor,
  secondaryColor,
  backgroundColor,
  textColor,
  accentColor,
  headingFont,
  bodyFont,
  fontSize,
}: LivePreviewProps) {
  const previewStyles = {
    "--preview-primary": primaryColor,
    "--preview-secondary": secondaryColor,
    "--preview-background": backgroundColor,
    "--preview-text": textColor,
    "--preview-accent": accentColor,
    fontFamily: bodyFont,
    fontSize: fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px",
  } as React.CSSProperties;

  return (
    <div className="sticky top-4">
      <h3 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
        معاينة مباشرة
      </h3>
      <Card className="p-6 space-y-6" style={previewStyles}>
        {/* Header Preview */}
        <div className="pb-4 border-b" style={{ borderColor: primaryColor + "20" }}>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: headingFont,
              color: primaryColor,
            }}
          >
            عنوان رئيسي
          </h1>
          <p style={{ color: textColor, opacity: 0.8 }}>
            هذا نص تجريبي لعرض كيفية ظهور المحتوى مع الإعدادات الحالية
          </p>
        </div>

        {/* Buttons Preview */}
        <div className="space-y-3">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: headingFont, color: textColor }}
          >
            الأزرار
          </h3>
          <div className="flex gap-3 flex-wrap">
            <button
              className="px-4 py-2 rounded-md font-medium transition-colors"
              style={{
                backgroundColor: primaryColor,
                color: "#ffffff",
              }}
            >
              زر أساسي
            </button>
            <button
              className="px-4 py-2 rounded-md font-medium transition-colors"
              style={{
                backgroundColor: secondaryColor,
                color: "#ffffff",
              }}
            >
              زر ثانوي
            </button>
            <button
              className="px-4 py-2 rounded-md font-medium border-2 transition-colors"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: "transparent",
              }}
            >
              زر محدد
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="space-y-3">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: headingFont, color: textColor }}
          >
            البطاقات
          </h3>
          <div
            className="p-4 rounded-lg border"
            style={{
              borderColor: primaryColor + "30",
              backgroundColor: backgroundColor,
            }}
          >
            <h4
              className="font-semibold mb-2"
              style={{ fontFamily: headingFont, color: primaryColor }}
            >
              عنوان البطاقة
            </h4>
            <p style={{ color: textColor }}>
              محتوى البطاقة يظهر هنا. هذا نص تجريبي لعرض كيفية ظهور النصوص داخل البطاقات.
            </p>
            <div className="mt-3 flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: accentColor + "20",
                  color: accentColor,
                }}
              >
                وسم
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: secondaryColor + "20",
                  color: secondaryColor,
                }}
              >
                تصنيف
              </span>
            </div>
          </div>
        </div>

        {/* Text Preview */}
        <div className="space-y-3">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ fontFamily: headingFont, color: textColor }}
          >
            النصوص
          </h3>
          <p style={{ color: textColor }}>
            هذا نص عادي يوضح كيفية ظهور الفقرات في الموقع. يمكنك ملاحظة تأثير اختيار الخط وحجمه على سهولة القراءة.
          </p>
          <p style={{ color: accentColor }}>
            هذا نص بلون التمييز لإبراز المعلومات المهمة.
          </p>
        </div>

        {/* Link Preview */}
        <div className="space-y-2">
          <a
            href="#"
            className="inline-block font-medium hover:underline"
            style={{ color: primaryColor }}
            onClick={(e) => e.preventDefault()}
          >
            رابط تجريبي ←
          </a>
        </div>
      </Card>
    </div>
  );
}
