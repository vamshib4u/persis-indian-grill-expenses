import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';
import { AutoSheetsLoader } from '@/components/AutoSheetsLoader';

export const metadata: Metadata = {
  title: 'Persis Indian Grill - Revenue Management',
  description: 'Track daily sales, expenses, and payouts with Google Sheets integration',
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
        <AutoSheetsLoader />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
