import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PokerPro Suite — Entraînement Texas Hold\'em',
  description: 'Application poker complète avec calculateur d\'équité, ranges Calamusa, HUD et analyse de leaks.',
  keywords: ['poker', 'texas holdem', 'equity', 'ranges', 'tournoi'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
