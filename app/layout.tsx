import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Scanner Web",
  description: "Real-time barcode scan data monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
