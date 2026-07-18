import { v4 as uuidv4 } from 'uuid'
import type {
  AdditionalLink,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeDraftContent,
  ResumeBullet,
  SkillGroup,
} from './types'

function bullet(text = '', priority: ResumeBullet['priority'] = 'medium'): ResumeBullet {
  return { id: uuidv4(), text, priority, selected: true }
}

export function defaultSkillGroups(): SkillGroup[] {
  return [
    { id: uuidv4(), name: 'Languages', items: [] },
    { id: uuidv4(), name: 'Frameworks & Libraries', items: [] },
    { id: uuidv4(), name: 'DevOps & Cloud', items: [] },
    { id: uuidv4(), name: 'Core CS', items: [] },
    { id: uuidv4(), name: 'Other', items: [] },
  ]
}

export function emptyResumeDraftContent(overrides?: Partial<ResumeDraftContent>): ResumeDraftContent {
  return {
    templateType: 'latex-classic',
    fullName: '',
    location: '',
    phone: '',
    email: '',
    linkedin: '',
    github: '',
    leetcode: '',
    portfolio: '',
    summary: '',
    skillsGroups: defaultSkillGroups(),
    experience: [],
    projects: [],
    certifications: [],
    education: [],
    additionalLinks: [],
    layoutOptions: {
      onePageMode: false,
      fontScale: 1,
      spacingDensity: 'normal',
      hiddenSections: [],
      includeSummary: true,
    },
    generatedLatex: '',
    generatedHtml: '',
    ...overrides,
  }
}

export function newExperienceEntry(
  partial?: Partial<Omit<ExperienceEntry, 'id' | 'bullets'>>
): ExperienceEntry {
  return {
    id: uuidv4(),
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    bullets: [bullet('', 'high')],
    ...partial,
  }
}

export function newProjectEntry(partial?: Partial<Omit<ProjectEntry, 'id' | 'bullets'>>): ProjectEntry {
  return {
    id: uuidv4(),
    name: '',
    stack: '',
    link: '',
    bullets: [bullet('', 'high')],
    ...partial,
  }
}

export function newEducationEntry(): EducationEntry {
  return {
    id: uuidv4(),
    degree: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
  }
}

export function newAdditionalLink(): AdditionalLink {
  return { id: uuidv4(), label: '', url: '' }
}
