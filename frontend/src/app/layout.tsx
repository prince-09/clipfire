import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Poppins, Bangers, Permanent_Marker, Bebas_Neue, Space_Mono, Pacifico, Oswald } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "700", "900"] });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", weight: ["400", "600", "800"] });
const bangers = Bangers({ subsets: ["latin"], variable: "--font-bangers", weight: "400" });
const permanentMarker = Permanent_Marker({ subsets: ["latin"], variable: "--font-marker", weight: "400" });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400" });
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-space-mono", weight: ["400", "700"] });
const pacifico = Pacifico({ subsets: ["latin"], variable: "--font-pacifico", weight: "400" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", weight: ["400", "700"] });

export const metadata: Metadata = {
  title: {
    default: "Clipfire — AI Video Repurposing | Turn Long Videos Into Viral Shorts",
    template: "%s | Clipfire",
  },
  description: "Upload a long video, get 30 viral short clips in minutes. AI-powered video repurposing for TikTok, Reels, and YouTube Shorts. Auto vertical crop, caption burn-in, and viral moment detection.",
  keywords: [
    "AI video repurposing",
    "video to shorts converter",
    "long video to short clips",
    "auto video clipper",
    "viral clip detector",
    "podcast to shorts",
    "YouTube to TikTok",
    "auto caption video",
    "vertical video crop",
    "AI video editor",
    "content repurposing tool",
    "video clipping software",
    "TikTok clip maker",
    "Reels video creator",
    "YouTube Shorts maker",
  ],
  authors: [{ name: "Clipfire" }],
  creator: "Clipfire",
  publisher: "Clipfire",
  metadataBase: new URL("https://clipfire.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clipfire.app",
    title: "Clipfire — AI Video Repurposing | Turn Long Videos Into Viral Shorts",
    description: "Upload a long video, get 30 viral short clips in minutes. AI-powered video repurposing for TikTok, Reels, and YouTube Shorts.",
    siteName: "Clipfire",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Clipfire - AI Video Repurposing Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipfire — AI Video Repurposing",
    description: "Upload a long video, get 30 viral short clips in minutes. AI-powered video repurposing for TikTok, Reels, and YouTube Shorts.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  other: {
    "rankforge-verification": "e5fb236b-6b32-476f-b4be-93eeb3bd4098",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${bangers.variable} ${permanentMarker.variable} ${bebasNeue.variable} ${spaceMono.variable} ${pacifico.variable} ${oswald.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
