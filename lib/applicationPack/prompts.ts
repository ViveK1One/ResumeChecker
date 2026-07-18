import type { JobApplicationInput, MatchAnalysis, StudentProfileInput } from './types'

function block(label: string, value: string) {
  return `${label}:\n${(value || '').trim() || '(not provided)'}`
}

export function buildMatchAnalysisPrompt(profile: StudentProfileInput, job: JobApplicationInput): string {
  return `You are an expert German job application specialist.
Given this job description and student profile, return ONLY valid JSON (no markdown):
{
  "match_score": 0-100,
  "top_keywords": ["k1","k2",...],
  "best_projects": ["project1","project2",...],
  "skill_category_order": ["cat1","cat2",...],
  "missing_skills": ["s1","s2",...],
  "profile_summary_focus": "one sentence about what to emphasize"
}

Rules:
- top_keywords: up to 15 keywords from the JD
- best_projects: choose from the student's real project names only (do not invent)
- skill_category_order: order categories by JD relevance using names from the student skills block
- missing_skills: JD skills not clearly present in the profile
- Never invent employers, degrees, or projects

${block('STUDENT NAME', profile.name)}
${block('EDUCATION', profile.education)}
${block('WORK EXPERIENCE', profile.workExperience)}
${block('PROJECTS', profile.projects)}
${block('CERTIFICATIONS', profile.certifications)}
${block('SKILLS', profile.skills)}
${block('LANGUAGES', profile.languages)}

COMPANY NAME: ${job.companyName || '(unknown)'}
JOB DESCRIPTION:
${job.jobDescription.slice(0, 12000)}
`
}

