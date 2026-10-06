import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { DEFAULT_THEME, THEME_INIT_SCRIPT } from "@/shared/theme/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSON Viewer",
  description: "Valida, formatea, minifica y explora JSON en árbol. Todo se procesa en tu navegador.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: extensiones (p. ej. ColorZilla) añaden atributos al <body>. */}
      <body className="h-full overflow-hidden" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">{THEME_INIT_SCRIPT}</Script>
        {children}
      </body>
    </html>
  );
}
