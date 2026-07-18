export type BulletPriority = 'high' | 'medium' | 'low'

export interface ResumeBullet {
  id: string
  text: string
  priority: BulletPriority
  selected: boolean
}

export interface ExperienceEntry {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  bullets: ResumeBullet[]
}

export interface ProjectEntry {
  id: string
  name: string
  stack: string
  link: string
  bullets: ResumeBullet[]
}

export interface EducationEntry {
  id: string
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string
}

export interface SkillGroup {
  id: string
  name: string
  items: string[]
}

export interface AdditionalLink {
  id: string
  label: string
  url: string
}

export type SpacingDensity = 'compact' | 'normal'

export interface ResumeLayoutOptions {
  onePageMode: boolean
  fontScale: number
  spacingDensity: SpacingDensity
  hiddenSections: string[]
  includeSummary: boolean
}

/** Sections used for nav + visibility toggles */
export const SECTION_KEYS = [
  'header',
  'summary',
  'skills',
  'experience',
  'projects',
  'certifications',
  'education',
  'additionalLinks',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

export interface ResumeDraftContent {
  templateType: 'latex-classic' | string
  fullName: string
  location: string
  phone: string
  email: string
  linkedin: string
  github: string
  leetcode: string
  portfolio: string
  summary: string
  skillsGroups: SkillGroup[]
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  certifications: string[]
  education: EducationEntry[]
  additionalLinks: AdditionalLink[]
  layoutOptions: ResumeLayoutOptions
  generatedLatex: string
  generatedHtml: string
}

export interface ResumeDraftDocument extends ResumeDraftContent {
  _id: string
  userEmail: string
  title: string
  createdAt: Date
  updatedAt: Date
}
