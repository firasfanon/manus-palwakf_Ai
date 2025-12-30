export interface Theme {
  name: string;
  label: string;
  description: string;
  colors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  fonts: {
    headingFont: string;
    bodyFont: string;
  };
}

export const predefinedThemes: Theme[] = [
  {
    name: "light",
    label: "فاتح",
    description: "ثيم فاتح كلاسيكي مع ألوان هادئة",
    colors: {
      primaryColor: "#3b82f6", // Blue
      secondaryColor: "#8b5cf6", // Purple
      accentColor: "#10b981", // Green
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },
  {
    name: "dark",
    label: "داكن",
    description: "ثيم داكن عصري مريح للعين",
    colors: {
      primaryColor: "#60a5fa", // Light Blue
      secondaryColor: "#a78bfa", // Light Purple
      accentColor: "#34d399", // Light Green
      backgroundColor: "#111827",
      textColor: "#f9fafb",
    },
    fonts: {
      headingFont: "Amiri",
      bodyFont: "Noto Sans Arabic",
    },
  },
  {
    name: "ocean",
    label: "المحيط",
    description: "ثيم أزرق مستوحى من البحر",
    colors: {
      primaryColor: "#0ea5e9", // Sky Blue
      secondaryColor: "#06b6d4", // Cyan
      accentColor: "#14b8a6", // Teal
      backgroundColor: "#f0f9ff",
      textColor: "#0c4a6e",
    },
    fonts: {
      headingFont: "Almarai",
      bodyFont: "Tajawal",
    },
  },
  {
    name: "forest",
    label: "الغابة",
    description: "ثيم أخضر مستوحى من الطبيعة",
    colors: {
      primaryColor: "#22c55e", // Green
      secondaryColor: "#84cc16", // Lime
      accentColor: "#eab308", // Yellow
      backgroundColor: "#f0fdf4",
      textColor: "#14532d",
    },
    fonts: {
      headingFont: "Harmattan",
      bodyFont: "Cairo",
    },
  },
];
