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
    // Short-tail
    "video repurposing",
    "AI video editor",
    "video clipper",
    "clip generator",
    "short form video",
    "video to shorts",
    "content repurposing",
    "auto captions",
    "vertical video",
    "viral clips",
    // Long-tail
    "AI video repurposing tool",
    "video to shorts converter",
    "long video to short clips automatically",
    "auto video clipper with captions",
    "viral clip detector AI",
    "podcast to shorts converter",
    "YouTube to TikTok converter",
    "auto caption video tool",
    "vertical video crop tool 9:16",
    "content repurposing tool for creators",
    "video clipping software with AI",
    "TikTok clip maker from long videos",
    "Reels video creator from YouTube",
    "YouTube Shorts maker AI",
    "turn podcast into short clips",
    "repurpose video content for social media",
    "AI short form video generator",
    "auto cut viral moments from video",
    "bulk video clip exporter",
    "video highlight reel generator",
    // Competitor / alternative keywords
    "Opus Clip alternative",
    "Vidyo AI alternative",
    "Munch alternative",
    "Kapwing alternative",
    "Descript alternative for clips",
    "Repurpose.io alternative",
    "Vizard alternative",
    "Gling alternative",
    "cheaper than Opus Clip",
    "best Opus Clip alternative 2025",
    "cheap AI video clipper",
    "affordable video repurposing tool",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Clipfire",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "url": "https://clipfire.app",
  "description": "Upload a long video, get 30 viral short clips in minutes. AI-powered video repurposing for TikTok, Reels, and YouTube Shorts.",
  "offers": {
    "@type": "Offer",
    "price": "5.00",
    "priceCurrency": "USD",
    "billingIncrement": 1,
    "unitCode": "MON",
  },
  "featureList": [
    "AI viral moment detection",
    "Word-level transcription",
    "Vertical crop (9:16)",
    "Caption burn-in with 11 styles",
    "YouTube URL import",
    "Batch ZIP export",
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does the pricing work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You get 150 minutes of video processing per month for $5. Minutes are based on the duration of the video you upload — a 10-minute video uses 10 minutes of credit regardless of how many clips are generated.",
      },
    },
    {
      "@type": "Question",
      "name": "What happens if processing fails?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your credits are automatically refunded if the pipeline fails at any step. You only pay for successful processing.",
      },
    },
    {
      "@type": "Question",
      "name": "Can I process YouTube videos?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Just paste any YouTube URL and we download it server-side. No need to download the video yourself first.",
      },
    },
    {
      "@type": "Question",
      "name": "What video formats are supported?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "MP4, MOV, AVI, MKV, and WebM. YouTube URLs work too. Maximum file size is 2GB.",
      },
    },
    {
      "@type": "Question",
      "name": "How long does processing take?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Typically 3-8 minutes depending on video length. You can close the tab and come back — we'll have your clips ready.",
      },
    },
    {
      "@type": "Question",
      "name": "What AI models power Clipfire?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "OpenAI Whisper for transcription (word-level timestamps) and GPT for clip detection, scoring, hook generation, and caption writing.",
      },
    },
    {
      "@type": "Question",
      "name": "Can I cancel anytime?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, cancel anytime through Gumroad. Your credits remain active until the end of your billing period.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${poppins.variable} ${bangers.variable} ${permanentMarker.variable} ${bebasNeue.variable} ${spaceMono.variable} ${pacifico.variable} ${oswald.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
