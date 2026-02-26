'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    Sparkles, Crown, Check, Zap, Shield, ArrowRight, Loader2,
    BarChart2, FileText, Target, Star
} from 'lucide-react'

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        description: 'Perfect for trying out resume analysis',
        icon: Shield,
        color: 'gray',
        features: [
            '3 resume analyses per month',
            'Basic ATS score',
            'Keyword gap analysis',
            'PDF & DOCX support',
            'Section-by-section feedback',
        ],
        limitations: [
            'Job description matching',
            'Cover letter generator',
            'Email analysis reports',
            'Priority support',
        ],
        cta: 'Get Started Free',
        highlight: false,
    },
    {
        id: 'pro_monthly',
        name: 'Pro',
        badge: 'Most Popular',
        price: { monthly: 12, yearly: 89 },
        yearlyMonthly: 7.42,
        description: 'For serious job seekers who want every edge',
        icon: Crown,
        color: 'blue',
        features: [
            'Unlimited resume analyses',
            'Advanced ATS optimization',
            'Job Description Matcher (unique!)',
            'AI Cover Letter Generator',
            'Email analysis reports',
            'Industry benchmark scores',
            'Priority support',
            'Resume history & dashboard',
        ],
        limitations: [],
        cta: 'Start Pro',
        highlight: true,
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        price: { monthly: 149, yearly: 149 },
        description: 'One payment, lifetime access — best value',
        icon: Zap,
        color: 'yellow',
        features: [
            'Everything in Pro — forever',
            'No monthly fees, ever',
            'All future features included',
            'White-glove resume review (1x)',
            'Lifetime priority support',
        ],
        limitations: [],
        cta: 'Buy Lifetime Access',
        highlight: false,
    },
]

const FEATURES_COMPARISON = [
    { name: 'Resume analyses', free: '3/month', pro: 'Unlimited', lifetime: 'Unlimited' },
    { name: 'ATS score', free: 'Basic', pro: 'Advanced', lifetime: 'Advanced' },
    { name: 'Job Description Matcher', free: false, pro: true, lifetime: true },
    { name: 'Cover Letter Generator', free: false, pro: true, lifetime: true },
    { name: 'Email reports', free: false, pro: true, lifetime: true },
    { name: 'Industry benchmarks', free: false, pro: true, lifetime: true },
    { name: 'PDF report download', free: true, pro: true, lifetime: true },
    { name: 'Future features', free: false, pro: 'Subscription period', lifetime: 'Forever' },
]

