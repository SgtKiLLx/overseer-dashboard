import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import { Viewport } from "next";

export const metadata = {
  title: "OVERSEER // CMD",
  description: "Ark Tribe Management Terminal",
  manifest: "/manifest.json", // Links the app manifest
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
        <link rel="icon" href="/icon.png" />
      </head>
      <body className="antialiased bg-black">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
