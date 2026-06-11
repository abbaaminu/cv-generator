import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'ABSON CV Genius — AI-Powered CV Generator',
  description:
    'Create professional CVs in minutes with AI. Download as PDF, Word, or Excel. Powered by Google Gemini.',
  keywords: ['CV generator', 'resume builder', 'AI CV', 'Paystack', 'Nigeria'],
  authors: [{ name: 'ABSON' }],
  openGraph: {
    title: 'ABSON CV Genius',
    description: 'AI-powered CV generator — PDF, Word & Excel downloads',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-gray-50 antialiased">
        <ErrorBoundary>
          <main className="flex-1">{children}</main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
