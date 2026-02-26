'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, Sparkles, Crown, User, LogOut, ChevronDown, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  // Prefetch sign-in page when user is not logged in so it opens faster when they click
  useEffect(() => {
    if (session === null) router.prefetch('/auth/signin')
  }, [session, router])

  const handleSignOut = () => {
    setIsUserMenuOpen(false)
    setIsMenuOpen(false)
    setSignOutLoading(true)
    signOut({ redirect: false }).then(() => {
      router.push('/')
      router.refresh()
    }).finally(() => setSignOutLoading(false))
  }

  const user = session?.user as { name?: string; email?: string; subscriptionTier?: string } | undefined
  const isPro = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'lifetime'

  return (
    <header className="bg-black/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ResumeAI</h1>
              <p className="text-xs text-gray-500 -mt-1">AI-Powered Analysis</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pricing" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
              Pricing
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 transition-all"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.name || 'Account'}</span>
                  {isPro && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-2xl shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                        {isPro && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400 mt-1">
                            <Crown className="w-3 h-3" /> Pro Member
                          </span>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        {!isPro && (
                          <Link
                            href="/pricing"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-yellow-400 hover:text-yellow-300 hover:bg-gray-800 transition-colors"
                          >
                            <Crown className="w-4 h-4" />
                            Upgrade to Pro
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          disabled={signOutLoading}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors w-full text-left disabled:opacity-70"
                        >
                          {signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                          {signOutLoading ? 'Signing out…' : 'Sign out'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-900/30"
                >
                  <Crown className="w-4 h-4" />
                  Get Pro
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-gray-300" /> : <Menu className="w-6 h-6 text-gray-300" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-800"
            >
              <div className="py-4 space-y-2">
                <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="block px-2 py-2 text-gray-300 hover:text-white text-sm font-medium">Pricing</Link>
                {session ? (
                  <>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-2 py-2 text-gray-300 hover:text-white text-sm">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={handleSignOut} disabled={signOutLoading} className="flex items-center gap-2 px-2 py-2 text-gray-400 hover:text-red-400 text-sm w-full text-left disabled:opacity-70">
                      {signOutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />} {signOutLoading ? 'Signing out…' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)} className="block px-2 py-2 text-gray-300 hover:text-white text-sm">Sign in</Link>
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)} className="block px-2 py-2 text-blue-400 hover:text-blue-300 text-sm font-medium">Create account</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
