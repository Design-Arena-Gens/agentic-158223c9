import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Dawn of Independence ? A Cinematic Tribute",
  description: "A historical drama scene inspired by Poland?s Independence Day (Nov 11)",
  openGraph: {
    title: "Dawn of Independence ? A Cinematic Tribute",
    description: "A historical drama scene inspired by Poland?s Independence Day (Nov 11)",
    type: 'website'
  },
  themeColor: '#d32f2f'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
