import "./globals.css";
import type { Metadata } from "next";
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

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const appUrl = configuredAppUrl && /^https?:\/\//i.test(configuredAppUrl)
  ? configuredAppUrl.replace(/\/$/, "")
  : "https://mwakwa.com";
const metadataBase = new URL(appUrl);

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Mwakwa",
    template: "%s | Mwakwa",
  },
  description: "Mwakwa is a central marketplace for social events—discover what’s happening, connect around experiences, and access events.",
  applicationName: "Mwakwa",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Mwakwa",
    description: "Mwakwa is a central marketplace for social events—discover what’s happening, connect around experiences, and access events.",
    url: "/",
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
