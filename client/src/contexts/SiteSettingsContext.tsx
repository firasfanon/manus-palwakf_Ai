import { createContext, useContext, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type SiteSettings = {
  id: number;
  siteName: string;
  siteDescription: string | null;
  siteLanguage: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  accentColor: string | null;
  headingFont: string | null;
  bodyFont: string | null;
  baseFontSize: number | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  menuItems: string | null;
  footerText: string | null;
  showSocialLinks: boolean | null;
  socialLinks: string | null;
  theme: "light" | "dark" | "auto" | null;
  updatedAt: Date;
  updatedBy: number | null;
};

interface SiteSettingsContextType {
  settings: SiteSettings | undefined;
  isLoading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(
  undefined
);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading, refetch } = trpc.siteSettings.get.useQuery();

  // Apply settings to CSS variables and document
  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    // Apply colors as CSS variables (using Tailwind's variable names)
    if (settings.primaryColor) root.style.setProperty("--primary", settings.primaryColor);
    if (settings.secondaryColor) root.style.setProperty("--secondary", settings.secondaryColor);
    if (settings.backgroundColor) root.style.setProperty("--background", settings.backgroundColor);
    if (settings.textColor) root.style.setProperty("--foreground", settings.textColor);
    if (settings.accentColor) root.style.setProperty("--accent", settings.accentColor);

    // Apply fonts
    if (settings.headingFont) root.style.setProperty("--font-heading", settings.headingFont);
    if (settings.bodyFont) root.style.setProperty("--font-body", settings.bodyFont);
    if (settings.baseFontSize) root.style.setProperty("--font-size-base", `${settings.baseFontSize}px`);

    // Update document title
    if (settings.siteName) {
      document.title = settings.siteName;
    }

    // Update meta description
    if (settings.siteDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", settings.siteDescription);
    }

    // Update favicon
    if (settings.faviconUrl) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = settings.faviconUrl;
    }

    // Load Google Fonts dynamically
    const fontsToLoad: string[] = [];
    if (settings.headingFont) {
      const fontName = settings.headingFont.split("'")[1] || settings.headingFont.split('"')[1];
      if (fontName && !fontName.includes('sans-serif') && !fontName.includes('serif')) {
        fontsToLoad.push(fontName);
      }
    }
    if (settings.bodyFont) {
      const fontName = settings.bodyFont.split("'")[1] || settings.bodyFont.split('"')[1];
      if (fontName && !fontName.includes('sans-serif') && !fontName.includes('serif') && !fontsToLoad.includes(fontName)) {
        fontsToLoad.push(fontName);
      }
    }

    if (fontsToLoad.length > 0) {
      // Remove existing Google Fonts link if any
      const existingLink = document.querySelector('link[data-google-fonts]');
      if (existingLink) {
        existingLink.remove();
      }

      // Create new Google Fonts link
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.setAttribute('data-google-fonts', 'true');
      const fontFamilies = fontsToLoad.map(f => f.replace(/ /g, '+')).join('&family=');
      fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
      document.head.appendChild(fontLink);
    }

  }, [settings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, isLoading, refetch }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
