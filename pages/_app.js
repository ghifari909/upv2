import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Uplinx – Upload File Aman</title>
        <meta name="description" content="Platform upload file terpercaya & aman powered by Next.js + GitHub API." />

        {/* Open Graph untuk WA/Telegram/FB */}
        <meta property="og:title" content="Uplinx – Upload File Aman" />
        <meta property="og:description" content="Upload dan share file mudah dengan link langsung." />
        <meta property="og:image" content="https://upv2.vercel.app/og-thumbnail.png" />
        <meta property="og:url" content="https://upv2.vercel.app" />
        <meta property="og:type" content="website" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
