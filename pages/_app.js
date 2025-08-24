import "../styles/globals.css";
import Head from "next/head";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Uplinx – Upload File Aman</title>
        <meta name="description" content="Platform upload file terpercaya & aman powered by Next.js + GitHub API." />
        {/* favicon otomatis kalau ada /public/favicon.ico */}
        {/* kalau mau custom logo: */}
        {/* <link rel="icon" href="/logo.png" /> */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}
