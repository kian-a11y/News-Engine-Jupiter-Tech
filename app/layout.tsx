import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FX News Engine — Jupiter Tech",
  description:
    "AI-powered FX market intelligence for CFD brokers. Turn today's news into ready-to-use market briefs, social posts, risk alerts, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
