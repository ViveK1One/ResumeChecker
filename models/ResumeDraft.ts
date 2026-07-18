import mongoose, { Schema, Document } from 'mongoose'
import type { ResumeDraftContent } from '@/lib/resumeDraft/types'

export interface IResumeDraft extends Document, ResumeDraftContent {
  userEmail: string
  title: string
}

const BulletSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    selected: { type: Boolean, default: true },
  },
  { _id: false }
)

const ExperienceSchema = new Schema(
  {
    id: { type: String, required: true },
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
)

const ProjectSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    stack: { type: String, default: '' },
    link: { type: String, default: '' },
    bullets: { type: [BulletSchema], default: [] },
  },
  { _id: false }
)

const EducationSchema = new Schema(
  {
    id: { type: String, required: true },
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
  },
  { _id: false }
)

const SkillGroupSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, default: '' },
    items: { type: [String], default: [] },
  },
  { _id: false }
)

const AdditionalLinkSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
)

const ResumeDraftSchema = new Schema(
  {
    userEmail: { type: String, required: true, index: true },
    title: { type: String, default: 'My Resume' },
    templateType: { type: String, default: 'latex-classic' },
    fullName: { type: String, default: '' },
    location: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    leetcode: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    summary: { type: String, default: '' },
    skillsGroups: { type: [SkillGroupSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    certifications: { type: [String], default: [] },
    education: { type: [EducationSchema], default: [] },
    additionalLinks: { type: [AdditionalLinkSchema], default: [] },
    layoutOptions: {
      onePageMode: { type: Boolean, default: false },
      fontScale: { type: Number, default: 1 },
      spacingDensity: { type: String, enum: ['compact', 'normal'], default: 'normal' },
      hiddenSections: { type: [String], default: [] },
      includeSummary: { type: Boolean, default: true },
    },
    generatedLatex: { type: String, default: '' },
    generatedHtml: { type: String, default: '' },
  },
  { timestamps: true }
)

ResumeDraftSchema.index({ userEmail: 1, updatedAt: -1 })

export default mongoose.models.ResumeDraft || mongoose.model<IResumeDraft>('ResumeDraft', ResumeDraftSchema)
