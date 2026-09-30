import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TopBar } from "@/components/layout/TopBar";
import { BottomTabs } from "@/components/layout/BottomTabs";
import { CommandPalette } from "@/components/search/CommandPalette";
import { SyncProvider } from "@/components/layout/SyncProvider";
import { OfflineSupport } from "@/components/layout/OfflineSupport";

export const metadata: Metadata = {
  title: "FAANG Study",
  description: "Study platform for FAANG interview preparation",
  applicationName: "FAANG Study",
  appleWebApp: { capable: true, title: "FAANG Study", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f12" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <ThemeProvider>
          <SyncProvider />
          <OfflineSupport />
          <CommandPalette />
          <TopBar />
          <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 md:pb-20 md:pt-8">
            {children}
          </main>
          <BottomTabs />
        </ThemeProvider>
      </body>
    </html>
  );
}
