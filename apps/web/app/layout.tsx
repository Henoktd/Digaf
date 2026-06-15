import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/src/components/AppShell";
import { ToastProvider } from "@/src/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Digaf Shareholder Governance Platform",
  description:
    "Shareholder governance and engagement portal for Digaf Microcredit Provider SC",
  icons: {
    icon: "/logos/digaf-logo.svg",
    shortcut: "/logos/digaf-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