export function buildLatexResumePrompt(
  profile: StudentProfileInput,
  job: JobApplicationInput,
  analysis: MatchAnalysis
): string {
  const babel = job.resumeLanguage === 'German' ? 'ngerman' : 'english'
  const isGerman = job.resumeLanguage === 'German'
  const sec = {
    profile: isGerman ? 'Profil' : 'Profile',
    skills: isGerman ? 'Fähigkeiten' : 'Skills',
    experience: isGerman ? 'Berufserfahrung' : 'Work Experience',
    projects: isGerman ? 'Projekte' : 'Projects',
    certifications: isGerman ? 'Zertifikate' : 'Certifications',
    education: isGerman ? 'Ausbildung' : 'Education',
    viewGithub: isGerman ? 'Auf GitHub ansehen' : 'View on GitHub',
    relevant: isGerman ? 'Relevante Module' : 'Relevant',
    ongoing: isGerman ? 'laufend' : 'ongoing',
    expected: isGerman ? 'geplant' : 'expected',
    nationality: isGerman ? 'Staatsangehörigkeit' : 'Nationality',
  }

  return `You are an expert LaTeX resume formatter and German/EU job application specialist.
Generate a tailored ATS-friendly resume. CONTENT must come ONLY from the STUDENT PROFILE below.
The FORMAT must match the REFERENCE TEMPLATE STRUCTURE exactly (layout/commands only — do NOT copy any example person names, companies, projects, or dates from examples).

STUDENT PROFILE (ONLY allowed facts — never invent):
Name: ${profile.name}
Address: ${profile.address}
Phone: ${profile.phone}
Email: ${profile.email}
LinkedIn: ${profile.linkedin}
GitHub: ${profile.github}
Portfolio: ${profile.portfolio}
Nationality: ${profile.nationality}
Date of Birth: ${profile.dateOfBirth}
Residence Permit: ${profile.residencePermit}

EDUCATION:
${profile.education}

WORK EXPERIENCE:
${profile.workExperience}

PROJECTS:
${profile.projects}

CERTIFICATIONS:
${profile.certifications}

SKILLS:
${profile.skills}

LANGUAGES:
${profile.languages}

JOB DESCRIPTION (for keyword emphasis only):
${job.jobDescription.slice(0, 12000)}

COMPANY NAME: ${job.companyName}
OUTPUT LANGUAGE: ${job.resumeLanguage} — write ALL prose and section titles in this language.
PHOTO: always include \\includegraphics[width=3.2cm]{photo.png} (file supplied by user).

MATCH ANALYSIS (use for ordering/emphasis only; do not invent projects):
${JSON.stringify(analysis)}

═══════════════════════════════════════
REFERENCE TEMPLATE STRUCTURE (COPY THIS LAYOUT EXACTLY)
═══════════════════════════════════════

Preamble MUST be exactly:

\\documentclass[a4paper,10pt]{article}
\\usepackage[left=1.5cm,right=1.5cm,top=1.5cm,bottom=1.5cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage[${babel}]{babel}
\\usepackage{microtype}
\\usepackage{array}
\\usepackage{tabularx}
\\hypersetup{colorlinks=true,urlcolor=blue,linkcolor=blue}
\\emergencystretch=3em
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{5pt}{3pt}
\\setlength{\\parskip}{2pt}
\\setlength{\\parindent}{0pt}

Use \\section*{Title} for every section (starred), with titles:
${sec.profile}, ${sec.skills}, ${sec.experience}, ${sec.projects}, ${sec.certifications}, ${sec.education}

HEADER (exact structure — fill with THIS student's data only):
\\vspace*{-1.5cm}
\\begin{center}
\\begin{tabular}{@{}p{0.72\\textwidth}p{0.25\\textwidth}@{}}
\\begin{minipage}[t]{\\linewidth}
\\vspace*{-2.8cm}\\centering
{\\LARGE \\textbf{[NAME]}}\\\\[3pt]
{\\small [ADDRESS]}\\\\[2pt]
{\\small [PHONE] \\quad \\href{mailto:[EMAIL]}{[EMAIL]}}\\\\[2pt]
{\\small \\href{[LINKEDIN]}{LinkedIn} \\quad \\href{[GITHUB]}{GitHub} \\quad \\href{[PORTFOLIO]}{Portfolio} \\quad ${sec.nationality}: [NATIONALITY]}
\\end{minipage}
&\\begin{minipage}[t]{\\linewidth}\\raggedleft
\\includegraphics[width=3.2cm]{photo.png}
\\end{minipage}
\\end{tabular}
\\end{center}
\\vspace{0.15cm}

Omit LinkedIn/GitHub/Portfolio hrefs if that URL is empty. Escape LaTeX special chars (ä→\\"{a}, ü→\\"{u}, ö→\\"{o}, ß→\\ss{}, &→\\&, %→\\%, _→\\_, #→\\#).

PROFILE section:
\\section*{${sec.profile}}
Then 3–4 sentences. Bold 1–2 key phrases with \\textbf{}. If German: B1, short sentences. No filler adjectives alone.

SKILLS section (exact table shape):
\\section*{${sec.skills}}
\\renewcommand{\\arraystretch}{1.3}
\\begin{tabular}{@{}p{4.5cm}p{13.0cm}@{}}
\\textbf{Category} & Skill1 \\textbullet\\ Skill2 \\textbullet\\ Skill3 \\\\
...
\\textbf{Languages} & ... \\\\
\\end{tabular}
- Max 10 rows; order by match analysis; last row MUST be Languages (from profile).
- Do not invent skills.
- CRITICAL: any ampersand in category/skill TEXT must be \\&  e.g. \\textbf{Cloud \\& DevOps} — never \\textbf{Cloud & DevOps} (breaks the table).

WORK EXPERIENCE (exact shape per job):
\\section*{${sec.experience}}
\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
\\textbf{Role} & \\textbf{MM.YYYY -- MM.YYYY} \\\\
Company Name & City, Country \\\\
\\end{tabular*}
\\begin{itemize}[noitemsep,topsep=4pt,leftmargin=*]
\\item \\textbf{Bold action phrase}: rest of bullet.
\\end{itemize}
- Reverse chronological. Max 5 bullets. Numbers only if in profile.

PROJECTS — CRITICAL ORDER (must match this, not bullets-then-link):
\\section*{${sec.projects}}
For EACH project, EXACTLY in this order:
1) Title + dates tabular*
2) italic tech stack line
3) GitHub link line (if URL exists)
4) THEN itemize bullets
5) Optional \\vspace{0.1cm} between projects

\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
\\textbf{Project Name -- JD-focused subtitle} & \\textbf{MM.YYYY -- MM.YYYY} \\\\
\\end{tabular*}
\\noindent\\textit{Tech \\textbullet\\ Stack \\textbullet\\ Here}\\\\
\\noindent\\href{https://github.com/...}{\\textbf{${sec.viewGithub}}}
\\begin{itemize}[noitemsep,topsep=4pt,leftmargin=*]
\\item \\textbf{Bold lead}: details from profile only.
\\end{itemize}

WRONG (do not do this): putting View on GitHub after the itemize.
RIGHT: View on GitHub immediately after the italic stack, before itemize.
- 3–4 most relevant real projects; reverse chronological; never invent projects/URLs/dates.

CERTIFICATIONS (tabular*, NOT itemize):
\\section*{${sec.certifications}}
\\renewcommand{\\arraystretch}{1.25}
\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
\\textbf{Cert Name} \\textbullet\\ Issuer & MM.YYYY \\\\
...
\\end{tabular*}
- Include ALL certifications from profile. Most recent first. Shorten issuer if needed to avoid overflow.

EDUCATION:
\\section*{${sec.education}}
\\begin{tabular*}{\\textwidth}{@{}l@{\\extracolsep{\\fill}}r@{}}
\\textbf{Degree} (${sec.ongoing}) & \\textbf{MM.YYYY -- MM.YYYY (${sec.expected})} \\\\
University & Country \\\\
\\end{tabular*}
\\textit{${sec.relevant}: A \\textbullet\\ B \\textbullet\\ C \\textbullet\\ D}
- (${sec.ongoing}) / (${sec.expected}) only when applicable from profile.
- Relevant modules line only if inferable; else omit.

═══════════════════════════════════════
NEVER
═══════════════════════════════════════
- Invent skills, jobs, projects, certs, dates, metrics, or URLs
- Use \\section{} without star (always \\section*{})
- Put GitHub link after bullets
- Use itemize for certifications
- Add subtitle under the name
- Copy ANY personal details from format examples (names, companies, projects) — examples are FORMAT ONLY
- Markdown fences or commentary outside LaTeX
- Leave bare & % # _ in text — ALWAYS escape as \\& \\% \\# \\_ (CRITICAL: skill names like "Cloud \\& DevOps", never "Cloud & DevOps" inside tabular)
- Prefer "and" or "/" instead of & in category names when unsure

OUTPUT:
You may return a full document OR only the body starting at \\vspace*{-1.5cm}.
A safe preamble will be applied server-side — still follow the template structure for the BODY.
Never invent packages. Prefer ending with \\end{document} if you include a preamble.
`
}

