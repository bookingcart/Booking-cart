import type { Metadata } from 'next';
import Script from 'next/script';
import '@/styles/app.css';
import { AuthProvider } from '@/context/AuthContext';
import { TRPCProvider } from '@/components/TRPCProvider';

export const metadata: Metadata = {
  title: 'BookingCart — Fly Anywhere',
  description: 'Affordable flights, premium service.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css"
        />
        <link rel="stylesheet" href="/css/bookingcart.css" />
      </head>
      <body>
        <TRPCProvider>
          <AuthProvider>{children}</AuthProvider>
        </TRPCProvider>
        <div id="toast-container" />
      </body>
    </html>
  );
}
