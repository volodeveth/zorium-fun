import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AuthenticationFlow from '@/components/auth/AuthenticationFlow'
import EarlyBirdWrapper from '@/components/notifications/EarlyBirdWrapper'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Zorium.fun - Create & Discover NFTs on ZORIUM.FUN',
  description: 'Create, mint, and trade NFTs across multiple networks with Zorium token features',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background-primary min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const THEME_STORAGE_KEY = 'zorium-theme';
                const DEFAULT_THEME = 'dark';
                
                const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
                const isValidTheme = storedTheme === 'light' || storedTheme === 'dark';
                const theme = isValidTheme ? storedTheme : DEFAULT_THEME;
                
                document.documentElement.className = theme;
              } catch (e) {
                document.documentElement.className = 'dark';
              }
            `,
          }}
        />
        <Providers>
          <Header />
          <AuthenticationFlow />
          <EarlyBirdWrapper />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}