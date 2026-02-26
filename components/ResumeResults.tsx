'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import {
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Target,
  FileText,
  Star,
  TrendingUp,
  Award,
  Zap,
  BarChart3,
  Crown,
  Mail
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReviewSection from './ReviewSection'
import JobRecommendations from './JobRecommendations'

interface ResumeResultsProps {
  result: any
  onReupload: () => void
}

export default function ResumeResults({ result, onReupload }: ResumeResultsProps) {
  const { data: session } = useSession()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [showReview, setShowReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const user = session?.user as any
  const tier = user?.subscriptionTier || 'free'
  const isPro = tier === 'pro' || tier === 'lifetime'

  const handleEmailReport = async () => {
    if (!isPro) return
    setIsSendingEmail(true)
    setEmailStatus('sending')

    try {
      // Mocking email sending as there's no backend endpoint for it yet.
      // In a real app, this would call /api/user/email-report
      await new Promise(resolve => setTimeout(resolve, 1500))
      setEmailStatus('sent')
      setTimeout(() => setEmailStatus('idle'), 3000)
    } catch (error) {
      console.error('Email report error:', error)
      setEmailStatus('error')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'resume-analysis-report.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('PDF generation error:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleReviewSubmit = async (rating: number, message: string) => {
    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          message,
          candidateName: safeResult.candidateName,
          analysisId: result?._id || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      setReviewSubmitted(true)
    } catch (error) {
      console.error('Review submission error:', error)
      throw error
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e' // green
    if (score >= 60) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🏆'
    if (score >= 60) return '👍'
    if (score >= 40) return '⚠️'
    return '📝'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) {
      return "Outstanding! Your resume is well-optimized and ready for ATS systems."
    } else if (score >= 60) {
      return "Good foundation! Your resume has potential with some targeted improvements."
    } else if (score >= 40) {
      return "Your resume needs significant improvements to be competitive in today's job market."
    } else {
      return "Your resume requires major improvements. Consider professional assistance."
    }
  }

  // Ensure we have valid data
  const safeResult = {
    candidateName: result?.candidateName || 'there',
    score: result?.score || 0,
    apiSource: result?.apiSource || 'AI',
    atsScore: {
      keywords: result?.atsScore?.keywords || 0,
      format: result?.atsScore?.format || 0,
      overall: result?.atsScore?.overall || 0
    },
    contentScore: {
      grammar: result?.contentScore?.grammar || 0,
      clarity: result?.contentScore?.clarity || 0,
      actionVerbs: result?.contentScore?.actionVerbs || 0
    },
    suggestions: result?.suggestions || [],
    keywords: {
      found: result?.keywords?.found || [],
      missing: result?.keywords?.missing || []
    },
    industry: result?.industry || 'general',
    experienceLevel: result?.experienceLevel || 'mid',
    strengths: result?.strengths || [],
    weaknesses: result?.weaknesses || [],
    recommendations: result?.recommendations || [],
    projectIdeas: result?.projectIdeas || [],
    trendingTechnologies: result?.trendingTechnologies || [],
    atsCompatibility: result?.atsCompatibility || {},
    contentQuality: result?.contentQuality || {},
    jobMatchScore: result?.jobMatchScore,
    jobMatchDetails: result?.jobMatchDetails
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-4"
        >
          <Award className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Hi {safeResult.candidateName}! 👋
        </h2>
        <p className="text-lg text-gray-300">
          Your resume analysis is complete! Here's your comprehensive report with actionable insights
        </p>
        <div className="mt-2 text-sm text-gray-400">
          Powered by {safeResult.apiSource} AI
        </div>
      </div>

      {/* Overall Score Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 border border-blue-100 shadow-lg"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <span className="text-4xl mr-3">{getScoreEmoji(safeResult.score)}</span>
            <h3 className="text-2xl font-bold text-gray-900">Overall Score</h3>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-40 h-40">
              <CircularProgressbar
                value={safeResult.score}
                text={`${safeResult.score}%`}
                styles={buildStyles({
                  pathColor: getScoreColor(safeResult.score),
                  textColor: getScoreColor(safeResult.score),
                  trailColor: '#e5e7eb',
                  strokeLinecap: 'round',
                })}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-2xl font-semibold text-gray-900 mb-2">
              {getScoreLabel(safeResult.score)}
            </h4>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {getScoreMessage(safeResult.score)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Pro Teaser: Job Description Matcher */}
      {!isPro && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4">
            <Crown className="w-8 h-8 text-yellow-400 opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
              <Target className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                Job Description Matcher
                <span className="bg-blue-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full font-bold">Pro</span>
              </h3>
              <p className="text-blue-100/70">
                Unlock professional job matching analysis. Compare your resume against specific job descriptions to see your match score and get tailoring tips.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              Unlock Now
            </Link>
          </div>
        </motion.div>
      )}

      {/* JD Match Results (Pro only) */}
      {isPro && safeResult.jobMatchScore !== undefined && safeResult.jobMatchScore !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Job Description Match</h3>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {safeResult.jobMatchScore}% Match
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Matching Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {safeResult.jobMatchDetails?.matchingKeywords?.map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium border border-green-200">{kw}</span>
                ))}
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 border border-red-100">
              <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {safeResult.jobMatchDetails?.missingKeywords?.map((kw: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-medium border border-red-200">{kw}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Tailoring Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {safeResult.jobMatchDetails?.tailoringTips?.map((tip: string, i: number) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {/* Detailed Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ATS Score */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">ATS Compatibility</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Keywords</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeResult.atsScore.keywords}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{safeResult.atsScore.keywords}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Format</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeResult.atsScore.format}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{safeResult.atsScore.format}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Overall ATS</span>
              <span className="font-bold text-lg text-blue-600">{safeResult.atsScore.overall}%</span>
            </div>
          </div>
        </motion.div>

        {/* Content Score */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Content Quality</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Grammar</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeResult.contentScore.grammar}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{safeResult.contentScore.grammar}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Clarity</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeResult.contentScore.clarity}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{safeResult.contentScore.clarity}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Action Verbs</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${safeResult.contentScore.actionVerbs}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900">{safeResult.contentScore.actionVerbs}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Keywords Analysis */}
      {(safeResult.keywords.found.length > 0 || safeResult.keywords.missing.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md relative overflow-hidden"
        >
          {!isPro && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Pro Insights Locked</h4>
              <p className="text-gray-600 max-w-xs mb-6 font-medium">Get trending technology lists and industry benchmark scores.</p>
              <Link href="/pricing" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">Upgrade to Unlock</Link>
            </div>
          )}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Keyword Analysis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Found Keywords */}
            {safeResult.keywords.found.length > 0 && (
              <div className="bg-green-50 rounded-xl p-6">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Found Keywords ({safeResult.keywords.found.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {safeResult.keywords.found.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {safeResult.keywords.missing.length > 0 && (
              <div className="bg-red-50 rounded-xl p-6">
                <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Missing Keywords ({safeResult.keywords.missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {safeResult.keywords.missing.map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Industry & Experience Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Industry Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Industry:</span>
                <span className="font-semibold text-gray-900 capitalize">{safeResult.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level:</span>
                <span className="font-semibold text-gray-900 capitalize">{safeResult.experienceLevel}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Strengths</h3>
            <div className="space-y-2">
              {safeResult.strengths.length > 0 ? (
                safeResult.strengths.map((strength: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">{strength}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No specific strengths identified</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Project Ideas & Trending Technologies */}
      {(safeResult.projectIdeas.length > 0 || safeResult.trendingTechnologies.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Career Development Insights</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Project Ideas */}
            {safeResult.projectIdeas.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Recommended Project Ideas
                </h4>
                <div className="space-y-3">
                  {safeResult.projectIdeas.map((project: string, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-gray-700 text-sm leading-relaxed">{project}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Technologies */}
            {safeResult.trendingTechnologies.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" />
                  Trending Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {safeResult.trendingTechnologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-lg text-sm font-medium border border-purple-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 text-sm mt-3">
                  These technologies are currently in high demand in the {safeResult.industry} industry.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Font Suggestions Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900">Font & Formatting Recommendations</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classic & Professional Fonts */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="text-lg font-semibold text-gray-900">Classic & Professional Fonts</h4>
            </div>
            <p className="text-gray-600 mb-4">These are widely accepted and safe choices for any industry:</p>

            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Calibri</div>
                <div className="text-sm text-gray-600">Style: Modern sans-serif</div>
                <div className="text-sm text-gray-600">Why It Works: Clean, default in many applications</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Arial</div>
                <div className="text-sm text-gray-600">Style: Sans-serif</div>
                <div className="text-sm text-gray-600">Why It Works: Simple, highly readable</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Times New Roman</div>
                <div className="text-sm text-gray-600">Style: Serif</div>
                <div className="text-sm text-gray-600">Why It Works: Traditional, formal</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Georgia</div>
                <div className="text-sm text-gray-600">Style: Serif</div>
                <div className="text-sm text-gray-600">Why It Works: Elegant with excellent readability</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Garamond</div>
                <div className="text-sm text-gray-600">Style: Serif</div>
                <div className="text-sm text-gray-600">Why It Works: Sophisticated, slightly artistic</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900 mb-1">Helvetica</div>
                <div className="text-sm text-gray-600">Style: Sans-serif</div>
                <div className="text-sm text-gray-600">Why It Works: Sleek and neutral (great for design)</div>
              </div>
            </div>
          </div>

          {/* Tips for Using Fonts */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-5 h-5 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-pink-600 text-xs">💡</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Tips for Using Fonts on a Resume</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900">Font Size:</span>
                  <span className="text-gray-700"> Use 10–12 pt for body text, 14–16 pt for headings.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900">Consistency:</span>
                  <span className="text-gray-700"> Stick to one or two fonts max (e.g., one for headings, one for body).</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900">Avoid:</span>
                  <span className="text-gray-700"> Comic Sans, Papyrus, or overly stylized fonts—they can look unprofessional.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="font-medium text-gray-900">Spacing:</span>
                  <span className="text-gray-700"> Ensure enough white space for readability; don't cram too much text.</span>
                </div>
              </div>
            </div>

            {/* Additional Formatting Tips */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">Pro Tips:</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use bullet points for better readability</li>
                <li>• Keep margins at 0.5-1 inch for optimal space usage</li>
                <li>• Use bold for section headers and company names</li>
                <li>• Maintain consistent spacing between sections</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Suggestions Section */}
      {safeResult.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Improvement Suggestions</h3>
          </div>

          <div className="space-y-6">
            {safeResult.suggestions.map((suggestion: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className={`p-6 rounded-xl border-l-4 ${suggestion.type === 'critical'
                  ? 'bg-red-50 border-red-400'
                  : suggestion.type === 'important'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${suggestion.type === 'critical'
                    ? 'bg-red-100'
                    : suggestion.type === 'important'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
                    }`}>
                    {suggestion.type === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    ) : suggestion.type === 'important' ? (
                      <Info className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-2 ${suggestion.type === 'critical'
                      ? 'text-red-800'
                      : suggestion.type === 'important'
                        ? 'text-yellow-800'
                        : 'text-blue-800'
                      }`}>
                      {suggestion.title}
                    </h4>
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {suggestion.description}
                    </p>
                    {suggestion.example && (
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Example:</span> {suggestion.example}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Job Recommendations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-8"
      >
        <JobRecommendations
          resumeKeywords={safeResult.keywords?.found || []}

        />
      </motion.div>

      {/* Review Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-8"
      >
        <ReviewSection onSubmit={handleReviewSubmit} />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 text-lg disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              <span>Download PDF Report</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: isPro ? 1.02 : 1 }}
          whileTap={{ scale: isPro ? 0.98 : 1 }}
          onClick={handleEmailReport}
          disabled={isSendingEmail || !isPro}
          className={`flex-1 py-4 px-8 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-3 text-lg disabled:opacity-50 relative group font-semibold ${isPro ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white hover:shadow-xl' : 'bg-gray-700 border-2 border-dashed border-gray-600 cursor-not-allowed text-gray-300'}`}
        >
          {emailStatus === 'sending' ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Emailing...</span>
            </>
          ) : emailStatus === 'sent' ? (
            <>
              <CheckCircle className="w-6 h-6" />
              <span>Report Emailed!</span>
            </>
          ) : (
            <>
              <Mail className={`w-6 h-6 ${isPro ? 'text-white' : 'text-gray-400'}`} />
              <span>Email Report</span>
              {!isPro && (
                <span className="absolute -top-3 -right-3 bg-blue-500 text-white text-[10px] uppercase px-2 py-1 rounded-full font-bold shadow-lg animate-bounce">Pro</span>
              )}
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReupload}
          className="flex-1 bg-gray-800 border-2 border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-200 font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-3 text-lg"
        >
          <RefreshCw className="w-6 h-6" />
          <span>Analyze Another Resume</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
