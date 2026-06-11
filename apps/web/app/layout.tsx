import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/src/components/AppShell";
import { ToastProvider } from "@/src/components/Toast";

export const metadata: Metadata = {
  title: "Digaf Shareholder Governance Platform",
  description:
    "Shareholder governance and engagement portal for Digaf Microcredit Provider SC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
