import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';
import { LoaderProvider } from '@/lib/loader';
import { AuthProvider } from '@/lib/authContext';

const outfit = localFont({
  src: [
    {
      path: '../../public/assets/Outfit/Outfit-VariableFont_wght.ttf',
      style: 'normal',
    },
  ],
  variable: '--font-outfit',
  display: 'swap',
});

const tiroDevanagari = localFont({
  src: [
    {
      path: '../../public/assets/Tiro_Devanagari_Sanskrit/TiroDevanagariSanskrit-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/assets/Tiro_Devanagari_Sanskrit/TiroDevanagariSanskrit-Italic.ttf',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-tiro-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'मेरो कागज | Mero Kagaz — Nepal Government Document Platform',
    template: '%s | Mero Kagaz',
  },
  description: 'नेपाल सरकारका IRD, OCR तथा अन्य आधिकारिक कागजातहरू सजिलै तयार पार्नुहोस्।',
  keywords: ['Nepal', 'PAN', 'VAT', 'Company Registration', 'IRD', 'OCR', 'Government Documents', 'मेरो कागज'],
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${tiroDevanagari.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <LoaderProvider>{children}</LoaderProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
