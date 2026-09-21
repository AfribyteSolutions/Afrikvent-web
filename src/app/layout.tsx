import "./globals.css";
import type { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const metadataBase = appUrl && /^https?:\/\//i.test(appUrl)
  ? new URL(appUrl.replace(/\/$/, ""))
  : new URL("https://mwakwa.com");
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import Preloader from "@/components/preloader/preloader";
import { Montserrat } from "next/font/google";
import PaymentStatusChecker from '@/components/PaymentStatusChecker';

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: [
    "100", "200", "300", "400", "500", "600", "700", "800", "900",
  ],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Mwakwa",
    template: "%s | Mwakwa",
  },
  description: "Discover, connect around, and access social events with Mwakwa.",
  applicationName: "Mwakwa",
  openGraph: {
    title: "Mwakwa",
    description: "Discover, connect around, and access social events with Mwakwa.",
    siteName: "Mwakwa",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="flex flex-col min-h-screen bg-background text-foreground font-sans">
        <Preloader />
        <Header />
        <PaymentStatusChecker />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
