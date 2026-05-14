import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SurgiAuth",
  description: "Agente de pre-autorizacion quirurgica en tiempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
