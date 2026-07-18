import type { ResumeDraftContent } from './types'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function hrefUrl(raw: string): string {
  const t = raw.trim()
  if (!t) return '#'
  if (t.startsWith('http') || t.startsWith('mailto:')) return t
  return `https://${t}`
}

function isHidden(content: ResumeDraftContent, key: string): boolean {
  return content.layoutOptions.hiddenSections.includes(key)
}

/**
 * Full HTML document matching the classic LaTeX resume layout (letter paper, 11pt, margins via PDF engine).
 * Used for server-side print-to-PDF (selectable text, ATS-friendly).
 */
export function buildLatexStyleResumeHtml(content: ResumeDraftContent): string {
  const scale = content.layoutOptions.fontScale
  const compact = content.layoutOptions.spacingDensity === 'compact' || content.layoutOptions.onePageMode
  const fs = `${(11 * scale).toFixed(2)}pt`
  const fsSmall = `${(10 * scale).toFixed(2)}pt`
  const fsName = `${(22 * scale).toFixed(2)}pt`
  const secSize = `${(12 * scale).toFixed(2)}pt`

  const metaLine = [content.location, content.phone, content.email].filter(Boolean)
  const links = [
    content.linkedin && { label: 'LinkedIn', href: content.linkedin },
    content.github && { label: 'GitHub', href: content.github },
    content.leetcode && { label: 'LeetCode', href: content.leetcode },
    content.portfolio && { label: 'Projects', href: content.portfolio },
    ...content.additionalLinks
      .filter((l) => l.label.trim() && l.url.trim())
      .map((l) => ({ label: l.label, href: l.url })),
  ].filter(Boolean) as { label: string; href: string }[]

  const parts: string[] = []

  parts.push(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Times New Roman', Times, serif;
    font-size: ${fs};
    color: #000;
    line-height: 1.15;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ragged { text-align: left; }
  .center { text-align: center; }
  h1.name {
    font-size: ${fsName};
    font-weight: bold;
    font-variant: small-caps;
    letter-spacing: 0.02em;
    margin: 0 0 0.35em 0;
  }
  .loc { font-size: ${fsSmall}; margin: 0.35em 0; }
  .contact-line { font-size: ${fsSmall}; margin: 0.35em 0; }
  .links a { color: #000; text-decoration: underline; }
  .links { font-size: ${fsSmall}; margin: 0.35em 0; }
  .section {
    margin: ${compact ? '0.45em' : '0.65em'} 0;
  }
  .section-title {
    font-variant: small-caps;
    font-size: ${secSize};
    font-weight: normal;
    letter-spacing: 0.08em;
    border-bottom: 0.75pt solid #000;
    padding-bottom: 3px;
    margin: 0 0 0.4em 0;
    text-align: left;
  }
  .summary { text-align: justify; font-size: ${fs}; margin: 0; }
  .skills p { margin: 0.2em 0; font-size: ${fs}; }
  .skills .lab { font-weight: bold; }
  .subhead { margin: 0.35em 0 0.15em 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .bold { font-weight: bold; }
  .it { font-style: italic; }
  .right { text-align: right; flex-shrink: 0; }
  .sm { font-size: ${fsSmall}; }
  ul.bullets {
    margin: 0.25em 0 0.35em 1.35em;
    padding: 0;
    list-style-type: disc;
  }
  ul.bullets li { margin: 0.12em 0; }
  ul.cert {
    margin: 0.25em 0 0.35em 1.35em;
    padding: 0;
    list-style-type: disc;
  }
  ul.cert li { margin: 0.08em 0; }
  .proj-title { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 0.15em; }
  .proj-stack { font-style: italic; font-size: ${fsSmall}; color: #222; margin: 0.1em 0 0.2em 0; }
</style></head><body>`)

  if (!isHidden(content, 'header')) {
    parts.push('<header class="center">')
    parts.push(`<h1 class="name">${escapeHtml(content.fullName.trim() || 'Your Name')}</h1>`)
    if (content.location.trim()) {
      parts.push(`<p class="loc">${escapeHtml(content.location.trim())}</p>`)
    }
    const phoneEmail = [content.phone, content.email].filter(Boolean)
    if (phoneEmail.length) {
      parts.push(`<p class="contact-line">${phoneEmail.map((x) => escapeHtml(x)).join(' &nbsp;|&nbsp; ')}</p>`)
    }
    if (links.length) {
      parts.push(
        `<p class="links">${links
          .map(
            (l) =>
              `<a href="${escapeHtml(hrefUrl(l.href))}">${escapeHtml(l.label)}</a>`
          )
          .join(' &nbsp;|&nbsp; ')}</p>`
      )
    }
    parts.push('</header>')
  }

  if (
    content.layoutOptions.includeSummary &&
    !isHidden(content, 'summary') &&
    content.summary.trim()
  ) {
    parts.push('<section class="section">')
    parts.push('<h2 class="section-title">Summary</h2>')
    parts.push(`<p class="summary">${escapeHtml(content.summary.trim())}</p>`)
    parts.push('</section>')
  }

  if (!isHidden(content, 'skills') && content.skillsGroups.some((g) => g.items.length)) {
    parts.push('<section class="section skills">')
    parts.push('<h2 class="section-title">Skills</h2>')
    parts.push('<div style="margin-left:0.15in">')
    for (const g of content.skillsGroups.filter((g) => g.items.length)) {
      parts.push(
        `<p style="margin:0.2em 0"><span class="lab">${escapeHtml(g.name)}:</span> ${escapeHtml(g.items.join(', '))}</p>`
      )
    }
    parts.push('</div></section>')
  }

  if (!isHidden(content, 'experience') && content.experience.length) {
    parts.push('<section class="section">')
    parts.push('<h2 class="section-title">Experience</h2>')
    for (const job of content.experience) {
      const dates = [job.startDate, job.endDate].filter(Boolean).join(' -- ')
      parts.push('<div class="subhead">')
      parts.push('<div class="row">')
      parts.push(`<span class="bold">${escapeHtml(job.company)}</span>`)
      parts.push(`<span class="right sm">${escapeHtml(dates)}</span>`)
      parts.push('</div>')
      parts.push('<div class="row">')
      parts.push(`<span class="it">${escapeHtml(job.role)}</span>`)
      if (job.location.trim()) {
        parts.push(`<span class="it right sm">${escapeHtml(job.location)}</span>`)
      } else {
        parts.push('<span></span>')
      }
      parts.push('</div>')
      parts.push('<ul class="bullets">')
      for (const b of job.bullets.filter((x) => (x.selected !== false) && x.text.trim())) {
        parts.push(`<li>${escapeHtml(b.text.trim())}</li>`)
      }
      parts.push('</ul></div>')
    }
    parts.push('</section>')
  }

  if (!isHidden(content, 'projects') && content.projects.length) {
    parts.push('<section class="section">')
    parts.push('<h2 class="section-title">Projects</h2>')
    for (const proj of content.projects) {
      parts.push('<div class="subhead">')
      parts.push('<div class="proj-title">')
      const titleBits = proj.stack.trim()
        ? `<span class="bold">${escapeHtml(proj.name)}</span> <span class="it">| ${escapeHtml(proj.stack)}</span>`
        : `<span class="bold">${escapeHtml(proj.name)}</span>`
      parts.push(`<span>${titleBits}</span>`)
      if (proj.link.trim()) {
        parts.push(
          `<a class="sm" href="${escapeHtml(hrefUrl(proj.link))}">Link</a>`
        )
      } else {
        parts.push('<span></span>')
      }
      parts.push('</div>')
      parts.push('<ul class="bullets">')
      for (const b of proj.bullets.filter((x) => (x.selected !== false) && x.text.trim())) {
        parts.push(`<li>${escapeHtml(b.text.trim())}</li>`)
      }
      parts.push('</ul></div>')
    }
    parts.push('</section>')
  }

  if (!isHidden(content, 'certifications') && content.certifications.some((c) => c.trim())) {
    parts.push('<section class="section">')
    parts.push('<h2 class="section-title">Achievements / Certifications</h2>')
    parts.push('<ul class="cert">')
    for (const c of content.certifications.filter((x) => x.trim())) {
      parts.push(`<li>${escapeHtml(c.trim())}</li>`)
    }
    parts.push('</ul></section>')
  }

  if (!isHidden(content, 'education') && content.education.length) {
    parts.push('<section class="section">')
    parts.push('<h2 class="section-title">Education</h2>')
    for (const ed of content.education) {
      const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' -- ')
      parts.push('<div class="subhead">')
      parts.push('<div class="row">')
      parts.push(`<span class="bold">${escapeHtml(ed.degree)}</span>`)
      parts.push(`<span class="right sm">${escapeHtml(dates)}</span>`)
      parts.push('</div>')
      parts.push('<div class="row">')
      parts.push(`<span class="it">${escapeHtml(ed.institution)}</span>`)
      if (ed.location.trim()) {
        parts.push(`<span class="it right sm">${escapeHtml(ed.location)}</span>`)
      } else {
        parts.push('<span></span>')
      }
      parts.push('</div></div>')
    }
    parts.push('</section>')
  }

  parts.push('</body></html>')
  return parts.join('')
}
