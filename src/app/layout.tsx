import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { SyncProvider } from "@/components/layout/SyncProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAANG Study",
  description: "Study platform for FAANG interview preparation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <SyncProvider />
          <CommandPalette />
          <div className="flex h-screen">
            <Sidebar />
            <MobileNav />
            <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-10 pt-[4.75rem] md:pt-10 pb-16 md:pb-16">
              {children}
            </main>
          </div>
          <PomodoroTimer />
        </ThemeProvider>
      </body>
    </html>
  );
}
