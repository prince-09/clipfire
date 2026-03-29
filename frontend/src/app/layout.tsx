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
  title: "Clipfire — Turn Videos Into Viral Clips",
  description: "Upload a long video, get 30 viral short clips in minutes",
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
