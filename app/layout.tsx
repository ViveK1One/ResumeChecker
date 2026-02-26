import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'ResumeAI — AI-Powered Resume Analysis & ATS Optimizer',
  description: 'Get instant AI-powered resume feedback. Optimize for ATS, match job descriptions, generate cover letters, and land more interviews.',
  keywords: 'resume checker, ATS optimizer, resume analysis, AI resume review, job description matcher, cover letter generator',
  authors: [{ name: 'ResumeAI' }],
  openGraph: {
    title: 'ResumeAI — AI Resume Analysis',
    description: 'Upload your resume for instant AI-powered feedback. ATS scoring, keyword gaps, and actionable tips.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
