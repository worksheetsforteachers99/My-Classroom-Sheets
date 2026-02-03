import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { geistSans, geistMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "My Classroom Sheets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white text-slate-900 antialiased pt-44 md:pt-20`}
      >
        <AuthProvider>
          <AuthModalProvider>
            <Header />
            <main>{children}</main>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
