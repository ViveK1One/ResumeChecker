'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    User, Mail, Crown, Shield, LogOut, ArrowRight,
    Sparkles, Calendar, BarChart2, CreditCard, Loader2, FileText, History, ExternalLink, RefreshCw
} from 'lucide-react'

interface HistoryItem {
    id: string
    uploadDate: string
    originalName: string
    score: number
    atsScore?: { overall?: number }
}

interface SessionUser {
    name?: string | null
    email?: string | null
    subscriptionTier?: string
}

interface ProfileData {
    resumeCount: number
    freeLimit: number
    remaining: number | null
    createdAt: string
}

export default function ProfilePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [loadingPortal, setLoadingPortal] = useState(false)
    const [signOutLoading, setSignOutLoading] = useState(false)
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [analysisHistory, setAnalysisHistory] = useState<HistoryItem[]>([])

    const handleSignOut = () => {
        setSignOutLoading(true)
        signOut({ redirect: false }).then(() => {
            router.push('/')
            router.refresh()
        }).finally(() => setSignOutLoading(false))
    }

    const fetchProfileAndHistory = () => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setProfileData(data) })
            .catch(() => { })
        fetch('/api/user/analysis-history', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.history) setAnalysisHistory(data.history) })
            .catch(() => { })
    }

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
        if (status === 'authenticated') {
            fetchProfileAndHistory()
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
        )
    }

    const user = session?.user as SessionUser | undefined
    const tier = user?.subscriptionTier || 'free'
    const isPro = tier === 'pro' || tier === 'lifetime'

    const tierConfig = {
        free: { label: 'Free Plan', color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700', icon: Shield },
        pro: { label: 'Pro Plan', color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-700', icon: Crown },
        lifetime: { label: 'Lifetime Plan', color: 'text-yellow-400', bg: 'bg-yellow-900/20', border: 'border-yellow-700', icon: Crown },
    }
    const tc = tierConfig[tier as keyof typeof tierConfig] || tierConfig.free
    const TierIcon = tc.icon

    const openBillingPortal = async () => {
        setLoadingPortal(true)
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' })
            const data = await res.json()
            if (data.url) window.location.href = data.url
        } catch {
            alert('Could not open billing portal. Please try again.')
        } finally {
            setLoadingPortal(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
            </div>

            {/* Nav */}
            <nav className="border-b border-gray-800/60 backdrop-blur-xl bg-gray-900/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-bold">ResumeAI</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                            Analyze Resume
                        </Link>
                        <button
                            onClick={handleSignOut}
                            disabled={signOutLoading}
                            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-70"
                        >
                            {signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            {signOutLoading ? 'Signing out…' : 'Sign out'}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                        <p className="text-gray-400">Manage your account and subscription</p>
                        {status === 'authenticated' && !profileData && (
                            <p className="text-amber-400/90 text-sm mt-2">Loading usage & history… If they don’t appear, try Refresh below or sign out and sign in again.</p>
                        )}
                    </div>

                    {/* Upgrade banner when free tier is full */}
                    {!isPro && profileData && profileData.remaining === 0 && (
                        <div className="mb-6 p-5 bg-gradient-to-r from-red-900/40 to-orange-900/30 border border-red-700/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                    <Crown className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">You&apos;ve used all 3 free analyses</p>
                                    <p className="text-red-200/90 text-sm">Upgrade to Pro for unlimited resume analyses.</p>
                                </div>
                            </div>
                            <Link
                                href="/pricing"
                                className="shrink-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2"
                            >
                                Upgrade to Pro
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Account Info */}
                        <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-400" />
                                Account Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Full Name</p>
                                    <p className="text-white font-medium">{user?.name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email Address</p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <p className="text-white">{user?.email || '—'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Member Since</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <p className="text-white">
                                            {profileData?.createdAt
                                                ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Subscription */}
                        <div className={`border rounded-2xl p-6 ${tc.bg} ${tc.border} backdrop-blur-sm`}>
                            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
                                <TierIcon className={`w-5 h-5 ${tc.color}`} />
                                Subscription
                            </h2>
                            <div className="space-y-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${tc.bg} ${tc.color} border ${tc.border}`}>
                                    <TierIcon className="w-4 h-4" />
                                    {tc.label}
                                </div>

                                <div className="space-y-2 text-sm">
                                    {isPro ? (
                                        <>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Unlimited resume analyses</p>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Job Description Matcher</p>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Cover Letter Generator</p>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Email analysis reports</p>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Priority support</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-300 flex items-center gap-2">✅ 3 analyses per month</p>
                                            <p className="text-gray-300 flex items-center gap-2">✅ Basic ATS scoring</p>
                                            <p className="text-gray-400 flex items-center gap-2">🔒 Job Description Matcher</p>
                                            <p className="text-gray-400 flex items-center gap-2">🔒 Cover Letter Generator</p>
                                        </>
                                    )}
                                </div>

                                {isPro ? (
                                    <button
                                        onClick={openBillingPortal}
                                        disabled={loadingPortal}
                                        className="w-full mt-4 py-2.5 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    >
                                        {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                                        Manage Billing
                                    </button>
                                ) : (
                                    <Link
                                        href="/pricing"
                                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg shadow-blue-900/30"
                                    >
                                        <Crown className="w-4 h-4" />
                                        Upgrade to Pro
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Usage Card — shown for free users */}
                        {!isPro && profileData && (
                            <div className="md:col-span-2 bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                                <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    Resume Analysis Usage
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">
                                            {profileData.resumeCount} of {profileData.freeLimit} free analyses used
                                        </span>
                                        <span className={`font-semibold ${profileData.remaining === 0
                                                ? 'text-red-400'
                                                : profileData.remaining === 1
                                                    ? 'text-yellow-400'
                                                    : 'text-green-400'
                                            }`}>
                                            {profileData.remaining} remaining
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${profileData.remaining === 0
                                                    ? 'bg-red-500'
                                                    : profileData.remaining === 1
                                                        ? 'bg-yellow-500'
                                                        : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${Math.min(100, (profileData.resumeCount / profileData.freeLimit) * 100)}%` }}
                                        />
                                    </div>

                                    {/* Usage dots */}
                                    <div className="flex items-center gap-3">
                                        {Array.from({ length: profileData.freeLimit }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 rounded-full ${i < profileData.resumeCount
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-700 border border-gray-600'
                                                    }`} />
                                                <span className="text-xs text-gray-500">#{i + 1}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {profileData.remaining === 0 ? (
                                        <div className="mt-2 p-3 bg-red-900/20 border border-red-800/40 rounded-xl">
                                            <p className="text-red-300 text-sm mb-2">
                                                You&apos;ve used all free analyses. Upgrade to Pro for unlimited access.
                                            </p>
                                            <Link
                                                href="/pricing"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all"
                                            >
                                                <Crown className="w-4 h-4" />
                                                Upgrade to Pro
                                            </Link>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-xs">
                                            Free plan includes {profileData.freeLimit} resume analyses. Upgrade for unlimited.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Analysis history */}
                        <div className="md:col-span-2 bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-400" />
                                    Resume analysis history
                                    {!isPro && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">Pro</span>}
                                </h2>
                                <button
                                    type="button"
                                    onClick={fetchProfileAndHistory}
                                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Refresh
                                </button>
                            </div>

                            {!isPro ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                                        <History className="w-8 h-8 text-blue-400/50" />
                                    </div>
                                    <h3 className="text-white font-semibold mb-2">History is a Pro Feature</h3>
                                    <p className="text-gray-500 text-sm max-w-sm mb-6">
                                        Upgrade to Pro to see your complete analysis history, track your progress, and quickly access past reports.
                                    </p>
                                    <Link
                                        href="/pricing"
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg"
                                    >
                                        Unlock History
                                    </Link>
                                </div>
                            ) : analysisHistory.length === 0 ? (
                                <p className="text-gray-500 text-sm">No analyses yet. Analyze a resume on the home page to see history here.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {analysisHistory.map((item) => (
                                        <li key={item.id} className="flex items-center justify-between gap-4 p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-medium truncate">{item.originalName || 'Resume'}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">
                                                    {new Date(item.uploadDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} • Score: {item.score}%
                                                </p>
                                            </div>
                                            <Link
                                                href={`/?analysisId=${item.id}`}
                                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            >
                                                View
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="md:col-span-2 bg-gray-900/60 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                            <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-400" />
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Link href="/" className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group">
                                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                                        <Sparkles className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">Analyze Resume</p>
                                        <p className="text-gray-500 text-xs">Upload & get instant feedback</p>
                                    </div>
                                </Link>

                                <Link href="/pricing" className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-xl transition-all group">
                                    <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                        <Crown className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">View Pricing</p>
                                        <p className="text-gray-500 text-xs">Unlock all features</p>
                                    </div>
                                </Link>

                                <button
                                    onClick={handleSignOut}
                                    disabled={signOutLoading}
                                    className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-red-900/20 border border-gray-700/50 hover:border-red-800/50 rounded-xl transition-all group disabled:opacity-70"
                                >
                                    <div className="w-10 h-10 bg-red-900/20 rounded-lg flex items-center justify-center group-hover:bg-red-900/30 transition-colors">
                                        {signOutLoading ? <Loader2 className="w-5 h-5 text-red-400 animate-spin" /> : <LogOut className="w-5 h-5 text-red-400" />}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white text-sm font-medium">{signOutLoading ? 'Signing out…' : 'Sign Out'}</p>
                                        <p className="text-gray-500 text-xs">Log out of your account</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
