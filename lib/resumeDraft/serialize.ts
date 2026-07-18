import type { ResumeDraftContent } from './types'
import { emptyResumeDraftContent } from './defaults'

/** Normalize Mongo document or partial JSON into ResumeDraftContent */
export function toResumeDraftContent(raw: Record<string, unknown>): ResumeDraftContent {
  const base = emptyResumeDraftContent()
  const lo = (raw.layoutOptions as Record<string, unknown>) || {}
  return {
    ...base,
    ...raw,
    templateType: (raw.templateType as ResumeDraftContent['templateType']) || 'latex-classic',
    skillsGroups: Array.isArray(raw.skillsGroups) ? (raw.skillsGroups as ResumeDraftContent['skillsGroups']) : base.skillsGroups,
    experience: Array.isArray(raw.experience) ? (raw.experience as ResumeDraftContent['experience']) : [],
    projects: Array.isArray(raw.projects) ? (raw.projects as ResumeDraftContent['projects']) : [],
    education: Array.isArray(raw.education) ? (raw.education as ResumeDraftContent['education']) : [],
    certifications: Array.isArray(raw.certifications) ? (raw.certifications as string[]) : [],
    additionalLinks: Array.isArray(raw.additionalLinks) ? (raw.additionalLinks as ResumeDraftContent['additionalLinks']) : [],
    layoutOptions: {
      ...base.layoutOptions,
      onePageMode: Boolean(lo.onePageMode),
      fontScale: typeof lo.fontScale === 'number' ? lo.fontScale : base.layoutOptions.fontScale,
      spacingDensity: lo.spacingDensity === 'compact' || lo.spacingDensity === 'normal' ? lo.spacingDensity : base.layoutOptions.spacingDensity,
      hiddenSections: Array.isArray(lo.hiddenSections) ? (lo.hiddenSections as string[]) : [],
      includeSummary: lo.includeSummary !== undefined ? Boolean(lo.includeSummary) : base.layoutOptions.includeSummary,
    },
    generatedLatex: String(raw.generatedLatex ?? ''),
    generatedHtml: String(raw.generatedHtml ?? ''),
  }
}
