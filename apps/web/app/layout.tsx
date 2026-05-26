import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/src/components/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
