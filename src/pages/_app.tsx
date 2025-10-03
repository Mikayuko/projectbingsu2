// src/pages/_app.tsx

import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { Iceland } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';

const iceland = Iceland({
  subsets: ['latin'],
  weight: '400',
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={iceland.className}>
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}

export default MyApp;