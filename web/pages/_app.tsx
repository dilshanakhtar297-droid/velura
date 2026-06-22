import React from 'react'
import Link from 'next/link'
import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <div>
        <header style={{padding:20, borderBottom: '1px solid #eee'}}>
          <Link href="/">Velura Gifts</Link> | <Link href="/admin">Admin</Link>
        </header>
        <main style={{padding:20}}>
          <Component {...pageProps} />
        </main>
      </div>
    </SessionProvider>
  )
}
