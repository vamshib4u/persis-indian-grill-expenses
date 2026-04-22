import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Persis Indian Grill - Revenue Management',
  description: 'Track daily sales, expenses, and payouts with secure Postgres-backed storage',
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
