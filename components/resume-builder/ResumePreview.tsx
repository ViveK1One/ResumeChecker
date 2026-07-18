'use client'

import type { ResumeDraftContent } from '@/lib/resumeDraft/types'
import { cn } from '@/lib/utils'

function SectionTitle({
  children,
  compact,
  latexClassic,
}: {
  children: React.ReactNode
  compact: boolean
  latexClassic: boolean
}) {
  if (latexClassic) {
    return (
      <div className={cn(compact ? 'mb-1.5' : 'mb-2')}>
        <h2
          className={cn(
            'text-left text-black border-b border-black pb-0.5',
            compact ? 'text-[10px]' : 'text-[11px]'
          )}
          style={{ fontVariant: 'small-caps', letterSpacing: '0.08em' }}
        >
          {children}
        </h2>
      </div>
    )
  }
  return (
    <div className={cn('border-b border-black', compact ? 'mb-1.5 pb-0.5' : 'mb-2 pb-1')}>
      <h2
        className={cn(
          'text-center font-bold uppercase tracking-[0.12em] text-black',
          compact ? 'text-[10px]' : 'text-[11px]'
        )}
      >
        {children}
      </h2>
    </div>
  )
}

function isHidden(content: ResumeDraftContent, key: string) {
  return content.layoutOptions.hiddenSections.includes(key)
}

