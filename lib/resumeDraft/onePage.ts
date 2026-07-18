import type { ResumeDraftContent, ResumeBullet } from './types'

function sortBulletsForOnePage(bullets: ResumeBullet[]): ResumeBullet[] {
  const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return [...bullets]
    .filter((b) => b.selected && b.text.trim())
    .sort((a, b) => order[a.priority] - order[b.priority])
}

const MAX_ONE_PAGE_BULLETS_PER_JOB = 4
const MAX_ONE_PAGE_BULLETS_PER_PROJECT = 2

/** Heuristic one-page compression without AI (keeps strongest bullets). */
export function applyHeuristicOnePage(content: ResumeDraftContent): ResumeDraftContent {
  const lo = { ...content.layoutOptions, onePageMode: true, spacingDensity: 'compact' as const, fontScale: 0.92 }
  const experience = content.experience.map((exp) => ({
    ...exp,
    bullets: sortBulletsForOnePage(exp.bullets).slice(0, MAX_ONE_PAGE_BULLETS_PER_JOB),
  }))
  const projects = content.projects.map((p) => ({
    ...p,
    bullets: sortBulletsForOnePage(p.bullets).slice(0, MAX_ONE_PAGE_BULLETS_PER_PROJECT),
  }))
  const skillsGroups = content.skillsGroups.map((g) => ({
    ...g,
    items: Array.from(new Set(g.items.map((s) => s.trim()).filter(Boolean))).slice(0, 12),
  }))
  let summary = content.summary
  if (summary.length > 280) {
    summary = summary.slice(0, 277).trim() + '…'
  }
  return {
    ...content,
    layoutOptions: lo,
    experience,
    projects,
    skillsGroups,
    summary,
  }
}

export function estimatePageOverflow(
  content: ResumeDraftContent,
  onePageMode: boolean
): { likelyOverflow: boolean; hint: string } {
  if (!onePageMode) return { likelyOverflow: false, hint: '' }
  let score = 0
  score += content.experience.length * 3
  for (const e of content.experience) {
    score += e.bullets.filter((b) => b.selected && b.text.trim()).length
  }
  score += content.projects.length * 2
  for (const p of content.projects) {
    score += p.bullets.filter((b) => b.selected && b.text.trim()).length
  }
  score += content.skillsGroups.reduce((a, g) => a + g.items.length, 0) * 0.15
  if (content.layoutOptions.includeSummary && content.summary.trim()) score += 2
  score += content.certifications.filter(Boolean).length * 0.5
  score += content.education.length

  // Compact 1-page layout fits more per line; use a higher threshold to reduce false warnings.
  const compactOnePage =
    content.layoutOptions.spacingDensity === 'compact' && content.layoutOptions.onePageMode
  const threshold = compactOnePage ? 52 : 40

  const likelyOverflow = score > threshold
  return {
    likelyOverflow,
    hint: likelyOverflow
      ? 'Content may still exceed one page. Try “Optimize to 1 page”, remove low-priority bullets, or shorten the summary.'
      : '',
  }
}
