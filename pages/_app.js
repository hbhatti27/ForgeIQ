import { ClerkProvider } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();

  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
