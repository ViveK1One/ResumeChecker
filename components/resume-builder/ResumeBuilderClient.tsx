'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  FileDown,
  FileText,
  Sparkles,
  Copy,
  Plus,
  Trash2,
  GripVertical,
  ChevronLeft,
  Wand2,
} from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { ResumePreview } from '@/components/resume-builder/ResumePreview'
import type { ResumeDraftContent, SectionKey, BulletPriority } from '@/lib/resumeDraft/types'
import { emptyResumeDraftContent, newExperienceEntry, newProjectEntry, newEducationEntry, newAdditionalLink } from '@/lib/resumeDraft/defaults'
import { getPreviewContent } from '@/lib/resumeDraft/previewModel'
import { estimatePageOverflow } from '@/lib/resumeDraft/onePage'
import { downloadResumePdfFromElement } from '@/lib/resumeDraft/pdfExportClient'
import { cn } from '@/lib/utils'

const NAV: { key: SectionKey; label: string }[] = [
  { key: 'header', label: 'Header / Contact' },
  { key: 'summary', label: 'Summary' },
  { key: 'skills', label: 'Skills' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'education', label: 'Education' },
  { key: 'additionalLinks', label: 'Additional Links' },
]

function bullet(text = '', priority: BulletPriority = 'medium') {
  return { id: uuidv4(), text, priority, selected: true }
}