export function ResumePreview({
  content,
  className,
  id,
}: {
  content: ResumeDraftContent
  className?: string
  id?: string
}) {
  const compact = content.layoutOptions.spacingDensity === 'compact' || content.layoutOptions.onePageMode
  const latexClassic = content.templateType === 'latex-classic'
  const scale = content.layoutOptions.fontScale
  const metaLine = [content.location, content.phone, content.email].filter(Boolean).join(' | ')
  const phoneEmailLine = [content.phone, content.email].filter(Boolean).join(' | ')
  const links = [
    content.linkedin && { label: 'LinkedIn', href: content.linkedin },
    content.github && { label: 'GitHub', href: content.github },
    content.leetcode && { label: 'LeetCode', href: content.leetcode },
    content.portfolio && { label: 'Projects', href: content.portfolio },
    ...content.additionalLinks
      .filter((l) => l.label.trim() && l.url.trim())
      .map((l) => ({ label: l.label, href: l.url })),
  ].filter(Boolean) as { label: string; href: string }[]

  return (
    <div
      id={id}
      className={cn(
        'bg-white text-black font-serif leading-snug shadow-sm border border-gray-200',
        'min-h-[800px] mx-auto print:shadow-none print:border-0',
        latexClassic ? 'max-w-[8.5in] px-[0.6in] py-[0.5in]' : 'max-w-[210mm] px-[14mm] py-[10mm]',
        className
      )}
      style={{
        fontSize: `${10.5 * scale}px`,
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
      }}
    >
      {!isHidden(content, 'header') && (
        <header className="text-center mb-3">
          <h1
            className={cn(
              'font-bold text-black tracking-tight',
              latexClassic ? 'text-[22px] leading-tight' : compact ? 'text-lg' : 'text-xl',
              latexClassic && 'font-semibold'
            )}
            style={{ fontFamily: 'inherit', fontVariant: latexClassic ? 'small-caps' : undefined }}
          >
            {content.fullName.trim() || 'Your Name'}
          </h1>
          {latexClassic ? (
            <>
              {content.location.trim() && (
                <p className={cn('text-gray-800', compact ? 'text-[10px] mt-1' : 'text-[10px] mt-1.5')}>
                  {content.location.trim()}
                </p>
              )}
              {phoneEmailLine && (
                <p className={cn('text-gray-800', compact ? 'text-[10px] mt-1' : 'text-[10px] mt-1.5')}>
                  {phoneEmailLine}
                </p>
              )}
            </>
          ) : (
            metaLine && (
              <p className={cn('text-gray-800', compact ? 'text-[9px] mt-0.5' : 'text-[10px] mt-1')}>{metaLine}</p>
            )
          )}
          {links.length > 0 && (
            <div
              className={cn(
                'flex flex-wrap justify-center underline-offset-2',
                latexClassic ? 'text-gray-900 gap-x-2' : 'text-blue-800',
                compact ? 'text-[8.5px] mt-1 gap-x-2' : 'text-[9px] mt-1.5 gap-x-3'
              )}
            >
              {links.map((l) => (
                <a
                  key={l.label + l.href}
                  href={l.href.startsWith('http') ? l.href : `https://${l.href}`}
                  className={latexClassic ? 'text-gray-900 underline hover:text-black' : 'hover:underline'}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </header>
      )}

      {content.layoutOptions.includeSummary &&
        !isHidden(content, 'summary') &&
        content.summary.trim() && (
          <section className={compact ? 'mb-2' : 'mb-3'}>
            <SectionTitle compact={compact} latexClassic={latexClassic}>
              Summary
            </SectionTitle>
            <p className={cn('text-justify text-gray-900', compact ? 'text-[9px] leading-relaxed' : 'text-[10px]')}>
              {content.summary.trim()}
            </p>
          </section>
        )}

      {!isHidden(content, 'skills') && content.skillsGroups.some((g) => g.items.length) && (
        <section className={compact ? 'mb-2' : 'mb-3'}>
          <SectionTitle compact={compact} latexClassic={latexClassic}>
            Skills
          </SectionTitle>
          <div className={cn('space-y-1', compact ? 'text-[9px]' : 'text-[10px]')}>
            {content.skillsGroups
              .filter((g) => g.items.length)
              .map((g) => (
                <p key={g.id}>
                  <span className="font-semibold">{g.name}: </span>
                  <span>{g.items.join(', ')}</span>
                </p>
              ))}
          </div>
        </section>
      )}

      {!isHidden(content, 'experience') && content.experience.length > 0 && (
        <section className={compact ? 'mb-2' : 'mb-3'}>
          <SectionTitle compact={compact} latexClassic={latexClassic}>
            Experience
          </SectionTitle>
          <div className="space-y-2">
            {content.experience.map((job) => (
              <div key={job.id}>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 items-baseline">
                  <span className={cn('font-bold', compact ? 'text-[10px]' : 'text-[11px]')}>{job.company}</span>
                  <span className={cn('text-gray-700', compact ? 'text-[8.5px]' : 'text-[9px]')}>
                    {job.startDate}
                    {job.startDate && job.endDate ? ' -- ' : ''}
                    {job.endDate}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-x-2">
                  <span className={cn('italic text-gray-900', compact ? 'text-[9.5px]' : 'text-[10px]')}>{job.role}</span>
                  {job.location && (
                    <span className={cn('italic text-gray-600', compact ? 'text-[8.5px]' : 'text-[9px]')}>{job.location}</span>
                  )}
                </div>
                <ul className={cn('list-disc pl-4 mt-1 space-y-0.5 text-gray-900', compact ? 'text-[9px]' : 'text-[10px]')}>
                  {job.bullets
                    .filter((b) => b.selected && b.text.trim())
                    .map((b) => (
                      <li key={b.id} className="pl-0.5">
                        {b.text.trim()}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isHidden(content, 'projects') && content.projects.length > 0 && (
        <section className={compact ? 'mb-2' : 'mb-3'}>
          <SectionTitle compact={compact} latexClassic={latexClassic}>
            Projects
          </SectionTitle>
          <div className="space-y-2">
            {content.projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex flex-wrap justify-between gap-x-2 items-baseline">
                  <span className={cn(latexClassic ? 'text-left' : '', compact ? 'text-[10px]' : 'text-[11px]')}>
                    <span className="font-semibold">{proj.name}</span>
                    {latexClassic && proj.stack.trim() && (
                      <span className="text-gray-800 italic">
                        {' | '}
                        {proj.stack.trim()}
                      </span>
                    )}
                  </span>
                  {proj.link && (
                    <a
                      href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                      className={cn(
                        latexClassic ? 'text-gray-900 underline text-[9px]' : 'text-blue-800 underline text-[9px]'
                      )}
                    >
                      Link
                    </a>
                  )}
                </div>
                {proj.stack.trim() && !latexClassic && (
                  <p className={cn('text-gray-700 italic', compact ? 'text-[8.5px]' : 'text-[9px]')}>{proj.stack}</p>
                )}
                <ul className={cn('list-disc pl-4 mt-0.5 space-y-0.5', compact ? 'text-[9px]' : 'text-[10px]')}>
                  {proj.bullets
                    .filter((b) => b.selected !== false && b.text.trim())
                    .map((b) => (
                      <li key={b.id}>{b.text.trim()}</li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isHidden(content, 'certifications') && content.certifications.some((c) => c.trim()) && (
        <section className={compact ? 'mb-2' : 'mb-3'}>
          <SectionTitle compact={compact} latexClassic={latexClassic}>
            Achievements / Certifications
          </SectionTitle>
          <ul className={cn('list-disc pl-4 space-y-0.5', compact ? 'text-[9px]' : 'text-[10px]')}>
            {content.certifications.filter((c) => c.trim()).map((c, i) => (
              <li key={i}>{c.trim()}</li>
            ))}
          </ul>
        </section>
      )}

      {!isHidden(content, 'education') && content.education.length > 0 && (
        <section className={compact ? 'mb-2' : 'mb-3'}>
          <SectionTitle compact={compact} latexClassic={latexClassic}>
            Education
          </SectionTitle>
          <div className="space-y-1.5">
            {content.education.map((ed) =>
              latexClassic ? (
                <div key={ed.id}>
                  <div className="flex flex-wrap justify-between gap-x-2">
                    <span className={cn('font-bold', compact ? 'text-[10px]' : 'text-[11px]')}>{ed.degree}</span>
                    <span className={cn('text-gray-700', compact ? 'text-[8.5px]' : 'text-[9px]')}>
                      {ed.startDate}
                      {ed.startDate && ed.endDate ? ' -- ' : ''}
                      {ed.endDate}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-2">
                    <span className={cn('italic text-gray-900', compact ? 'text-[9.5px]' : 'text-[10px]')}>{ed.institution}</span>
                    {ed.location && (
                      <span className={cn('italic text-gray-600', compact ? 'text-[8.5px]' : 'text-[9px]')}>{ed.location}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div key={ed.id}>
                  <div className="flex flex-wrap justify-between gap-x-2">
                    <span className={cn('font-semibold', compact ? 'text-[10px]' : 'text-[11px]')}>{ed.institution}</span>
                    <span className={cn('text-gray-700', compact ? 'text-[8.5px]' : 'text-[9px]')}>
                      {ed.startDate}
                      {ed.startDate && ed.endDate ? ' – ' : ''}
                      {ed.endDate}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-2">
                    <span className={cn('italic', compact ? 'text-[9.5px]' : 'text-[10px]')}>{ed.degree}</span>
                    {ed.location && <span className={cn('text-gray-600', compact ? 'text-[8.5px]' : 'text-[9px]')}>{ed.location}</span>}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </div>
  )
}
