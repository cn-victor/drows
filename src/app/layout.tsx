import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Dancing_Script, EB_Garamond, Inter, Lora, Marck_Script, Playfair_Display, Special_Elite } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const garamond = EB_Garamond({ variable: "--font-garamond", subsets: ["latin"], style: ["normal", "italic"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"] });
const script = Dancing_Script({ variable: "--font-script", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"] });
const typewriter = Special_Elite({ variable: "--font-typewriter", subsets: ["latin"], weight: "400" });
const modern = Inter({ variable: "--font-modern", subsets: ["latin"] });
const signature = Marck_Script({ variable: "--font-signature", subsets: ["latin"], weight: "400" }); // the writer's name on slides cards

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
};

export const viewport: Viewport = { themeColor: "#000000" };

// Applies the saved light/dark choice before the page is drawn, so it never flashes.
const themeScript = `try{var t=localStorage.getItem("drows:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [garamond, cormorant, lora, playfair, script, hand, typewriter, modern, signature].map((f) => f.variable).join(" ");
  return (
    <html lang="en" data-theme="dark" className={`${fonts} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