export default function ResumeBuilderClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paramId = searchParams.get('id')

  const [draftId, setDraftId] = useState<string | null>(paramId)
  const [title, setTitle] = useState('My Resume')
  const [draft, setDraft] = useState<ResumeDraftContent>(() => emptyResumeDraftContent())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeSection, setActiveSection] = useState<SectionKey>('header')
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [showStart, setShowStart] = useState(false)
  const [draftsList, setDraftsList] = useState<{ id: string; title: string }[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  const previewContent = useMemo(() => {
    const mode = draft.layoutOptions.onePageMode ? 'onePage' : 'full'
    return getPreviewContent(draft, mode)
  }, [draft])

  const overflow = useMemo(
    () => estimatePageOverflow(draft, draft.layoutOptions.onePageMode),
    [draft]
  )

  const loadDraft = useCallback(
    async (id: string) => {
      setLoading(true)
      setSaveError(null)
      try {
        const r = await fetch(`/api/resume-drafts/${id}`, { credentials: 'include' })
        if (!r.ok) throw new Error('Could not load resume draft.')
        const data = await r.json()
        setDraftId(id)
        setTitle(data.title || 'My Resume')
        const {
          templateType,
          fullName,
          location,
          phone,
          email,
          linkedin,
          github,
          leetcode,
          portfolio,
          summary,
          skillsGroups,
          experience,
          projects,
          certifications,
          education,
          additionalLinks,
          layoutOptions,
          generatedLatex,
          generatedHtml,
        } = data
        setDraft({
          templateType: templateType || 'latex-classic',
          fullName: fullName || '',
          location: location || '',
          phone: phone || '',
          email: email || '',
          linkedin: linkedin || '',
          github: github || '',
          leetcode: leetcode || '',
          portfolio: portfolio || '',
          summary: summary || '',
          skillsGroups: Array.isArray(skillsGroups) ? skillsGroups : emptyResumeDraftContent().skillsGroups,
          experience: Array.isArray(experience) ? experience : [],
          projects: Array.isArray(projects) ? projects : [],
          certifications: Array.isArray(certifications) ? certifications : [],
          education: Array.isArray(education) ? education : [],
          additionalLinks: Array.isArray(additionalLinks) ? additionalLinks : [],
          layoutOptions: {
            ...emptyResumeDraftContent().layoutOptions,
            ...(layoutOptions || {}),
          },
          generatedLatex: generatedLatex || '',
          generatedHtml: generatedHtml || '',
        })
        router.replace(`/dashboard/resume-builder?id=${id}`, { scroll: false })
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Load failed')
      } finally {
        setLoading(false)
      }
    },
    [router]
  )

  useEffect(() => {
    if (paramId && paramId !== draftId) {
      void loadDraft(paramId)
    } else if (!paramId) {
      setLoading(false)
      setShowStart(true)
    }
  }, [paramId, draftId, loadDraft])

  useEffect(() => {
    if (!draftId) return
    fetch('/api/resume-drafts', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.drafts) setDraftsList(d.drafts.map((x: { id: string; title: string }) => ({ id: x.id, title: x.title })))
      })
      .catch(() => {})
  }, [draftId])

  const persist = useCallback(
    async (next: ResumeDraftContent, nextTitle?: string) => {
      if (!draftId) return
      setSaving(true)
      setSaveError(null)
      try {
        const r = await fetch(`/api/resume-drafts/${draftId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: nextTitle ?? title,
            ...next,
          }),
        })
        if (!r.ok) throw new Error('Autosave failed. Check your connection.')
        setLastSaved(new Date())
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Save failed')
      } finally {
        setSaving(false)
      }
    },
    [draftId, title]
  )

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    await persist(draft, title)
  }, [draft, title, persist])

  const scheduleSave = useCallback(
    (next: ResumeDraftContent, nextTitle?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void persist(next, nextTitle)
      }, 1200)
    },
    [persist]
  )

  const updateDraft = useCallback(
    (fn: (d: ResumeDraftContent) => ResumeDraftContent) => {
      setDraft((prev) => {
        const n = fn(prev)
        scheduleSave(n)
        return n
      })
    },
    [scheduleSave]
  )

  const handleCreateBlank = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/resume-drafts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Resume' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Could not create draft')
      setShowStart(false)
      await loadDraft(data.id)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (file: File) => {
    setLoading(true)
    setAiBusy('Parsing resume and mapping sections…')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name.replace(/\.[^.]+$/, '') || 'Imported Resume')
      const r = await fetch('/api/resume-drafts/import', { method: 'POST', body: fd, credentials: 'include' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Import failed')
      setShowStart(false)
      await loadDraft(data.id)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setLoading(false)
      setAiBusy(null)
    }
  }

  const handleFromProfile = async () => {
    setLoading(true)
    setAiBusy('Building a starter resume from your profile and ATS history…')
    try {
      const r = await fetch('/api/resume-drafts/from-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Profile Resume' }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Generation failed')
      setShowStart(false)
      await loadDraft(data.id)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
      setAiBusy(null)
    }
  }

  const duplicateDraft = async () => {
    if (!draftId) return
    setLoading(true)
    try {
      const r = await fetch('/api/resume-drafts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateFrom: draftId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Duplicate failed')
      await loadDraft(data.id)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Duplicate failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async (onePage: boolean) => {
    if (!draftId) return
    const name = sanitizeFilePart(draft.fullName || 'Resume')
    const suffix = onePage ? 'Resume_1Page' : 'Resume'
    const fileName = `${name}_${suffix}.pdf`
    setAiBusy('Saving…')
    try {
      await flushSave()
      setAiBusy('Generating PDF…')
      const r = await fetch(`/api/resume-drafts/${draftId}/export-pdf`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: onePage ? 'onePage' : 'full' }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || 'PDF export failed')
      }
      const blob = await r.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'PDF export failed'
      setSaveError(`${msg} Try again or use the preview fallback below.`)
      if (previewRef.current) {
        setAiBusy('Using preview export…')
        await downloadResumePdfFromElement(previewRef.current, fileName)
      }
    } finally {
      setAiBusy(null)
    }
  }

  const downloadDocx = async (onePage: boolean) => {
    if (!draftId) return
    const r = await fetch(`/api/resume-drafts/${draftId}/export-docx`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: onePage ? 'onePage' : 'full' }),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      setSaveError(err.error || 'DOCX export failed')
      return
    }
    const blob = await r.blob()
    const name = sanitizeFilePart(draft.fullName || 'Resume')
    const suffix = onePage ? 'Resume_1Page' : 'Resume'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${name}_${suffix}.docx`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const runAi = async (body: Record<string, unknown>) => {
    if (!draftId) return null
    setAiBusy('Working with AI…')
    try {
      const r = await fetch('/api/resume-drafts/ai', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, ...body }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'AI request failed')
      return data
    } finally {
      setAiBusy(null)
    }
  }

  if (loading && !draftId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-300">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-sm">{aiBusy || 'Loading…'}</p>
      </div>
    )
  }

  if (showStart && !draftId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-white mb-2">Resume Builder</h1>
        <p className="text-gray-400 mb-8">Choose how you want to start. Everything stays editable.</p>
        <div className="grid gap-4">
          <button
            type="button"
            onClick={() => void handleCreateBlank()}
            className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-gray-900/80 p-6 text-left hover:border-blue-500/50 transition-colors"
          >
            <Plus className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Build from scratch</p>
              <p className="text-sm text-gray-500">Structured form, live preview, exports.</p>
            </div>
          </button>
          <label className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-gray-900/80 p-6 cursor-pointer hover:border-blue-500/50 transition-colors">
            <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Import existing resume</p>
              <p className="text-sm text-gray-500">PDF or DOCX — we map sections for you to fix.</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleImport(f)
                e.target.value = ''
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void handleFromProfile()}
            className="flex items-center gap-4 rounded-2xl border border-gray-700 bg-gray-900/80 p-6 text-left hover:border-blue-500/50 transition-colors"
          >
            <Sparkles className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Generate from profile</p>
              <p className="text-sm text-gray-500">Uses your account, ATS keywords, and past analyses.</p>
            </div>
          </button>
        </div>
        {saveError && <p className="text-red-400 text-sm mt-6">{saveError}</p>}
      </div>
    )
  }

  if (!draftId) return null

  const hidden = (k: string) => draft.layoutOptions.hiddenSections.includes(k)
  const toggleHidden = (k: string) => {
    updateDraft((d) => {
      const hs = d.layoutOptions.hiddenSections
      const has = hs.includes(k)
      return {
        ...d,
        layoutOptions: {
          ...d.layoutOptions,
          hiddenSections: has ? hs.filter((x) => x !== k) : [...hs, k],
        },
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-gray-800 bg-black/40 px-4 py-3 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/resume-builder"
          className="text-gray-400 hover:text-white text-sm inline-flex items-center gap-1"
          onClick={(e) => {
            e.preventDefault()
            setDraftId(null)
            setShowStart(true)
            router.replace('/dashboard/resume-builder')
          }}
        >
          <ChevronLeft className="w-4 h-4" /> All modes
        </Link>
        <input
          value={title}
          onChange={(e) => {
            const v = e.target.value
            setTitle(v)
            scheduleSave(draft, v)
          }}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm max-w-[220px]"
        />
        <span className="text-xs text-gray-500">
          {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Autosave on'}
        </span>
        {draftsList.length > 0 && (
          <select
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 max-w-[180px]"
            value={draftId || ''}
            onChange={(e) => {
              const id = e.target.value
              if (id) void loadDraft(id)
            }}
          >
            {draftsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title || 'Untitled'}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
          onClick={() => void flushSave()}
        >
          {saving ? 'Saving…' : 'Save now'}
        </button>
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.layoutOptions.onePageMode}
            onChange={(e) =>
              updateDraft((d) => ({
                ...d,
                layoutOptions: { ...d.layoutOptions, onePageMode: e.target.checked },
              }))
            }
          />
          1-page mode
        </label>
        <button
          type="button"
          onClick={() => void duplicateDraft()}
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 inline-flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </button>
        <button
          type="button"
          onClick={async () => {
            const data = await runAi({ action: 'optimizeOnePage' })
            if (data?.draft) {
              const next = data.draft as ResumeDraftContent
              setDraft(next)
              void persist(next, title)
            }
          }}
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-200 border border-amber-500/30 hover:bg-amber-600/30 inline-flex items-center gap-1"
        >
          <Wand2 className="w-3.5 h-3.5" /> Optimize to 1 page
        </button>
      </div>

      {saveError && <div className="px-4 py-2 bg-red-950/50 text-red-300 text-sm border-b border-red-900/50">{saveError}</div>}
      {overflow.likelyOverflow && draft.layoutOptions.onePageMode && (
        <div className="px-4 py-2 bg-amber-950/40 text-amber-200/90 text-sm border-b border-amber-900/40">{overflow.hint}</div>
      )}
      {aiBusy && (
        <div className="px-4 py-2 bg-blue-950/40 text-blue-200 text-sm flex items-center gap-2 border-b border-blue-900/30">
          <Loader2 className="w-4 h-4 animate-spin" /> {aiBusy}
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0">
        {/* Nav */}
        <aside className="lg:col-span-2 border-r border-gray-800 bg-gray-950/80 p-3 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sections</p>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setActiveSection(n.key)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  activeSection === n.key ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-gray-800/80'
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Editor */}
        <main className="lg:col-span-5 border-r border-gray-800 p-4 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-8rem)]">
          <EditorBody
            activeSection={activeSection}
            draft={draft}
            updateDraft={updateDraft}
            hidden={hidden}
            toggleHidden={toggleHidden}
            runAi={runAi}
            title={title}
          />
        </main>

        {/* Preview */}
        <section className="lg:col-span-5 bg-gray-900/50 p-4 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-8rem)]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Preview</span>
            <span className="text-xs text-gray-500">
              {draft.layoutOptions.onePageMode ? '1-page layout' : 'Full resume'}
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => void downloadPdf(false)}
              title="Letter-size PDF with selectable text (ATS-friendly)"
              className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 inline-flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              type="button"
              onClick={() => void downloadPdf(true)}
              title="One-page compact Letter PDF"
              className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            >
              PDF (1p)
            </button>
            <button
              type="button"
              onClick={() => void downloadDocx(false)}
              className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            >
              DOCX
            </button>
            <button
              type="button"
              onClick={() => void downloadDocx(true)}
              className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
            >
              DOCX (1p)
            </button>
          </div>
          <div ref={previewRef} className="rounded-lg overflow-hidden shadow-xl">
            <ResumePreview content={previewContent} />
          </div>
        </section>
      </div>
    </div>
  )
}

function sanitizeFilePart(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').slice(0, 60) || 'Resume'
}

function EditorBody({
  activeSection,
  draft,
  updateDraft,
  hidden,
  toggleHidden,
  runAi,
  title,
}: {
  activeSection: SectionKey
  draft: ResumeDraftContent
  updateDraft: (fn: (d: ResumeDraftContent) => ResumeDraftContent) => void
  hidden: (k: string) => boolean
  toggleHidden: (k: string) => void
  runAi: (body: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  title: string
}) {
  const inputCls =
    'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:ring-2 focus:ring-blue-500/40 outline-none'

  if (activeSection === 'header') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Header / Contact</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('header')} onChange={() => toggleHidden('header')} />
            Visible
          </label>
        </div>
        {(['fullName', 'location', 'phone', 'email', 'linkedin', 'github', 'leetcode', 'portfolio'] as const).map((field) => (
          <div key={field}>
            <label className="text-xs text-gray-500 capitalize block mb-1">{field.replace(/([A-Z])/g, ' $1')}</label>
            <input
              className={inputCls}
              value={draft[field] || ''}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  [field]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>
    )
  }

  if (activeSection === 'summary') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.layoutOptions.includeSummary}
              onChange={(e) =>
                updateDraft((d) => ({
                  ...d,
                  layoutOptions: { ...d.layoutOptions, includeSummary: e.target.checked },
                }))
              }
            />
            Include
          </label>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('summary')} onChange={() => toggleHidden('summary')} />
            Visible
          </label>
        </div>
        <textarea
          className={cn(inputCls, 'min-h-[120px]')}
          value={draft.summary}
          onChange={(e) => updateDraft((d) => ({ ...d, summary: e.target.value }))}
          placeholder="Optional professional summary…"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-200 border border-blue-500/30"
            onClick={async () => {
              const data = await runAi({ action: 'generateSummary', targetRole: 'Software Engineer' })
              if (data?.summary) updateDraft((d) => ({ ...d, summary: data.summary as string }))
            }}
          >
            Generate summary
          </button>
          <TailorInline runAi={runAi} updateDraft={updateDraft} title={title} />
        </div>
      </div>
    )
  }

  if (activeSection === 'skills') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Skills</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('skills')} onChange={() => toggleHidden('skills')} />
            Visible
          </label>
        </div>
        {draft.skillsGroups.map((g, gi) => (
          <div key={g.id} className="border border-gray-800 rounded-xl p-3 space-y-2">
            <input
              className={cn(inputCls, 'font-medium')}
              value={g.name}
              onChange={(e) =>
                updateDraft((d) => {
                  const skillsGroups = [...d.skillsGroups]
                  skillsGroups[gi] = { ...g, name: e.target.value }
                  return { ...d, skillsGroups }
                })
              }
            />
            <textarea
              className={cn(inputCls, 'min-h-[72px] font-mono text-xs')}
              value={g.items.join(', ')}
              onChange={(e) =>
                updateDraft((d) => {
                  const raw = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  const uniq = Array.from(new Set(raw))
                  const skillsGroups = [...d.skillsGroups]
                  skillsGroups[gi] = { ...g, items: uniq }
                  return { ...d, skillsGroups }
                })
              }
              placeholder="Comma-separated skills"
            />
          </div>
        ))}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
            onClick={() =>
              updateDraft((d) => ({
                ...d,
                skillsGroups: [...d.skillsGroups, { id: uuidv4(), name: 'Custom', items: [] }],
              }))
            }
          >
            Add group
          </button>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-200 border border-blue-500/30"
            onClick={async () => {
              const data = await runAi({ action: 'improveSkills' })
              if (data?.skillsGroups) {
                const merged = (data.skillsGroups as typeof draft.skillsGroups).map((g: { name: string; items: string[] }) => ({
                  id: uuidv4(),
                  name: g.name,
                  items: g.items || [],
                }))
                updateDraft((d) => ({ ...d, skillsGroups: merged }))
              }
            }}
          >
            Improve skills wording
          </button>
        </div>
      </div>
    )
  }

  if (activeSection === 'experience') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Experience</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('experience')} onChange={() => toggleHidden('experience')} />
            Visible
          </label>
        </div>
        {draft.experience.map((job, ji) => (
          <div key={job.id} className="border border-gray-800 rounded-xl p-3 space-y-2 relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  experience: d.experience.filter((_, i) => i !== ji),
                }))
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-2 pr-8">
              {(['company', 'role', 'location', 'startDate', 'endDate'] as const).map((f) => (
                <div key={f} className={f === 'company' || f === 'role' ? 'col-span-2' : ''}>
                  <label className="text-xs text-gray-500 capitalize">{f}</label>
                  <input
                    className={inputCls}
                    value={job[f]}
                    onChange={(e) =>
                      updateDraft((d) => {
                        const experience = [...d.experience]
                        experience[ji] = { ...job, [f]: e.target.value }
                        return { ...d, experience }
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Bullets</p>
            {job.bullets.map((b, bi) => (
              <div key={b.id} className="flex gap-2 items-start">
                <GripVertical className="w-4 h-4 text-gray-600 shrink-0 mt-2" />
                <textarea
                  className={cn(inputCls, 'flex-1 min-h-[56px] text-xs')}
                  value={b.text}
                  onChange={(e) =>
                    updateDraft((d) => {
                      const experience = [...d.experience]
                      const bullets = [...job.bullets]
                      bullets[bi] = { ...b, text: e.target.value }
                      experience[ji] = { ...job, bullets }
                      return { ...d, experience }
                    })
                  }
                />
                <select
                  className="bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 px-1"
                  value={b.priority}
                  onChange={(e) =>
                    updateDraft((d) => {
                      const experience = [...d.experience]
                      const bullets = [...job.bullets]
                      bullets[bi] = { ...b, priority: e.target.value as BulletPriority }
                      experience[ji] = { ...job, bullets }
                      return { ...d, experience }
                    })
                  }
                >
                  <option value="high">High</option>
                  <option value="medium">Med</option>
                  <option value="low">Low</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={b.selected}
                    onChange={(e) =>
                      updateDraft((d) => {
                        const experience = [...d.experience]
                        const bullets = [...job.bullets]
                        bullets[bi] = { ...b, selected: e.target.checked }
                        experience[ji] = { ...job, bullets }
                        return { ...d, experience }
                      })
                    }
                  />
                  On
                </label>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-300"
                    onClick={async () => {
                      const data = await runAi({ action: 'rewriteBullet', bulletText: b.text, mode: 'stronger' })
                      if (data?.text) {
                        updateDraft((d) => {
                          const experience = [...d.experience]
                          const bullets = [...job.bullets]
                          bullets[bi] = { ...b, text: data.text as string }
                          experience[ji] = { ...job, bullets }
                          return { ...d, experience }
                        })
                      }
                    }}
                  >
                    AI
                  </button>
                  <button
                    type="button"
                    className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-300"
                    onClick={() =>
                      updateDraft((d) => {
                        const experience = [...d.experience]
                        const bullets = [...job.bullets]
                        const nb = bullet('', b.priority)
                        bullets.splice(bi + 1, 0, nb)
                        experience[ji] = { ...job, bullets }
                        return { ...d, experience }
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
          onClick={() => updateDraft((d) => ({ ...d, experience: [...d.experience, newExperienceEntry()] }))}
        >
          Add role
        </button>
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-200 border border-blue-500/30 block"
          onClick={async () => {
            const data = await runAi({ action: 'improveSection', section: 'experience' })
            if (data?.experience) {
              updateDraft((d) => ({ ...d, experience: data.experience as typeof d.experience }))
            }
          }}
        >
          Improve experience section
        </button>
      </div>
    )
  }

  if (activeSection === 'projects') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('projects')} onChange={() => toggleHidden('projects')} />
            Visible
          </label>
        </div>
        {draft.projects.map((proj, pi) => (
          <div key={proj.id} className="border border-gray-800 rounded-xl p-3 space-y-2">
            <div className="flex justify-between">
              <input
                className={cn(inputCls, 'font-medium')}
                placeholder="Project name"
                value={proj.name}
                onChange={(e) =>
                  updateDraft((d) => {
                    const projects = [...d.projects]
                    projects[pi] = { ...proj, name: e.target.value }
                    return { ...d, projects }
                  })
                }
              />
              <button
                type="button"
                className="text-gray-500 hover:text-red-400 p-1"
                onClick={() =>
                  updateDraft((d) => ({
                    ...d,
                    projects: d.projects.filter((_, i) => i !== pi),
                  }))
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              className={inputCls}
              placeholder="Stack"
              value={proj.stack}
              onChange={(e) =>
                updateDraft((d) => {
                  const projects = [...d.projects]
                  projects[pi] = { ...proj, stack: e.target.value }
                  return { ...d, projects }
                })
              }
            />
            <input
              className={inputCls}
              placeholder="Link"
              value={proj.link}
              onChange={(e) =>
                updateDraft((d) => {
                  const projects = [...d.projects]
                  projects[pi] = { ...proj, link: e.target.value }
                  return { ...d, projects }
                })
              }
            />
            {proj.bullets.map((b, bi) => (
              <div key={b.id} className="flex gap-2">
                <textarea
                  className={cn(inputCls, 'flex-1 min-h-[48px] text-xs')}
                  value={b.text}
                  onChange={(e) =>
                    updateDraft((d) => {
                      const projects = [...d.projects]
                      const bullets = [...proj.bullets]
                      bullets[bi] = { ...b, text: e.target.value }
                      projects[pi] = { ...proj, bullets }
                      return { ...d, projects }
                    })
                  }
                />
                <button
                  type="button"
                  className="text-[10px] px-2 rounded bg-gray-800 text-gray-300 h-8 self-start"
                  onClick={async () => {
                    const data = await runAi({ action: 'rewriteBullet', bulletText: b.text, mode: 'concise' })
                    if (data?.text) {
                      updateDraft((d) => {
                        const projects = [...d.projects]
                        const bullets = [...proj.bullets]
                        bullets[bi] = { ...b, text: data.text as string }
                        projects[pi] = { ...proj, bullets }
                        return { ...d, projects }
                      })
                    }
                  }}
                >
                  AI
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-xs text-blue-300"
              onClick={() =>
                updateDraft((d) => {
                  const projects = [...d.projects]
                  const bullets = [...proj.bullets, bullet()]
                  projects[pi] = { ...proj, bullets }
                  return { ...d, projects }
                })
              }
            >
              + bullet
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
          onClick={() => updateDraft((d) => ({ ...d, projects: [...d.projects, newProjectEntry()] }))}
        >
          Add project
        </button>
      </div>
    )
  }

  if (activeSection === 'certifications') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Certifications / Achievements</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('certifications')} onChange={() => toggleHidden('certifications')} />
            Visible
          </label>
        </div>
        {draft.certifications.map((line, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputCls}
              value={line}
              onChange={(e) =>
                updateDraft((d) => {
                  const certifications = [...d.certifications]
                  certifications[i] = e.target.value
                  return { ...d, certifications }
                })
              }
            />
            <button
              type="button"
              className="text-gray-500"
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  certifications: d.certifications.filter((_, j) => j !== i),
                }))
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
          onClick={() => updateDraft((d) => ({ ...d, certifications: [...d.certifications, ''] }))}
        >
          Add line
        </button>
      </div>
    )
  }

  if (activeSection === 'education') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Education</h2>
          <label className="text-xs text-gray-400 flex items-center gap-2">
            <input type="checkbox" checked={!hidden('education')} onChange={() => toggleHidden('education')} />
            Visible
          </label>
        </div>
        {draft.education.map((ed, ei) => (
          <div key={ed.id} className="border border-gray-800 rounded-xl p-3 space-y-2 relative">
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-500"
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  education: d.education.filter((_, i) => i !== ei),
                }))
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {(['degree', 'institution', 'location', 'startDate', 'endDate'] as const).map((f) => (
              <div key={f}>
                <label className="text-xs text-gray-500 capitalize">{f}</label>
                <input
                  className={inputCls}
                  value={ed[f]}
                  onChange={(e) =>
                    updateDraft((d) => {
                      const education = [...d.education]
                      education[ei] = { ...ed, [f]: e.target.value }
                      return { ...d, education }
                    })
                  }
                />
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
          onClick={() => updateDraft((d) => ({ ...d, education: [...d.education, newEducationEntry()] }))}
        >
          Add education
        </button>
      </div>
    )
  }

  if (activeSection === 'additionalLinks') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Additional links</h2>
        {draft.additionalLinks.map((link, li) => (
          <div key={link.id} className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Label"
              value={link.label}
              onChange={(e) =>
                updateDraft((d) => {
                  const additionalLinks = [...d.additionalLinks]
                  additionalLinks[li] = { ...link, label: e.target.value }
                  return { ...d, additionalLinks }
                })
              }
            />
            <input
              className={inputCls}
              placeholder="URL"
              value={link.url}
              onChange={(e) =>
                updateDraft((d) => {
                  const additionalLinks = [...d.additionalLinks]
                  additionalLinks[li] = { ...link, url: e.target.value }
                  return { ...d, additionalLinks }
                })
              }
            />
            <button
              type="button"
              onClick={() =>
                updateDraft((d) => ({
                  ...d,
                  additionalLinks: d.additionalLinks.filter((_, i) => i !== li),
                }))
              }
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200"
          onClick={() => updateDraft((d) => ({ ...d, additionalLinks: [...d.additionalLinks, newAdditionalLink()] }))}
        >
          Add link
        </button>
      </div>
    )
  }

  return null
}

function TailorInline({
  runAi,
  updateDraft,
  title,
}: {
  runAi: (b: Record<string, unknown>) => Promise<Record<string, unknown> | null>
  updateDraft: (fn: (d: ResumeDraftContent) => ResumeDraftContent) => void
  title: string
}) {
  const [role, setRole] = useState('')
  const [jd, setJd] = useState('')
  return (
    <div className="flex flex-col gap-2 w-full border border-gray-800 rounded-xl p-3 bg-gray-900/50">
      <p className="text-xs text-gray-400">Tailor for target role ({title})</p>
      <input
        className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white"
        placeholder="Target title"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      />
      <textarea
        className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white min-h-[64px]"
        placeholder="Optional job description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />
      <button
        type="button"
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-200 border border-emerald-500/30 self-start"
        onClick={async () => {
          const data = await runAi({ action: 'tailorForRole', targetRole: role, jobDescription: jd })
          if (data?.draft) {
            updateDraft(() => data.draft as ResumeDraftContent)
          }
        }}
      >
        Tailor resume
      </button>
    </div>
  )
}
