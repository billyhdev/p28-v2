import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-secondary',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-primary',
});

export const metadata: Metadata = {
  title: 'Rover Management Platform',
  description: 'Dashboard for managing Mars rovers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${jetbrainsMono.variable} antialiased bg-[var(--color-background)] text-[var(--color-foreground)] font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
