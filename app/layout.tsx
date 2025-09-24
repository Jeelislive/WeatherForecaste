import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Journey Planner — Plan with Weather + AI",
    template: "%s — Journey Planner",
  },
  description: "Plan smarter journeys with real‑time weather insights and AI recommendations.",
  keywords: [
    "travel planner",
    "journey planning",
    "weather forecast",
    "route optimization",
    "trip report",
  ],
  openGraph: {
    title: "Journey Planner — Plan with Weather + AI",
    description: "Avoid storms, find safe routes, and discover highlights nearby.",
    url: "https://example.com/",
    siteName: "Journey Planner",
    images: [
      { url: "/next.svg", width: 1200, height: 630, alt: "Journey Planner" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Journey Planner — Plan with Weather + AI",
    description: "Avoid storms, find safe routes, and discover highlights nearby.",
    images: ["/next.svg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://example.com"),
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1020" },
  ],
};

// Prevent theme flash: sets .dark on <html> before hydration if needed
const ThemeInit = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
      try {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldDark = stored ? stored === 'dark' : prefersDark;
        if (shouldDark) document.documentElement.classList.add('dark');
      } catch (_) {}
    `,
    }}
  />
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add Leaflet CSS */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <ThemeInit />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster position="bottom-center" reverseOrder={false} />
      </body>
    </html>
  );
}