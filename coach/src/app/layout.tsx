import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { SettingsProvider } from "@/components/settings";

export const metadata: Metadata = {
  title: "Relocation Coach",
  description: "Relearn .NET, learn French, land a sponsored job in Ireland or the UK.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SettingsProvider>
          <Shell>{children}</Shell>
        </SettingsProvider>
      </body>
    </html>
  );
}
