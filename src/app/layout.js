import './globals.css';

export const metadata = {
  title: 'Family Budget',
  description: 'Track your family expenses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
