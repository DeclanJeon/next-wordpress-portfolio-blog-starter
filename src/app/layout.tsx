import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: "Wren Halloway — Designer & Writer",
  description:
    "Wren Halloway is a designer and writer based in Lisbon, working on branding, digital products, and quiet interfaces that ease and beautify the small moments.",
  keywords: [
    "Wren Halloway",
    "designer",
    "writer",
    "portfolio",
    "brand identity",
    "digital product design",
    "editorial design",
  ],
  authors: [{ name: "Wren Halloway" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Wren Halloway — Designer & Writer",
    description:
      "Designer and writer based in Lisbon. Branding, digital products, and quiet interfaces.",
    siteName: "Wren Halloway",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wren Halloway — Designer & Writer",
    description:
      "Designer and writer based in Lisbon. Branding, digital products, and quiet interfaces.",
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
