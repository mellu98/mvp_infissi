import type { Metadata } from 'next';
import './globals.css';
import { WebVitals } from '@/components/web-vitals';

export const metadata: Metadata = {
  title: 'MVP Infissi — Link Infissi',
  description: 'CRM, listini, catalogo, preventivi e PDF per il settore infissi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
