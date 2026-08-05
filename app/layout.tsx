import type { Metadata, Viewport } from "next";
import "./globals.css";

const metadataBase = new URL(
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
);

export const metadata: Metadata = {
  metadataBase,
  title: "The World Reopened. Did Life Recover?",
  description:
    "An interactive data story exploring how economic prosperity, life expectancy, digital connection, and life satisfaction changed after COVID.",
  applicationName: "Post-COVID Recovery",
  openGraph: {
    title: "The World Reopened. Did Life Recover?",
    description:
      "A visual story of how the world lived, thrived, and reconnected after COVID.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1728,
        height: 909,
        alt: "The World Reopened. Did Life Recover? — Live, Thrive, Connect, Feel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The World Reopened. Did Life Recover?",
    description:
      "A visual story of how the world lived, thrived, and reconnected after COVID.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
