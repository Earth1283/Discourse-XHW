import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XHW Life",
  description: "An anonymous board. Mind the rules.",
};

// Prevent theme flash: set data-theme from localStorage before paint.
const themeScript = `(function(){try{var t=localStorage.getItem('xhw-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