export function buildCoverLetterPrompt(profile: StudentProfileInput, job: JobApplicationInput): string {
  const lang = job.coverLetterLanguage || job.language || 'German'
  const isGerman = lang === 'German'
  const babel = isGerman ? 'ngerman' : 'english'
  const labels = {
    mobile: isGerman ? 'Mobil' : 'Mobile',
    email: isGerman ? 'E-Mail' : 'Email',
    subjectPrefix: isGerman ? 'Bewerbung:' : 'Application:',
    salutationDefault: isGerman ? 'Sehr geehrte Damen und Herren,' : 'Dear Hiring Team,',
    signOff: isGerman ? 'Mit freundlichen Grüßen,' : 'Kind regards,',
    closingLine: isGerman
      ? 'Über eine Einladung zum Gespräch freue ich mich sehr.'
      : 'I look forward to the opportunity to discuss this role.',
    countryHint: isGerman ? 'Deutschland' : '',
  }

  return `You are an expert German/EU job application specialist and LaTeX formatter.
Generate a tailored cover letter as COMPILABLE LaTeX. CONTENT only from STUDENT PROFILE + JOB DESCRIPTION.
FORMAT must match the REFERENCE TEMPLATE STRUCTURE exactly (layout/commands only — do NOT copy example person names, companies, cities, or story content from any examples).

STUDENT PROFILE (ONLY allowed facts):
Name: ${profile.name}
Address: ${profile.address}
City: ${profile.city || profile.address}
Phone: ${profile.phone}
Email: ${profile.email}
LinkedIn: ${profile.linkedin}
GitHub: ${profile.github}
Nationality: ${profile.nationality}
EDUCATION: ${profile.education}
WORK EXPERIENCE: ${profile.workExperience}
PROJECTS: ${profile.projects}
CERTIFICATIONS: ${profile.certifications}
SKILLS: ${profile.skills}
LANGUAGES: ${profile.languages}

JOB DESCRIPTION:
${job.jobDescription.slice(0, 12000)}

COMPANY NAME: ${job.companyName || '(infer short name from JD if clear, else omit team line)'}
COMPANY CITY: ${job.companyCity || '(infer from JD if clear, else use student city)'}
OUTPUT LANGUAGE: ${lang} — entire letter body in this language only.
HIRING MANAGER: ${job.hiringManagerName || '(none)'}
AVAILABLE FROM: ${job.startDate || '(not provided)'}
HOURS/WEEK: ${job.hoursPerWeek || '(not provided)'}
RELOCATION: ${job.relocationNote || '(not provided)'}

═══════════════════════════════════════
REFERENCE TEMPLATE STRUCTURE (FORMAT ONLY)
═══════════════════════════════════════

Preamble (use exactly — babel = ${babel}):
\\documentclass[a4paper,11pt]{article}
\\usepackage[left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${babel}]{babel}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage{microtype}
\\hypersetup{colorlinks=true,urlcolor=blue}
\\setlength{\\parskip}{7pt}
\\setlength{\\parindent}{0pt}
\\begin{document}

HEADER (student contact — use THIS student's data):
[NAME]\\\\
[ADDRESS]\\\\
${labels.mobile}: [PHONE]\\\\
${labels.email}: \\href{mailto:[EMAIL]}{[EMAIL]}\\\\
\\href{[LINKEDIN]}{LinkedIn} \\quad
\\href{[GITHUB]}{GitHub}

(Omit LinkedIn/GitHub lines if URL empty. Escape specials in address.)

\\vspace{0.4cm}

COMPANY BLOCK:
[COMPANY NAME]\\\\
[Optional team/department from JD — one short line, or omit]\\\\
[CITY], [COUNTRY if known]

\\vspace{0.3cm}

[STUDENT CITY], \\today

\\vspace{0.3cm}

\\textbf{${labels.subjectPrefix} [Exact job title from JD, keep (m/w/d) if present]}

\\vspace{0.1cm}

[SALUTATION]

Then EXACTLY 4 prose paragraphs (blank line between). No itemize. No markdown.

\\vspace{0.6cm} before the typed name is optional; after sign-off use:

[SIGN OFF]

\\vspace{0.6cm}

[STUDENT NAME]

\\end{document}

═══════════════════════════════════════
CONTENT RULES
═══════════════════════════════════════

SALUTATION:
- German + no manager: ${labels.salutationDefault}
- German + Herr/Frau name when provided
- English + no manager: Dear Hiring Team, or Dear [Company] Team,
- English + name: Dear Mr./Ms. [Name],

PARAGRAPH 1 — HOOK (2–3 sentences):
- Mirror 2–3 JD keywords; state you already do this work — not that you want to learn it
- Never start with "Ich bewerbe mich" / "I am applying"

PARAGRAPH 2 — PROOF (3–4 sentences):
- 1–2 real experiences/projects from profile only; stack terms that match JD
- One real number/metric only if in profile

PARAGRAPH 3 — COMPANY FIT (2–3 sentences):
- Specific to this company/role from JD only; optional location fit

PARAGRAPH 4 — CLOSING (1–2 sentences):
- Availability / hours when provided
- End near: "${labels.closingLine}"

Sign-off: ${labels.signOff}

LANGUAGE:
- German: B1, short sentences, everyday words
- English: direct, no "passionate/motivated" filler
- Max ~280 words in the 4 paragraphs combined

LATEX ESCAPING (CRITICAL):
- & → \\&   % → \\%   # → \\#   _ → \\_ in text
- German umlauts: ä→\\"{a} ö→\\"{o} ü→\\"{u} ß→\\ss{} Ä→\\"{A} Ö→\\"{O} Ü→\\"{U}
- Em dash in prose: ---

NEVER:
- Invent employers, projects, metrics, or skills
- Copy example names/companies/cities from format samples
- Bullet points, markdown fences, or commentary outside LaTeX
- Bold inside paragraphs (only the subject line uses \\textbf)

OUTPUT:
Return ONLY LaTeX from \\documentclass through \\end{document} (or body from the name header through \\end{document}).
A safe preamble may be applied server-side — still follow the BODY layout exactly.
`
}

