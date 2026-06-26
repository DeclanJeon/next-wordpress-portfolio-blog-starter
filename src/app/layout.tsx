import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmProvider } from "@/components/site/confirm-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PonsLink — A blog about bridges between disciplines",
  description:
    "PonsLink is a writer-driven publication about the bridges between disciplines, languages, and people. Essays, field notes, and slow thinking.",
  keywords: [
    "PonsLink",
    "blog",
    "writing",
    "essays",
    "field notes",
    "writer experience",
  ],
  authors: [{ name: "PonsLink" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "PonsLink — A blog about bridges between disciplines",
    description:
      "A writer-driven publication about the bridges between disciplines, languages, and people.",
    siteName: "PonsLink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PonsLink",
    description:
      "A writer-driven publication about the bridges between disciplines, languages, and people.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ConfirmProvider>
            {children}
            <Toaster />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
