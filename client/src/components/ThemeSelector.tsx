import { predefinedThemes, type Theme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface ThemeSelectorProps {
  onThemeSelect: (theme: Theme) => void;
}

export function ThemeSelector({ onThemeSelect }: ThemeSelectorProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {predefinedThemes.map((theme) => (
        <Card
          key={theme.name}
          className="relative overflow-hidden hover:shadow-lg transition-all"
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {theme.label}
              <Button
                size="sm"
                onClick={() => onThemeSelect(theme)}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                تطبيق
              </Button>
            </CardTitle>
            <CardDescription>{theme.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Preview */}
            <div>
              <p className="text-sm font-medium mb-2">الألوان:</p>
              <div className="flex gap-2">
                <div
                  className="w-12 h-12 rounded-md border-2 border-border"
                  style={{ backgroundColor: theme.colors.primaryColor }}
                  title="اللون الأساسي"
                />
                <div
                  className="w-12 h-12 rounded-md border-2 border-border"
                  style={{ backgroundColor: theme.colors.secondaryColor }}
                  title="اللون الثانوي"
                />
                <div
                  className="w-12 h-12 rounded-md border-2 border-border"
                  style={{ backgroundColor: theme.colors.accentColor }}
                  title="لون التمييز"
                />
                <div
                  className="w-12 h-12 rounded-md border-2 border-border"
                  style={{ backgroundColor: theme.colors.backgroundColor }}
                  title="لون الخلفية"
                />
              </div>
            </div>

            {/* Font Preview */}
            <div>
              <p className="text-sm font-medium mb-2">الخطوط:</p>
              <div className="space-y-2">
                <p
                  className="text-lg font-bold"
                  style={{ fontFamily: theme.fonts.headingFont }}
                >
                  عنوان تجريبي - {theme.fonts.headingFont}
                </p>
                <p
                  className="text-sm"
                  style={{ fontFamily: theme.fonts.bodyFont }}
                >
                  نص تجريبي للمحتوى - {theme.fonts.bodyFont}
                </p>
              </div>
            </div>

            {/* Sample Card */}
            <div
              className="p-4 rounded-lg border-2"
              style={{
                backgroundColor: theme.colors.backgroundColor,
                color: theme.colors.textColor,
                borderColor: theme.colors.primaryColor,
              }}
            >
              <h4
                className="font-bold mb-2"
                style={{
                  fontFamily: theme.fonts.headingFont,
                  color: theme.colors.primaryColor,
                }}
              >
                معاينة الثيم
              </h4>
              <p
                className="text-sm"
                style={{ fontFamily: theme.fonts.bodyFont }}
              >
                هذا نص تجريبي لمعاينة شكل الثيم على الموقع
              </p>
              <button
                className="mt-2 px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: theme.colors.accentColor,
                  color: theme.colors.backgroundColor,
                }}
              >
                زر تجريبي
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