/** Locked cover-letter preamble + body extraction (format matches DE Anschreiben template). */
export function finalizeCoverLetterLatex(
  raw: string,
  babelLang: 'english' | 'ngerman' = 'ngerman'
): string {
  let t = raw.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:latex|tex|text)?\s*/i, '').replace(/\s*```$/i, '')
  }

  let body = extractCoverLetterBody(t)
  body = repairCommonLatexTypos(body)
  body = sanitizeCoverLetterLatex(body)
  body = body
    .replace(/\\documentclass[\s\S]*?\\begin\{document\}/i, '')
    .replace(/\\end\{document\}/gi, '')
    .trim()

  return `${LOCKED_COVER_LETTER_PREAMBLE(babelLang)}
\\begin{document}

${body}

\\end{document}
`.trim() + '\n'
}

function LOCKED_COVER_LETTER_PREAMBLE(babelLang: 'english' | 'ngerman'): string {
  return `\\documentclass[a4paper,11pt]{article}
\\usepackage[left=2.5cm,right=2.5cm,top=2.5cm,bottom=2.5cm]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[${babelLang}]{babel}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage{microtype}
\\hypersetup{colorlinks=true,urlcolor=blue}
\\setlength{\\parskip}{7pt}
\\setlength{\\parindent}{0pt}`
}

function extractCoverLetterBody(tex: string): string {
  const beginDoc = tex.search(/\\begin\{document\}/i)
  const endDoc = tex.search(/\\end\{document\}/i)
  if (beginDoc !== -1) {
    const start = beginDoc + '\\begin{document}'.length
    const end = endDoc !== -1 ? endDoc : tex.length
    return tex.slice(start, end).trim()
  }
  // Plain-text fallback: treat whole string as body (legacy)
  if (!/\\documentclass|\\vspace|\\href\{mailto:/i.test(tex) && !tex.includes('\\\\')) {
    return tex.trim()
  }
  const headerish = tex.search(/^[A-ZÄÖÜa-zäöüß].{1,80}$/m)
  if (headerish !== -1 && !tex.includes('\\documentclass')) {
    return tex.trim()
  }
  return tex.replace(/\\end\{document\}/gi, '').trim()
}

function sanitizeCoverLetterLatex(tex: string): string {
  let t = tex
  for (const cmd of ['textbf', 'textit', 'emph']) {
    t = mapBalancedCommandArgs(t, cmd, escapeLatexTextSpecials)
  }
  t = mapHrefArgs(t)
  // Escape remaining bare specials in prose (cover letters rarely use tabular &)
  t = t
    .replace(/\\&/g, '\0A')
    .replace(/\\%/g, '\0P')
    .replace(/\\#/g, '\0H')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\0A/g, '\\&')
    .replace(/\0P/g, '\\%')
    .replace(/\0H/g, '\\#')
  return t
}

export function stripLatexFences(raw: string): string {
  let t = raw.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:latex|tex)?\s*/i, '').replace(/\s*```$/i, '')
  }
  return finalizeLatexDocument(t, 'english')
}

