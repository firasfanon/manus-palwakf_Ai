import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from "lucide-react";

export default function Footer() {
  const { settings } = useSiteSettings();

  // Map platform names to icons
  const iconMap: Record<string, any> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    email: Mail,
  };

  const getIcon = (platform: string) => {
    const key = platform.toLowerCase();
    return iconMap[key] || Mail;
  };

  const socialLinks = settings?.socialLinks 
    ? JSON.parse(settings.socialLinks) 
    : [];

  const footerText = settings?.footerText || `© ${new Date().getFullYear()} جميع الحقوق محفوظة`;

  return (
    <footer className="border-t bg-card/50 backdrop-blur-sm mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright Text */}
          <div className="text-sm text-muted-foreground">
            {footerText}
          </div>

          {/* Social Links */}
          {settings?.showSocialLinks && socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((link: { platform: string; url: string }, index: number) => {
                const Icon = getIcon(link.platform);
                return (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={link.platform}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
