'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Sparkles,
  Crown,
  Copy,
  Check,
  FileText,
  Mail,
  Target,
  ArrowRight,
  ChevronLeft,
  Languages,
} from 'lucide-react'
import type {
  ApplicationLanguage,
  JobApplicationInput,
  MatchAnalysis,
  StudentProfileInput,
} from '@/lib/applicationPack/types'
import { emptyStudentProfile } from '@/lib/applicationPack/profileFromDraft'
import { finalizeLatexDocument, finalizeCoverLetterLatex } from '@/lib/applicationPack/prompts'
import { cn } from '@/lib/utils'

const inputCls =
  'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/40 outline-none'
const labelCls = 'text-xs text-gray-500 block mb-1'

export default function ApplicationPackClient() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [freeLimit, setFreeLimit] = useState(3)
  const [remaining, setRemaining] = useState<number | null>(3)
  const [packCount, setPackCount] = useState(0)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState<string | null>(null)
  const [profile, setProfile] = useState<StudentProfileInput>(emptyStudentProfile)
  const [job, setJob] = useState<JobApplicationInput>({
    jobDescription: '',
    companyName: '',
    companyCity: '',
    language: 'German',
    resumeLanguage: 'German',
    coverLetterLanguage: 'German',
    hiringManagerName: '',
    startDate: '',
    hoursPerWeek: '',
    relocationNote: '',
  })
  const [syncLanguages, setSyncLanguages] = useState(true)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [latexSource, setLatexSource] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'latex' | 'cover' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/application-pack', { credentials: 'include' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Could not load')
      setIsPro(!!data.isPro)
      setFreeLimit(typeof data.freeLimit === 'number' ? data.freeLimit : 3)
      setPackCount(typeof data.applicationPackCount === 'number' ? data.applicationPackCount : 0)
      setRemaining(data.isPro ? null : typeof data.remaining === 'number' ? data.remaining : 3)
      setDraftId(data.draftId || null)
      setDraftTitle(data.draftTitle || null)
      if (data.profile) setProfile({ ...emptyStudentProfile(), ...data.profile })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
      return
    }
    if (status === 'authenticated') void load()
  }, [status, router, load])

  const setProfileField = (key: keyof StudentProfileInput, value: string) => {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  const setJobField = <K extends keyof JobApplicationInput>(key: K, value: JobApplicationInput[K]) => {
    setJob((j) => ({ ...j, [key]: value }))
  }

  const setResumeLanguage = (lang: ApplicationLanguage) => {
    setJob((j) => ({
      ...j,
      resumeLanguage: lang,
      language: lang,
      coverLetterLanguage: syncLanguages ? lang : j.coverLetterLanguage,
    }))
  }

  const setCoverLetterLanguage = (lang: ApplicationLanguage) => {
    setSyncLanguages(false)
    setJob((j) => ({ ...j, coverLetterLanguage: lang }))
  }

  const LanguageToggle = ({
    value,
    onChange,
    label,
  }: {
    value: ApplicationLanguage
    onChange: (v: ApplicationLanguage) => void
    label: string
  }) => (
    <div>
      <p className="text-xs text-gray-500 mb-1.5">{label}</p>
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-950 border border-gray-700">
        {(['German', 'English'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={cn(
              'py-2.5 rounded-lg text-sm font-medium transition-colors',
              value === lang
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            {lang === 'German' ? 'Deutsch' : 'English'}
          </button>
        ))}
      </div>
    </div>
  )

  const runAnalyze = async () => {
    setBusy('Analyzing job match…')
    setError(null)
    try {
      const r = await fetch('/api/application-pack', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', profile, ...job }),
      })
      const data = await r.json()
      if (r.status === 403 && data.requiresUpgrade) {
        setError(data.error)
        if (typeof data.remaining === 'number') setRemaining(data.remaining)
        return
      }
      if (!r.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data.analysis)
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setBusy(null)
    }
  }

  const runGenerate = async () => {
    setBusy('Generating Lebenslauf (LaTeX) + Anschreiben…')
    setError(null)
    try {
      const r = await fetch('/api/application-pack', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          profile,
          ...job,
          analysis: analysis || undefined,
          saveToDraft: !!draftId,
          draftId,
        }),
      })
      const data = await r.json()
      if (r.status === 403 && data.requiresUpgrade) {
        setError(data.error)
        if (typeof data.remaining === 'number') setRemaining(data.remaining)
        return
      }
      if (!r.ok) throw new Error(data.error || 'Generation failed')
      setAnalysis(data.analysis)
      setLatexSource(data.latexSource || '')
      setCoverLetter(data.coverLetter || '')
      if (typeof data.applicationPackCount === 'number') setPackCount(data.applicationPackCount)
      if (data.remaining === null) setRemaining(null)
      else if (typeof data.remaining === 'number') setRemaining(data.remaining)
      else if (typeof data.applicationPackCount === 'number' && !isPro) {
        setRemaining(Math.max(0, freeLimit - data.applicationPackCount))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setBusy(null)
    }
  }

  const compilableLatex = () =>
    finalizeLatexDocument(
      latexSource,
      job.resumeLanguage === 'German' ? 'ngerman' : 'english'
    )

  const compilableCoverLetter = () =>
    finalizeCoverLetterLatex(
      coverLetter,
      job.coverLetterLanguage === 'German' ? 'ngerman' : 'english'
    )

  const copyText = async (text: string, which: 'latex' | 'cover') => {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadTex = () => {
    const blob = new Blob([compilableLatex()], { type: 'application/x-tex' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(profile.name || 'Resume').replace(/\s+/g, '_')}_${(job.companyName || 'Application').replace(/\s+/g, '_')}.tex`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const downloadCover = () => {
    const blob = new Blob([compilableCoverLetter()], { type: 'application/x-tex' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(profile.name || 'CoverLetter').replace(/\s+/g, '_')}_${(job.companyName || 'Application').replace(/\s+/g, '_')}_Anschreiben.tex`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-sm">Loading application pack…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Link href="/profile" className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Profile
          </Link>
          <div className="flex-1" />
          {isPro ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400 px-3 py-1.5 rounded-lg bg-yellow-900/20 border border-yellow-700/40">
              <Crown className="w-3.5 h-3.5" /> Unlimited Application Packs
            </span>
          ) : remaining !== null && remaining > 0 ? (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-900/20 border border-emerald-700/40">
              {remaining} of {freeLimit} free packs left
              {packCount > 0 ? ` · ${packCount} used` : ''}
              <Link href="/pricing" className="text-amber-300 hover:underline inline-flex items-center gap-1">
                <Crown className="w-3 h-3" /> Upgrade
              </Link>
            </span>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-200 border border-amber-500/30"
            >
              <Crown className="w-3.5 h-3.5" /> Free limit used — Upgrade
            </Link>
          )}
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-blue-300 text-sm mb-2">
            <Sparkles className="w-4 h-4" /> Germany / EU job applications
          </div>
          <h1 className="text-3xl font-bold mb-2">Application Pack</h1>
          <p className="text-gray-400 max-w-2xl">
            Paste a job description. We match it to your resume profile, then generate a tailored{' '}
            <strong className="text-gray-200">LaTeX Lebenslauf</strong> and a B1-friendly{' '}
            <strong className="text-gray-200">Anschreiben</strong> (or English).
            {!isPro && (
              <>
                {' '}
                Free accounts get <strong className="text-gray-200">{freeLimit} packs</strong>
                {packCount > 0 ? ` (${packCount} used)` : ''}.
              </>
            )}
          </p>
          {draftTitle ? (
            <p className="text-xs text-gray-500 mt-2">
              Prefilled from draft: <span className="text-gray-300">{draftTitle}</span>
              {' · '}
              <Link href="/dashboard/resume-builder" className="text-blue-400 hover:underline">
                Edit in Resume Builder
              </Link>
            </p>
          ) : (
            <p className="text-xs text-amber-400/90 mt-2">
              No resume draft found. Create one in{' '}
              <Link href="/dashboard/resume-builder" className="underline">
                Resume Builder
              </Link>{' '}
              (import or from profile), or fill the fields below.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-200 text-sm flex flex-wrap items-center gap-3">
            <span className="flex-1">{error}</span>
            {error.toLowerCase().includes('pro') && (
              <Link href="/pricing" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs">
                Upgrade <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {busy && (
          <div className="mb-6 p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-200 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> {busy}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Profile */}
          <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Your profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ['name', 'Full name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['address', 'Address'],
                  ['city', 'City (for letter date line)'],
                  ['linkedin', 'LinkedIn URL'],
                  ['github', 'GitHub URL'],
                  ['portfolio', 'Portfolio URL'],
                  ['nationality', 'Nationality'],
                  ['dateOfBirth', 'Date of birth'],
                  ['residencePermit', 'Residence permit'],
                  ['languages', 'Languages (e.g. English C1, German B1)'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className={key === 'languages' || key === 'address' ? 'sm:col-span-2' : ''}>
                  <label className={labelCls}>{label}</label>
                  <input className={inputCls} value={profile[key]} onChange={(e) => setProfileField(key, e.target.value)} />
                </div>
              ))}
            </div>
            {(
              [
                ['education', 'Education', 4],
                ['workExperience', 'Work experience', 8],
                ['projects', 'Projects', 8],
                ['certifications', 'Certifications', 3],
                ['skills', 'Skills (by category)', 5],
              ] as const
            ).map(([key, label, rows]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <textarea
                  className={cn(inputCls, 'font-mono text-xs')}
                  rows={rows}
                  value={profile[key]}
                  onChange={(e) => setProfileField(key, e.target.value)}
                />
              </div>
            ))}
          </section>

          {/* Job */}
          <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Target job
            </h2>

            <div className="rounded-xl border border-blue-700/40 bg-blue-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-200 font-medium">
                <Languages className="w-4 h-4" />
                Document language
              </div>
              <p className="text-xs text-gray-400">
                Choose the language for your generated Lebenslauf (LaTeX) and Anschreiben.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LanguageToggle
                  label="Resume / Lebenslauf"
                  value={job.resumeLanguage}
                  onChange={setResumeLanguage}
                />
                <LanguageToggle
                  label="Cover letter / Anschreiben"
                  value={job.coverLetterLanguage}
                  onChange={setCoverLetterLanguage}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncLanguages}
                  onChange={(e) => {
                    const on = e.target.checked
                    setSyncLanguages(on)
                    if (on) {
                      setJob((j) => ({
                        ...j,
                        coverLetterLanguage: j.resumeLanguage,
                        language: j.resumeLanguage,
                      }))
                    }
                  }}
                />
                Use the same language for resume and cover letter
              </label>
              <p className="text-[11px] text-gray-500">
                Generating in:{' '}
                <span className="text-gray-300">
                  Resume → {job.resumeLanguage === 'German' ? 'Deutsch' : 'English'}
                </span>
                {' · '}
                <span className="text-gray-300">
                  Letter → {job.coverLetterLanguage === 'German' ? 'Deutsch' : 'English'}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Company name</label>
                <input className={inputCls} value={job.companyName} onChange={(e) => setJobField('companyName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Company city</label>
                <input className={inputCls} value={job.companyCity} onChange={(e) => setJobField('companyCity', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Hiring manager (optional)</label>
                <input
                  className={inputCls}
                  value={job.hiringManagerName}
                  onChange={(e) => setJobField('hiringManagerName', e.target.value)}
                  placeholder="Frau Müller / Herr Schmidt"
                />
              </div>
              <div>
                <label className={labelCls}>Available from</label>
                <input className={inputCls} value={job.startDate} onChange={(e) => setJobField('startDate', e.target.value)} placeholder="01.09.2026" />
              </div>
              <div>
                <label className={labelCls}>Hours / week</label>
                <input className={inputCls} value={job.hoursPerWeek} onChange={(e) => setJobField('hoursPerWeek', e.target.value)} placeholder="20 / full-time" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Relocation / commute note</label>
                <input
                  className={inputCls}
                  value={job.relocationNote}
                  onChange={(e) => setJobField('relocationNote', e.target.value)}
                  placeholder="Lives in Cologne, 30 minutes away / willing to relocate to Munich"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Job description (paste full text)</label>
              <textarea
                className={cn(inputCls, 'min-h-[280px] font-mono text-xs')}
                value={job.jobDescription}
                onChange={(e) => setJobField('jobDescription', e.target.value)}
                placeholder="Paste the Stellenausschreibung here…"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={!!busy || (!isPro && remaining === 0)}
                onClick={() => void runAnalyze()}
                className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Target className="w-4 h-4" /> 1. Analyze match
              </button>
              <button
                type="button"
                disabled={!!busy || (!isPro && remaining === 0)}
                onClick={() => void runGenerate()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> 2. Generate pack
              </button>
            </div>
          </section>
        </div>

        {analysis && (
          <section className="mb-8 rounded-2xl border border-gray-800 bg-gray-900/50 p-5">
            <h2 className="text-lg font-semibold mb-3">Match analysis</h2>
            <div className="flex flex-wrap items-end gap-6 mb-4">
              <div>
                <p className="text-xs text-gray-500">Match score</p>
                <p className="text-4xl font-bold text-emerald-400">{Math.round(analysis.match_score)}</p>
              </div>
              <p className="text-sm text-gray-300 max-w-xl">{analysis.profile_summary_focus}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Top keywords</p>
                <p className="text-gray-300">{analysis.top_keywords.join(' · ') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Best projects</p>
                <p className="text-gray-300">{analysis.best_projects.join(' · ') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Missing skills</p>
                <p className="text-amber-200/90">{analysis.missing_skills.join(' · ') || 'None flagged'}</p>
              </div>
            </div>
          </section>
        )}

        {(latexSource || coverLetter) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 flex flex-col min-h-[420px]">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold flex-1">
                  LaTeX resume
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({job.resumeLanguage === 'German' ? 'Deutsch' : 'English'})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => void copyText(compilableLatex(), 'latex')}
                  className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 inline-flex items-center gap-1"
                >
                  {copied === 'latex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
                <button type="button" onClick={downloadTex} className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">
                  .tex
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Copy or download this file for Overleaf/pdflatex (safe preamble included). Place{' '}
                <code className="text-gray-400">photo.png</code> next to the .tex for the header photo.
              </p>
              <pre className="flex-1 overflow-auto text-[11px] leading-relaxed bg-black/40 border border-gray-800 rounded-xl p-3 text-gray-300 whitespace-pre-wrap">
                {compilableLatex()}
              </pre>
            </section>

            <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-5 flex flex-col min-h-[420px]">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold flex-1">
                  Cover letter
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({job.coverLetterLanguage === 'German' ? 'Deutsch' : 'English'})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => void copyText(compilableCoverLetter(), 'cover')}
                  className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 inline-flex items-center gap-1"
                >
                  {copied === 'cover' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
                <button type="button" onClick={downloadCover} className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">
                  .tex
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Compilable Anschreiben LaTeX. Copy or download for Overleaf/pdflatex.
              </p>
              <pre className="flex-1 overflow-auto text-[11px] leading-relaxed bg-black/40 border border-gray-800 rounded-xl p-3 text-gray-300 whitespace-pre-wrap">
                {compilableCoverLetter()}
              </pre>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
