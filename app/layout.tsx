import type { Metadata, Viewport } from "next";
import "./globals.css";

const metadataBase = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "Recovery Atlas — How the world recovered after COVID",
  description:
    "An interactive global atlas exploring how the world's 150 most populous economies recovered economically, physically, digitally and emotionally after COVID-19, built on public World Bank and World Happiness Report data.",
  applicationName: "Recovery Atlas",
  openGraph: {
    title: "Recovery Atlas — How the world recovered after COVID",
    description:
      "Economic activity returned quickly in many places. Health, connection and wellbeing followed very different paths.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1728,
        height: 909,
        alt: "Recovery Atlas — LIVE, THRIVE, CONNECT, FEEL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Recovery Atlas — How the world recovered after COVID",
    description:
      "Economic activity returned quickly in many places. Health, connection and wellbeing followed very different paths.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b212b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
