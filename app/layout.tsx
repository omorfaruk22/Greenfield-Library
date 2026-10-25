import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: { default: 'Greenfield Library | Library Management System', template: '%s | Greenfield Library' },
  description: 'A modern library management system for books, members, circulation and reporting.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}<Toaster position="top-right" richColors closeButton /></body></html>;
}
