import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import GlowCursor from "@/components/GlowCursor"; // Import here

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black antialiased">
        <SessionWrapper>
          <GlowCursor /> 
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