export default function PricingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

    const handleCheckout = async (planId: string) => {
        if (planId === 'free') {
            router.push('/')
            return
        }

        if (status === 'unauthenticated') {
            router.push('/auth/signup')
            return
        }

        const actualPlanId = planId === 'pro_monthly' && billing === 'yearly' ? 'pro_yearly' : planId

        setLoadingPlan(planId)
        try {
            const res = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: actualPlanId }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert(data.error || 'Failed to create checkout session')
            }
        } catch {
            alert('Something went wrong. Please try again.')
        } finally {
            setLoadingPlan(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
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
                        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</Link>
                        {session ? (
                            <Link href="/profile" className="text-gray-400 hover:text-white text-sm transition-colors">Profile</Link>
                        ) : (
                            <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-20">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-700/50 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
                        <Star className="w-4 h-4" />
                        Trusted by 10,000+ job seekers
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Start free. Upgrade when you need more power. Cancel anytime.
                    </p>

                    {/* Toggle */}
                    <div className="inline-flex items-center bg-gray-800/60 border border-gray-700 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setBilling('monthly')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly'
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBilling('yearly')}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === 'yearly'
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                Save 38%
                            </span>
                        </button>
                    </div>
                </motion.div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {PLANS.map((plan, i) => {
                        const isHighlight = plan.highlight
                        const price = billing === 'yearly' && plan.id === 'pro_monthly'
                            ? plan.yearlyMonthly
                            : plan.price.monthly
                        const Icon = plan.icon
                        const isLoading = loadingPlan === plan.id

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative rounded-3xl p-8 flex flex-col ${isHighlight
                                        ? 'bg-gradient-to-b from-blue-600/20 to-blue-900/10 border-2 border-blue-500/60'
                                        : 'bg-gray-900/60 border border-gray-700/50'
                                    } backdrop-blur-sm`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-blue-900/50">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isHighlight ? 'bg-blue-600/30' : plan.id === 'lifetime' ? 'bg-yellow-900/30' : 'bg-gray-800'
                                        }`}>
                                        <Icon className={`w-6 h-6 ${isHighlight ? 'text-blue-400' : plan.id === 'lifetime' ? 'text-yellow-400' : 'text-gray-400'
                                            }`} />
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm">{plan.description}</p>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">
                                            {price === 0 ? 'Free' : `€${price}`}
                                        </span>
                                        {price > 0 && plan.id !== 'lifetime' && (
                                            <span className="text-gray-400 text-sm">/month</span>
                                        )}
                                    </div>
                                    {billing === 'yearly' && plan.id === 'pro_monthly' && (
                                        <p className="text-green-400 text-sm mt-1">€89 billed yearly (save €55)</p>
                                    )}
                                    {plan.id === 'lifetime' && (
                                        <p className="text-yellow-400 text-sm mt-1">One-time payment</p>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                                            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isHighlight ? 'text-blue-400' : plan.id === 'lifetime' ? 'text-yellow-400' : 'text-green-400'
                                                }`} />
                                            {f}
                                        </li>
                                    ))}
                                    {plan.limitations.map(f => (
                                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                                            <span className="w-4 h-4 mt-0.5 flex-shrink-0 text-center">✕</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleCheckout(plan.id)}
                                    disabled={isLoading}
                                    className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isHighlight
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                                            : plan.id === 'lifetime'
                                                ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
                                                : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            {plan.cta}
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-8">Full feature comparison</h2>
                    <div className="bg-gray-900/60 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-700/50">
                                    <th className="text-left p-5 text-gray-400 font-medium">Feature</th>
                                    <th className="text-center p-5 text-gray-300 font-semibold">Free</th>
                                    <th className="text-center p-5 text-blue-300 font-semibold">Pro</th>
                                    <th className="text-center p-5 text-yellow-300 font-semibold">Lifetime</th>
                                </tr>
                            </thead>
                            <tbody>
                                {FEATURES_COMPARISON.map((row, i) => (
                                    <tr
                                        key={row.name}
                                        className={`border-b border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900/20' : ''}`}
                                    >
                                        <td className="p-4 text-gray-300">{row.name}</td>
                                        {(['free', 'pro', 'lifetime'] as const).map(col => (
                                            <td key={col} className="p-4 text-center">
                                                {typeof row[col] === 'boolean' ? (
                                                    row[col] ? (
                                                        <Check className={`w-5 h-5 mx-auto ${col === 'free' ? 'text-green-400' : col === 'pro' ? 'text-blue-400' : 'text-yellow-400'}`} />
                                                    ) : (
                                                        <span className="text-gray-700">—</span>
                                                    )
                                                ) : (
                                                    <span className={`text-sm ${col === 'free' ? 'text-gray-400' : col === 'pro' ? 'text-blue-300' : 'text-yellow-300'}`}>
                                                        {String(row[col])}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* FAQ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from your profile. You keep Pro access until the end of your billing period.' },
                            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex) and Apple Pay via Stripe — the industry standard.' },
                            { q: 'Is my resume data secure?', a: 'Yes. We analyze your resume in real-time and do not permanently store the full text. Basic metadata is retained for analytics. We use HTTPS everywhere.' },
                            { q: 'What is the Job Description Matcher?', a: 'A unique Pro feature. Paste any job description and our AI compares it against your resume to give you an exact match score, missing keywords, and tailoring tips.' },
                            { q: 'Can I get a refund?', a: 'We offer a 7-day money-back guarantee for all paid plans — no questions asked.' },
                        ].map(faq => (
                            <div key={faq.q} className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm">
                                <p className="text-white font-semibold mb-2">{faq.q}</p>
                                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-20 p-12 bg-gradient-to-r from-blue-900/30 to-purple-900/20 border border-blue-700/30 rounded-3xl"
                >
                    <BarChart2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-3">Ready to land your next job faster?</h2>
                    <p className="text-gray-400 mb-8">Join thousands of job seekers who improved their resume with ResumeAI</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-600 transition-all">
                            <FileText className="w-5 h-5" />
                            Try for Free
                        </Link>
                        <button
                            onClick={() => handleCheckout('pro_monthly')}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/40 transition-all"
                        >
                            <Target className="w-5 h-5" />
                            Get Pro — €12/month
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
