import "./globals.css";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata = {
  title: "OVERSEER // CMD",
  description: "Ark Tribe Management Terminal",
  icons: {
    icon: "/icon.png", // This ensures it finds your new file
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}
