import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Viewport } from "next";

export const metadata = {
  title: "OVERSEER // CMD",
  description: "Ark Tribe Management Terminal",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Overseer",
  },
};

// This ensures the top bar on your phone matches the deep black theme
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* This tells the browser to use the file you just uploaded */}
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased bg-black">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
