export type ApplicationLanguage = 'German' | 'English'

export interface StudentProfileInput {
  name: string
  address: string
  phone: string
  email: string
  linkedin: string
  github: string
  portfolio: string
  nationality: string
  dateOfBirth: string
  residencePermit: string
  education: string
  workExperience: string
  projects: string
  certifications: string
  skills: string
  languages: string
  city: string
}

export interface JobApplicationInput {
  jobDescription: string
  companyName: string
  companyCity: string
  /** @deprecated prefer resumeLanguage + coverLetterLanguage */
  language: ApplicationLanguage
  resumeLanguage: ApplicationLanguage
  coverLetterLanguage: ApplicationLanguage
  hiringManagerName: string
  startDate: string
  hoursPerWeek: string
  relocationNote: string
}

export interface MatchAnalysis {
  match_score: number
  top_keywords: string[]
  best_projects: string[]
  skill_category_order: string[]
  missing_skills: string[]
  profile_summary_focus: string
}

export interface ApplicationPackResult {
  analysis: MatchAnalysis
  latexSource: string
  coverLetter: string
}
