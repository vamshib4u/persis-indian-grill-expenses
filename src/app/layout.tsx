import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Persis Locations - Revenue Management',
  description: 'Track daily sales, expenses, payouts, and cash holders by restaurant location',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
