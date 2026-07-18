import type { ResumeDraftContent } from '@/lib/resumeDraft/types'
import type { StudentProfileInput } from './types'

function formatDates(start: string, end: string) {
  if (start && end) return `${start} -- ${end}`
  return start || end || ''
}

/** Map a resume draft (+ optional account fields) into the application-pack profile text blocks. */
export function studentProfileFromDraft(
  draft: ResumeDraftContent,
  extras?: Partial<StudentProfileInput> & { accountName?: string; accountEmail?: string }
): StudentProfileInput {
  const education = draft.education
    .map((e) => {
      const bits = [
        e.degree,
        e.institution,
        formatDates(e.startDate, e.endDate),
        e.location,
      ].filter(Boolean)
      return bits.join(', ')
    })
    .filter(Boolean)
    .join('\n')

  const workExperience = draft.experience
    .map((job) => {
      const header = [
        job.role,
        job.company,
        job.location,
        formatDates(job.startDate, job.endDate),
      ]
        .filter(Boolean)
        .join(' | ')
      const bullets = job.bullets
        .filter((b) => b.selected !== false && b.text.trim())
        .map((b) => `- ${b.text.trim()}`)
        .join('\n')
      return `${header}\n${bullets}`.trim()
    })
    .filter(Boolean)
    .join('\n\n')

  const projects = draft.projects
    .map((p) => {
      const header = [p.name, p.stack, p.link].filter(Boolean).join(' | ')
      const bullets = p.bullets
        .filter((b) => b.selected !== false && b.text.trim())
        .map((b) => `- ${b.text.trim()}`)
        .join('\n')
      return `${header}\n${bullets}`.trim()
    })
    .filter(Boolean)
    .join('\n\n')

  const certifications = draft.certifications.filter((c) => c.trim()).join('\n')

  const skills = draft.skillsGroups
    .filter((g) => g.items.length)
    .map((g) => `${g.name}: ${g.items.join(', ')}`)
    .join('\n')

  const cityGuess =
    extras?.city ||
    (draft.location.includes(',') ? draft.location.split(',')[0].trim() : draft.location) ||
    ''

  return {
    name: extras?.name || draft.fullName || extras?.accountName || '',
    address: extras?.address || draft.location || '',
    phone: extras?.phone || draft.phone || '',
    email: extras?.email || draft.email || extras?.accountEmail || '',
    linkedin: extras?.linkedin || draft.linkedin || '',
    github: extras?.github || draft.github || '',
    portfolio: extras?.portfolio || draft.portfolio || '',
    nationality: extras?.nationality || '',
    dateOfBirth: extras?.dateOfBirth || '',
    residencePermit: extras?.residencePermit || '',
    education: extras?.education || education,
    workExperience: extras?.workExperience || workExperience,
    projects: extras?.projects || projects,
    certifications: extras?.certifications || certifications,
    skills: extras?.skills || skills,
    languages: extras?.languages || '',
    city: cityGuess,
  }
}

export function emptyStudentProfile(): StudentProfileInput {
  return {
    name: '',
    address: '',
    phone: '',
    email: '',
    linkedin: '',
    github: '',
    portfolio: '',
    nationality: '',
    dateOfBirth: '',
    residencePermit: '',
    education: '',
    workExperience: '',
    projects: '',
    certifications: '',
    skills: '',
    languages: '',
    city: '',
  }
}
