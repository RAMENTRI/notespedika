import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notespedika",
  description: "An educational document-sharing platform powered by credits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
