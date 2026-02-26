'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import ResumeUploader from '@/components/ResumeUploader'
import ResumeResults from '@/components/ResumeResults'
import TopTips from '@/components/TopTips'
import ReviewsSection from '@/components/ReviewsSection'
import Footer from '@/components/Footer'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, Users, FileText } from 'lucide-react'

const LAST_ANALYSIS_KEY = 'resume-last-analysis'

interface AnalysisResult {
  score: number
  atsScore: {
    keywords: number
    format: number
    overall: number
  }
  contentScore: {
    grammar: number
    clarity: number
    actionVerbs: number
  }
  suggestions: Array<{
    type: 'critical' | 'important' | 'minor'
    title: string
    description: string
    example?: string
  }>
  keywords: {
    found: string[]
    missing: string[]
  }
}

export default function Home() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [restoreAttempted, setRestoreAttempted] = useState(false)
  const [stats, setStats] = useState({
    totalUploads: 0,
    averageScore: 0,
    activeUsers: 0
  })

  // Clear result and stored last-analysis when user signs out (multi-user safe)
  useEffect(() => {
    if (status === 'unauthenticated') {
      setAnalysisResult(null)
      try { localStorage.removeItem(LAST_ANALYSIS_KEY) } catch { /* ignore */ }
    }
  }, [status])

  // Restore last analysis when logged in: API first, then localStorage fallback so you always see your result.
  useEffect(() => {
    if (status === 'loading') return
    setRestoreAttempted(false)
    if (status === 'unauthenticated') {
      setRestoreAttempted(true)
      return
    }
    const analysisId = searchParams.get('analysisId')
    if (session?.user && analysisId) {
      fetch(`/api/user/analysis/${analysisId}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setAnalysisResult(data) })
        .catch(() => { })
        .finally(() => setRestoreAttempted(true))
      return
    }
    if (session?.user) {
      fetch('/api/user/last-analysis', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.analysis) {
            setAnalysisResult(data.analysis)
            try { localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(data.analysis)) } catch { /* ignore */ }
          } else {
            try {
              const stored = localStorage.getItem(LAST_ANALYSIS_KEY)
              if (stored) {
                const parsed = JSON.parse(stored) as AnalysisResult
                if (parsed && typeof parsed.score === 'number') {
                  setAnalysisResult(parsed)
                  // Attach this result to account so profile shows count & history
                  fetch('/api/user/save-analysis', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ analysis: parsed }),
                  }).catch(() => { })
                }
              }
            } catch { /* ignore */ }
          }
        })
        .catch(() => {
          try {
            const stored = localStorage.getItem(LAST_ANALYSIS_KEY)
            if (stored) {
              const parsed = JSON.parse(stored) as AnalysisResult
              if (parsed && typeof parsed.score === 'number') {
                setAnalysisResult(parsed)
                fetch('/api/user/save-analysis', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ analysis: parsed }),
                }).catch(() => { })
              }
            }
          } catch { /* ignore */ }
        })
        .finally(() => setRestoreAttempted(true))
      return
    }
    setRestoreAttempted(true)
  }, [status, session?.user, searchParams])

  // Fetch analytics on component mount
  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?period=all')
      const data = await response.json()
      setStats({
        totalUploads: data.totalUploads || 0,
        averageScore: data.averageScore || 0,
        activeUsers: data.recentUploads?.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleAnalysisComplete = (result: AnalysisResult | null) => {
    setAnalysisResult(result)
    if (result && session?.user) {
      try { localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(result)) } catch { /* ignore */ }
    } else if (result === null) {
      // User clicked "Analyze Another Resume" or similar reset
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    fetchAnalytics() // Refresh stats after new analysis
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section with Enhanced Design */}
      <section className="relative overflow-hidden bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 mr-3 text-yellow-300" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                AI-Powered Resume Analysis
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get instant, professional feedback on your resume with advanced AI technology.
              Optimize for ATS systems and stand out to recruiters.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-center mb-3">
                  <FileText className="w-8 h-8 text-blue-200" />
                </div>
                <div className="text-3xl font-bold">{stats.totalUploads.toLocaleString()}+</div>
                <div className="text-blue-200">Resumes Analyzed</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-center mb-3">
                  <TrendingUp className="w-8 h-8 text-green-200" />
                </div>
                <div className="text-3xl font-bold">{Math.round(stats.averageScore)}%</div>
                <div className="text-blue-200">Average Score</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
                <div className="text-3xl font-bold">{stats.activeUsers.toLocaleString()}+</div>
                <div className="text-blue-200">Active Users</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <AnimatePresence mode="wait">
          {analysisResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <ResumeResults
                result={analysisResult}
                onReupload={() => setAnalysisResult(null)}
              />
            </motion.div>
          ) : session?.user && !restoreAttempted ? (
            <motion.div
              key="restoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-2xl flex flex-col items-center justify-center py-20"
            >
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading your last result…</p>
            </motion.div>
          ) : (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl min-w-0"
            >
              <ResumeUploader
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips Section - Below Upload Area */}
        {!analysisResult && (restoreAttempted || !session?.user) && (
          <div className="mt-8 w-full max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TopTips />
            </motion.div>
          </div>
        )}
      </main>

      {/* Features Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Advanced AI Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our cutting-edge AI technology provides comprehensive resume analysis
              with industry-leading accuracy and actionable insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Analysis',
                description: 'Advanced machine learning algorithms analyze your resume with human-level understanding and precision.'
              },
              {
                icon: '🎯',
                title: 'ATS Optimization',
                description: 'Ensure your resume passes through Applicant Tracking Systems with keyword optimization and formatting analysis.'
              },
              {
                icon: '📝',
                title: 'Grammar & Style',
                description: 'Comprehensive grammar checking and style suggestions to make your resume professional and polished.'
              },
              {
                icon: '🔍',
                title: 'Keyword Analysis',
                description: 'Identify missing industry-specific keywords and optimize your resume for better search visibility.'
              },
              {
                icon: '📊',
                title: 'Detailed Scoring',
                description: 'Get detailed scores across multiple dimensions with specific improvement recommendations.'
              },
              {
                icon: '📄',
                title: 'PDF Reports',
                description: 'Download comprehensive analysis reports in professional PDF format for offline reference.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-3 hover:scale-105 hover:border-blue-500/50"
              >
                <div className="text-4xl mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <ReviewsSection />
        </div>
      </section>

      <Footer />
    </div>
  )
}
