import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import type { ResumeDraftContent } from './types'
import { getPreviewContent } from './previewModel'

function linkParagraph(label: string, url: string) {
  const href = url.startsWith('http') ? url : `https://${url}`
  return new Paragraph({
    children: [
      new ExternalHyperlink({
        children: [
          new TextRun({
            text: label,
            style: 'Hyperlink',
            color: '1D4ED8',
            underline: {},
          }),
        ],
        link: href,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
  })
}

export async function buildResumeDocxBuffer(
  content: ResumeDraftContent,
  mode: 'full' | 'onePage'
): Promise<Buffer> {
  const c = getPreviewContent(content, mode === 'onePage' ? 'onePage' : 'full')
  const hidden = (k: string) => c.layoutOptions.hiddenSections.includes(k)

  const children: Paragraph[] = []

  if (!hidden('header')) {
    children.push(
      new Paragraph({
        text: c.fullName.trim() || 'Your Name',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    )
    const meta = [c.location, c.phone, c.email].filter(Boolean).join(' | ')
    if (meta) {
      children.push(
        new Paragraph({
          text: meta,
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        })
      )
    }
    const links: { label: string; url: string }[] = []
    if (c.linkedin) links.push({ label: 'LinkedIn', url: c.linkedin })
    if (c.github) links.push({ label: 'GitHub', url: c.github })
    if (c.leetcode) links.push({ label: 'LeetCode', url: c.leetcode })
    if (c.portfolio) links.push({ label: 'Projects', url: c.portfolio })
    for (const l of c.additionalLinks) {
      if (l.label.trim() && l.url.trim()) {
        links.push({ label: l.label.trim(), url: l.url.trim() })
      }
    }
    for (const l of links) {
      children.push(linkParagraph(l.label, l.url))
    }
  }

  const section = (title: string) =>
    new Paragraph({
      text: title.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      border: {
        bottom: { color: '000000', space: 1, style: 'single', size: 6 },
      },
      spacing: { before: 200, after: 120 },
      alignment: AlignmentType.CENTER,
    })

  if (c.layoutOptions.includeSummary && !hidden('summary') && c.summary.trim()) {
    children.push(section('Summary'))
    children.push(
      new Paragraph({
        text: c.summary.trim(),
        spacing: { after: 160 },
      })
    )
  }

  if (!hidden('skills') && c.skillsGroups.some((g) => g.items.length)) {
    children.push(section('Skills'))
    for (const g of c.skillsGroups.filter((x) => x.items.length)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${g.name}: `, bold: true }),
            new TextRun({ text: g.items.join(', ') }),
          ],
          spacing: { after: 80 },
        })
      )
    }
  }

  if (!hidden('experience') && c.experience.length) {
    children.push(section('Experience'))
    for (const job of c.experience) {
      const dates = `${job.startDate}${job.startDate && job.endDate ? ' – ' : ''}${job.endDate}`
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.company, bold: true }),
            new TextRun({ text: dates ? `  ${dates}` : '' }),
          ],
          spacing: { after: 40 },
        })
      )
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.role, italics: true }),
            new TextRun({ text: job.location ? `  ·  ${job.location}` : '' }),
          ],
          spacing: { after: 60 },
        })
      )
      for (const b of job.bullets.filter((x) => x.selected && x.text.trim())) {
        children.push(
          new Paragraph({
            text: b.text.trim(),
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        )
      }
    }
  }

  if (!hidden('projects') && c.projects.length) {
    children.push(section('Projects'))
    for (const p of c.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: p.name, bold: true }),
            ...(p.link
              ? [
                  new TextRun({ text: '  ' }),
                  new ExternalHyperlink({
                    children: [
                      new TextRun({
                        text: 'Link',
                        style: 'Hyperlink',
                        color: '1D4ED8',
                        underline: {},
                      }),
                    ],
                    link: p.link.startsWith('http') ? p.link : `https://${p.link}`,
                  }),
                ]
              : []),
          ],
          spacing: { after: 40 },
        })
      )
      if (p.stack) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: p.stack, italics: true })],
            spacing: { after: 40 },
          })
        )
      }
      for (const b of p.bullets.filter((x) => x.selected && x.text.trim())) {
        children.push(
          new Paragraph({
            text: b.text.trim(),
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        )
      }
    }
  }

  if (!hidden('certifications') && c.certifications.some((x) => x.trim())) {
    children.push(section('Achievements / Certifications'))
    for (const line of c.certifications.filter((x) => x.trim())) {
      children.push(
        new Paragraph({
          text: line.trim(),
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      )
    }
  }

  if (!hidden('education') && c.education.length) {
    children.push(section('Education'))
    for (const ed of c.education) {
      const edDates = `${ed.startDate}${ed.startDate && ed.endDate ? ' – ' : ''}${ed.endDate}`
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ed.institution, bold: true }),
            new TextRun({ text: edDates ? `  ${edDates}` : '' }),
          ],
          spacing: { after: 40 },
        })
      )
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ed.degree, italics: true }),
            new TextRun({ text: ed.location ? `  ·  ${ed.location}` : '' }),
          ],
          spacing: { after: 120 },
        })
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  return Buffer.from(await Packer.toBuffer(doc))
}
