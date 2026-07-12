import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const blackHan = Black_Han_Sans({ weight: "400", subsets: ["latin"], variable: "--font-black-han" });
const notoJp   = Noto_Sans_JP({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-noto-jp" });

export const metadata: Metadata = {
  title: "じぶん年表 – ねんピョウと一緒に、あなたの半生を記録しよう",
  description: "AIインタビュアー「ねんピョウ」があなたの半生を丁寧に聞いて、オリジナルの年表を作ります。",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${blackHan.variable} ${notoJp.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
