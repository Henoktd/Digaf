import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/src/components/AppShell";

export const metadata: Metadata = {
  title: "SVH Governance Platform",
  description: "Shareholder Governance and Engagement Platform",
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