/** Prefer calling this with the resume language so babel matches. */
export function finalizeLatexDocument(
  raw: string,
  babelLang: 'english' | 'ngerman' = 'english'
): string {
  let t = raw.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:latex|tex)?\s*/i, '').replace(/\s*```$/i, '')
  }

  let body = extractLatexBody(t)
  body = repairCommonLatexTypos(body)
  body = sanitizeGeneratedLatex(body)
  body = fixExtraAmpersandsInTabular(body)
  body = normalizeItemizeOptions(body)
  body = body.trim()

  // Ensure body does not re-declare documentclass / end
  body = body
    .replace(/\\documentclass[\s\S]*?\\begin\{document\}/i, '')
    .replace(/\\end\{document\}/gi, '')
    .trim()

  return `${LOCKED_LATEX_PREAMBLE(babelLang)}
\\begin{document}
${body}
\\end{document}
`.trim() + '\n'
}

/** Fix frequent LLM LaTeX typos that break compilation. */
function repairCommonLatexTypos(tex: string): string {
  return (
    tex
      // \begin{begin}{itemize} → \begin{itemize}
      .replace(/\\begin\{begin\}\{(itemize|enumerate|center|minipage|tabular\*?|tabularx)\}/gi, '\\begin{$1}')
      // \end{end}{itemize} → \end{itemize}
      .replace(/\\end\{end\}\{(itemize|enumerate|center|minipage|tabular\*?|tabularx)\}/gi, '\\end{$1}')
      // Stray bare \begin{document} / \end{document} inside body
      .replace(/\\begin\{document\}/gi, '')
      .replace(/\\end\{document\}/gi, '')
      // Common package command without package (already in locked preamble) — leave as-is
      // Fix \textwidth used as macro name without backslash in tabular* width arg is rare; skip
      .replace(/\\begin\{itemize\}\s*\{([^}]*)\}/g, '\\begin{itemize}[$1]')
  )
}

function LOCKED_LATEX_PREAMBLE(babelLang: 'english' | 'ngerman'): string {
  return `\\documentclass[a4paper,10pt]{article}
\\usepackage[left=1.5cm,right=1.5cm,top=1.5cm,bottom=1.5cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage[${babelLang}]{babel}
\\usepackage{microtype}
\\usepackage{array}
\\usepackage{tabularx}
\\hypersetup{colorlinks=true,urlcolor=blue,linkcolor=blue}
\\emergencystretch=3em
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{5pt}{3pt}
\\setlength{\\parskip}{2pt}
\\setlength{\\parindent}{0pt}`
}

function extractLatexBody(tex: string): string {
  const beginDoc = tex.search(/\\begin\{document\}/i)
  const endDoc = tex.search(/\\end\{document\}/i)
  if (beginDoc !== -1) {
    const start = beginDoc + '\\begin{document}'.length
    const end = endDoc !== -1 ? endDoc : tex.length
    return tex.slice(start, end).trim()
  }
  // AI sometimes omits \begin{document} — start at header/sections
  const header = tex.search(/\\vspace\*\{-1\.5cm\}|\\section\*|\\begin\{center\}/)
  if (header !== -1) return tex.slice(header).replace(/\\end\{document\}/gi, '').trim()
  const afterPreamble = tex.search(/\\setlength\{\\parindent\}\{0pt\}/)
  if (afterPreamble !== -1) {
    const rest = tex.slice(afterPreamble)
    const nl = rest.indexOf('\n')
    return (nl !== -1 ? rest.slice(nl + 1) : rest).replace(/\\end\{document\}/gi, '').trim()
  }
  return tex.replace(/\\end\{document\}/gi, '').trim()
}

/** Escape &, %, # inside text (not _). Underscores often appear in tech names; escape only when clearly text. */
function escapeLatexTextSpecials(s: string): string {
  return s
    .replace(/\\&/g, '\0A')
    .replace(/\\%/g, '\0P')
    .replace(/\\#/g, '\0H')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\0A/g, '\\&')
    .replace(/\0P/g, '\\%')
    .replace(/\0H/g, '\\#')
}

function escapeLatexUrl(s: string): string {
  return s
    .replace(/\\&/g, '\0A')
    .replace(/\\%/g, '\0P')
    .replace(/\\#/g, '\0H')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\0A/g, '\\&')
    .replace(/\0P/g, '\\%')
    .replace(/\0H/g, '\\#')
}

function mapBalancedCommandArgs(tex: string, command: string, mapInner: (inner: string) => string): string {
  const needle = `\\${command}{`
  let out = ''
  let i = 0
  while (i < tex.length) {
    const idx = tex.indexOf(needle, i)
    if (idx === -1) {
      out += tex.slice(i)
      break
    }
    // Avoid matching longer commands that share a suffix (e.g. textbf vs something)
    out += tex.slice(i, idx + needle.length)
    let depth = 1
    const contentStart = idx + needle.length
    let j = contentStart
    for (; j < tex.length; j++) {
      const ch = tex[j]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) {
      out += tex.slice(contentStart)
      break
    }
    out += mapInner(tex.slice(contentStart, j)) + '}'
    i = j + 1
  }
  return out
}

function mapHrefArgs(tex: string): string {
  const needle = '\\href{'
  let out = ''
  let i = 0
  while (i < tex.length) {
    const idx = tex.indexOf(needle, i)
    if (idx === -1) {
      out += tex.slice(i)
      break
    }
    out += tex.slice(i, idx)

    let depth = 0
    let j = idx + needle.length - 1
    const urlStart = j + 1
    for (; j < tex.length; j++) {
      if (tex[j] === '{') depth++
      else if (tex[j] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) {
      out += tex.slice(idx)
      break
    }
    const url = escapeLatexUrl(tex.slice(urlStart, j))
    j++
    while (j < tex.length && /\s/.test(tex[j])) j++
    if (tex[j] !== '{') {
      out += `\\href{${url}}`
      i = j
      continue
    }
    depth = 0
    const textStart = j + 1
    for (; j < tex.length; j++) {
      if (tex[j] === '{') depth++
      else if (tex[j] === '}') {
        depth--
        if (depth === 0) break
      }
    }
    if (depth !== 0) {
      out += `\\href{${url}}` + tex.slice(textStart - 1)
      break
    }
    const text = escapeLatexTextSpecials(tex.slice(textStart, j))
    out += `\\href{${url}}{${text}}`
    i = j + 1
  }
  return out
}

/** If a tabular row has more than one unescaped &, treat extras as text (\\&). */
function fixExtraAmpersandsInTabular(tex: string): string {
  const parts: string[] = []
  let i = 0
  const beginRe = /\\begin\{tabular\*?\}/
  while (i < tex.length) {
    const m = beginRe.exec(tex.slice(i))
    if (!m) {
      parts.push(tex.slice(i))
      break
    }
    const abs = i + m.index
    parts.push(tex.slice(i, abs))

    // Find end of \begin{tabular...}{...} possibly with nested braces in column spec
    let j = abs + m[0].length
    while (j < tex.length && /\s/.test(tex[j])) j++
    if (tex[j] === '[') {
      const close = tex.indexOf(']', j)
      j = close === -1 ? j : close + 1
      while (j < tex.length && /\s/.test(tex[j])) j++
    }
    if (tex[j] === '{') {
      let depth = 0
      for (; j < tex.length; j++) {
        if (tex[j] === '{') depth++
        else if (tex[j] === '}') {
          depth--
          if (depth === 0) {
            j++
            break
          }
        }
      }
    }
    const contentStart = j
    const endToken = tex.startsWith('\\begin{tabular*}', abs) ? '\\end{tabular*}' : '\\end{tabular}'
    const endIdx = tex.indexOf(endToken, contentStart)
    if (endIdx === -1) {
      parts.push(tex.slice(abs))
      break
    }
    const header = tex.slice(abs, contentStart)
    const content = tex.slice(contentStart, endIdx)
    const fixedContent = content
      .split('\n')
      .map((line) => {
        const ampIdx: number[] = []
        for (let k = 0; k < line.length; k++) {
          if (line[k] === '&' && line[k - 1] !== '\\') ampIdx.push(k)
        }
        if (ampIdx.length <= 1) return line
        // Keep the last & as column separator; escape earlier ones
        let out = ''
        let prev = 0
        for (let a = 0; a < ampIdx.length; a++) {
          const pos = ampIdx[a]
          out += line.slice(prev, pos)
          out += a < ampIdx.length - 1 ? '\\&' : '&'
          prev = pos + 1
        }
        out += line.slice(prev)
        return out
      })
      .join('\n')
    parts.push(header + fixedContent + endToken)
    i = endIdx + endToken.length
  }
  return parts.join('')
}

function normalizeItemizeOptions(tex: string): string {
  // Ensure enumitem-compatible options
  return tex.replace(
    /\\begin\{itemize\}\s*\[[^\]]*\]/g,
    '\\begin{itemize}[noitemsep,topsep=4pt,leftmargin=*]'
  )
}

/**
 * Post-process AI LaTeX body so common specials inside text don't break tabular.
 */
export function sanitizeGeneratedLatex(tex: string): string {
  let t = tex
  for (const cmd of ['textbf', 'textit', 'emph', 'textrm', 'textsf', 'textsc']) {
    t = mapBalancedCommandArgs(t, cmd, escapeLatexTextSpecials)
  }
  t = t.replace(/\\section\*\{([^{}]*)\}/g, (_, inner: string) => `\\section*{${escapeLatexTextSpecials(inner)}}`)
  t = mapHrefArgs(t)

  t = t.replace(
    /(\\begin\{itemize\}\[[^\]]*\][\s\S]*?\\end\{itemize\})\s*(\\noindent\\href\{[^}]+\}\{\\textbf\{(?:View on GitHub|Auf GitHub ansehen)\}\})/gi,
    '$2\n$1'
  )

  return t
}

