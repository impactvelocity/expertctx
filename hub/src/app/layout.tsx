import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import "./globals.css";

// Cal Sans: one variable file for UI text and display headings (OFL).
const calSans = localFont({
  src: "../fonts/CalSansVF.woff2",
  variable: "--font-sans",
  weight: "400 700",
  display: "swap",
});

const calSansHeading = localFont({
  src: "../fonts/CalSansVF.woff2",
  variable: "--font-heading",
  weight: "400 700",
  display: "swap",
});

const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ExpertCTX: bring an expert into your team's Atlassian", template: "%s · ExpertCTX" },
  description:
    "Experts publish their frameworks, rules and playbooks once. Teams use them inside Confluence and Rovo, next to their own pages.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("h-full antialiased", calSans.variable, calSansHeading.variable, mono.variable)}>
        <body className="flex min-h-full flex-col">
          <ToastProvider>{children}</ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
