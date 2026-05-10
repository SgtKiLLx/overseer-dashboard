import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import GlowCursor from "@/components/GlowCursor";
import { Viewport } from "next";

export const metadata = {
  // 1. REBRANDING: Update the Browser Tab Name
  title: "ArkSentinel // CMD", 
  description: "Ark Tribe Management Terminal",
  
  // 2. APP SETTINGS: Links your icon and manifest
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ArkSentinel",
  },
};

// 3. THE NOTCH FIX: This tells the phone to use the full screen
// and enables the "Safe Area" padding we added to your CSS.
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // This is the "Magic Fix" for the Android notch clipping
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Ensures your custom icon shows in the browser and on home screens */}
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="bg-black antialiased">
        <SessionWrapper>
          {/* The subtle glow that follows your mouse on desktop */}
          <GlowCursor /> 
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
