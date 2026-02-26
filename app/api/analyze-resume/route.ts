import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import OpenAI from 'openai'
import { getEmailForRoute } from '@/lib/authRequest'
import dbConnect from '@/lib/mongodb'
import Resume from '@/models/Resume'
import User from '@/models/User'
import { v4 as uuidv4 } from 'uuid'

const FREE_ANALYSIS_LIMIT = 3

// Rate limiting store (in-memory; use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitStore.get(ip)
  if (!limit || now > limit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 }) // 1 hour window
    return true
  }
  if (limit.count >= 10) return false
  limit.count++
  return true
}

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Gemini API config – models ordered by free-tier generosity (lite first)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const GEMINI_MODELS_TO_TRY = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']

function extractNameFromResume(resumeText: string): string {
  try {
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim()
      const namePattern = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/
      const nameMatch = line.match(namePattern)
      if (nameMatch) return nameMatch[1]
      const capsPattern = /^([A-Z][A-Z\s]+)$/
      const capsMatch = line.match(capsPattern)
      if (capsMatch && capsMatch[1].split(' ').length >= 2 && capsMatch[1].length < 50) {
        return capsMatch[1].trim()
      }
    }
    return 'there'
  } catch {
    return 'there'
  }
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  software: ['JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Next.js', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Git', 'Agile', 'CI/CD'],
  data: ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Tableau', 'Power BI', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Spark', 'Kafka', 'Airflow', 'Snowflake', 'dbt', 'Statistics'],
  marketing: ['SEO', 'SEM', 'Google Analytics', 'Google Ads', 'Facebook Ads', 'HubSpot', 'Salesforce', 'Content Marketing', 'Copywriting', 'A/B Testing', 'Email Marketing', 'CRM', 'Social Media'],
  finance: ['Excel', 'VBA', 'Python', 'Bloomberg', 'Financial Modeling', 'DCF', 'Valuation', 'Risk Management', 'SQL', 'Power BI', 'Quantitative Analysis', 'GAAP', 'IFRS'],
  healthcare: ['Epic', 'Cerner', 'HIPAA', 'EMR', 'EHR', 'HL7', 'FHIR', 'Clinical Research', 'Biostatistics', 'Medical Coding', 'FDA', 'GCP', 'ICD-10'],
  design: ['Figma', 'Adobe XD', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Wireframing', 'Prototyping', 'UI/UX', 'Typography', 'Design Systems', 'Accessibility'],
  sales: ['Salesforce', 'HubSpot', 'CRM', 'B2B', 'B2C', 'Pipeline Management', 'Forecasting', 'LinkedIn Sales Navigator', 'Cold Outreach', 'Account Management', 'Negotiation'],
  general: ['Leadership', 'Project Management', 'Communication', 'Problem Solving', 'Agile', 'Microsoft Office', 'Data Analysis', 'Strategic Planning', 'Customer Service'],
}

const INDUSTRY_PROJECTS: Record<string, string[]> = {
  software: ['Full-stack web app with React & Node.js', 'Mobile app with React Native', 'Rest API with comprehensive docs', 'AI-powered chatbot', 'Microservices with Docker/K8s'],
  data: ['Predictive ML model', 'Real-time data pipeline', 'Interactive Tableau/Power BI dashboard', 'Customer segmentation model', 'NLP text analysis project'],
  marketing: ['SEO-optimized content campaign', 'Social media growth strategy with metrics', 'Email drip campaign A/B test', 'Brand identity redesign', 'Marketing analytics dashboard'],
  finance: ['DCF valuation model', 'Risk assessment dashboard', 'Portfolio optimizer', 'Automated financial report', 'Algorithmic trading backtest'],
  healthcare: ['Patient management system', 'Healthcare analytics dashboard', 'HIPAA-compliant app', 'Clinical data visualization', 'Telemedicine platform'],
  design: ['End-to-end brand identity', 'Mobile app UX redesign', 'Design system with component library', 'E-commerce UX audit & redesign', 'Accessibility audit & fix'],
  sales: ['CRM implementation & adoption plan', 'Sales process automation', 'Pipeline management dashboard', 'Lead scoring model', 'Sales enablement program'],
  general: ['Cross-functional project delivery', 'Process improvement initiative', 'Team performance dashboard', 'Client onboarding redesign', 'Cost-reduction analysis'],
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in an hour.' },
      { status: 429 }
    )
  }

  const userEmail = await getEmailForRoute(request)
  if (!userEmail) {
    return NextResponse.json(
      { error: 'Sign in required to analyze resume.', requiresAuth: true },
      { status: 401 }
    )
  }

  let dbUser: Record<string, unknown> | null = null
  try {
    await dbConnect()
    dbUser = await User.findOne({ email: userEmail }).lean() as Record<string, unknown> | null
    if (dbUser) {
      const tier = (dbUser.subscriptionTier as string) || 'free'
      const resumeCount = (dbUser.resumeCount as number) || 0
      if (tier === 'free' && resumeCount >= FREE_ANALYSIS_LIMIT) {
        return NextResponse.json(
          {
            error: `You have used all ${FREE_ANALYSIS_LIMIT} free analyses. Upgrade to Pro for unlimited analyses.`,
            limitReached: true,
            resumeCount,
            freeLimit: FREE_ANALYSIS_LIMIT,
          },
          { status: 403 }
        )
      }
    } else {
      // User session exists but no user in DB (e.g. account deleted)
      // For now, let's deny as it's safer.
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Database connection failed.' }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('resume') as File | null
    const jobDescription = formData.get('jobDescription') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Strict file type validation
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      )
    }

    // File size check (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Check magic bytes for real PDF/DOCX
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46
    const isDOCX = buffer[0] === 0x50 && buffer[1] === 0x4b // PK zip signature

    if (file.type === 'application/pdf' && !isPDF) {
      return NextResponse.json({ error: 'File does not appear to be a valid PDF.' }, { status: 400 })
    }
    if (file.type.includes('wordprocessingml') && !isDOCX) {
      return NextResponse.json({ error: 'File does not appear to be a valid DOCX.' }, { status: 400 })
    }

    // Extract text
    let resumeText = ''
    if (file.type === 'application/pdf') {
      // Dynamically require pdf-parse to avoid Next.js build issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse')
      const pdfData = await pdfParse(buffer)
      resumeText = pdfData.text
    } else {
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
    }

    if (!resumeText.trim() || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from the file. Please ensure it is not scanned/image-based or password-protected.' },
        { status: 400 }
      )
    }

    // AI analysis
    let analysis
    try {
      const userTier = (dbUser?.subscriptionTier as string) || 'free'
      const isPro = userTier === 'pro' || userTier === 'lifetime'

      // If free user provided JD, we ignore it or handle in prompt. 
      // User said "do not allow all feature to all customer".
      const effectiveJD = isPro ? (jobDescription || undefined) : undefined

      analysis = await analyzeResumeWithAI(resumeText, effectiveJD, userTier)
    } catch (aiError: unknown) {
      const errMsg = aiError instanceof Error ? aiError.message : String(aiError)
      return NextResponse.json(
        {
          error: 'AI analysis failed',
          details: errMsg,
          hint: 'Check that your GEMINI_API_KEY and OPENAI_API_KEY are valid and have available quota.',
        },
        { status: 500 }
      )
    }

    // Save to MongoDB (optional, non-blocking)
    const validSuggestionTypes: Array<'critical' | 'important' | 'minor'> = ['critical', 'important', 'minor']
    const normalizeSuggestions = (list: Array<{ type?: string; title?: string; description?: string; example?: string }>) =>
      (list || []).slice(0, 10).map((s) => ({
        type: validSuggestionTypes.includes(s.type as 'critical' | 'important' | 'minor') ? (s.type as 'critical' | 'important' | 'minor') : 'minor',
        title: s.title ?? '',
        description: s.description ?? '',
        example: s.example,
      }))

    try {
      await dbConnect()
      const fileId = uuidv4()
      const resumeData = new Resume({
        id: fileId,
        fileName: `${fileId}.${file.type === 'application/pdf' ? 'pdf' : 'docx'}`,
        originalName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'), // sanitize
        fileSize: file.size,
        fileType: file.type,
        uploadDate: new Date(),
        ...(userEmail && { userEmail }),
        analysisResult: {
          score: analysis.score,
          atsScore: analysis.atsScore,
          contentScore: analysis.contentScore,
          suggestions: normalizeSuggestions((analysis.suggestions || []) as Array<{ type?: string; title?: string; description?: string; example?: string }>),
          keywords: analysis.keywords,
        },
        resumeText: ' ', // required by schema; we do not store full text for privacy
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || 'unknown',
      })
      await resumeData.save()
      if (userEmail) {
        await User.updateOne(
          { email: userEmail },
          { $inc: { resumeCount: 1 } }
        )
      }
    } catch {
      // Save failed; analysis still returned to user
    }

    // Include usage info in response for logged-in free users
    let usage = undefined
    if (dbUser) {
      const tier = (dbUser.subscriptionTier as string) || 'free'
      const currentCount = ((dbUser.resumeCount as number) || 0) + 1
      if (tier === 'free') {
        usage = {
          used: currentCount,
          limit: FREE_ANALYSIS_LIMIT,
          remaining: Math.max(0, FREE_ANALYSIS_LIMIT - currentCount),
        }
      }
    }

    return NextResponse.json({ ...analysis, usage })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again.', details: errMsg },
      { status: 500 }
    )
  }
}

async function callGeminiAPIWithModel(prompt: string, model: string, retryOn429 = true): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local')
  }
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: model.startsWith('gemini-2.5') ? 1 : 0.2,
      maxOutputTokens: 8192,
      topP: 0.95,
    },
  }

  if (model.startsWith('gemini-2.5')) {
    (body.generationConfig as Record<string, unknown>).topK = 64
  } else {
    (body.generationConfig as Record<string, unknown>).topK = 40
    body.safetySettings = [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    ]
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const errDetail = data?.error?.message || JSON.stringify(data)
    if (response.status === 429 && retryOn429) {
      await new Promise((r) => setTimeout(r, 10000))
      return callGeminiAPIWithModel(prompt, model, false)
    }
    throw new Error(`Gemini API error (${response.status}): ${errDetail}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason || 'unknown'
    throw new Error(`Gemini returned no text. Finish reason: ${reason}. Full response: ${JSON.stringify(data).slice(0, 500)}`)
  }

  return text
}

async function analyzeResumeWithAI(resumeText: string, jobDescription?: string, userTier: string = 'free') {
  const isPro = userTier === 'pro' || userTier === 'lifetime'

  const jdSection = jobDescription && isPro
    ? `\n\nJOB DESCRIPTION TO MATCH AGAINST:\n${jobDescription.slice(0, 3000)}\n\nAlso calculate "jobMatchScore" (0-100) based on how well this resume matches the job description. Include "jobMatchDetails" with "matchingKeywords", "missingKeywords", and "tailoringTips" arrays.`
    : ''

  const prompt = `You are an expert resume analyst, ATS specialist, and career coach with 15+ years of experience. Analyze this resume comprehensively.

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation, no text before/after the JSON.

${jobDescription ? 'Also analyze the match against the provided job description.' : ''}

Resume Text:
${resumeText.slice(0, 6000)}
${jdSection}

Return this exact JSON structure:
{
  "candidateName": "Full name from resume",
  "score": 65,
  "industry": "software",
  "experienceLevel": "mid",
  "atsScore": {
    "keywords": 70,
    "format": 75,
    "overall": 72
  },
  "contentScore": {
    "grammar": 80,
    "clarity": 70,
    "actionVerbs": 65
  },
  "atsCompatibility": {
    "overallScore": 72,
    "formattingScore": 75,
    "keywordScore": 70,
    "contentScore": 70,
    "improvementChecklist": ["Use standard section headers", "Add more quantified achievements"]
  },
  "formattingAnalysis": {
    "hasTables": false,
    "hasGraphics": false,
    "hasHeaders": false,
    "hasFooters": false,
    "usesStandardSections": true,
    "usesBulletPoints": true,
    "fontCompatible": true,
    "hasSpecialCharacters": false
  },
  "sectionAnalysis": {
    "summary": { "exists": true, "length": "medium", "keywordRich": true, "concise": true },
    "experience": { "usesActionVerbs": true, "quantifiedAchievements": false, "focusOnAccomplishments": true, "properFormatting": true },
    "skills": { "includesHardSkills": true, "includesSoftSkills": true, "industryRelevant": true, "properlyCategorized": false },
    "education": { "datesClear": true, "degreesListed": true, "institutionsNamed": true, "relevantCertifications": false }
  },
  "contentQuality": {
    "quantifiedAchievements": 30,
    "actionVerbUsage": 60,
    "vaguePhrases": ["responsible for", "helped with"],
    "genericStatements": ["team player", "hard worker"]
  },
  "suggestions": [
    { "type": "critical", "category": "content", "title": "Add Quantified Achievements", "description": "Replace vague statements with numbers and results.", "example": "Instead of 'led a team', write 'Led 8-person team delivering 3 products on time, saving $40K'", "priority": 1 }
  ],
  "keywords": {
    "found": ["Python", "React", "SQL"],
    "missing": ["Docker", "AWS", "CI/CD"],
    "jobSpecific": []
  },
  "strengths": ["Clear skills section", "Relevant experience"],
  "weaknesses": ["Lacks quantified achievements", "No summary section"],
  "recommendations": ["Add measurable results to each role", "Include a professional summary", "List certifications"],
  "projectIdeas": ["Build a portfolio project using your top skills", "Contribute to open source"],
  "trendingTechnologies": ["Docker", "Kubernetes", "LangChain", "Next.js"],
  "jobMatchScore": ${jobDescription ? '75' : 'null'},
  "jobMatchDetails": ${jobDescription ? '{"matchingKeywords": ["Python", "SQL"], "missingKeywords": ["Kubernetes", "Terraform"], "tailoringTips": ["Add cloud experience", "Mention team leadership"]}' : 'null'}
}

SCORING RULES (be realistic and strict):
- Start at 50 and adjust based on quality
- 90-100: Exceptional, very rare
- 80-89: Very good, minor issues
- 70-79: Good, a few areas to improve
- 60-69: Average, needs work
- 40-59: Below average, significant work needed
- <40: Needs major overhaul

Be specific, constructive, and actionable in all suggestions.`

  let analysis = null
  let usedAPI = ''

  // Try each Gemini model until one succeeds (free tier quota varies by model/region)
  let geminiResponse: string | null = null
  let lastGeminiError: string = ''
  for (const model of GEMINI_MODELS_TO_TRY) {
    try {
      geminiResponse = await callGeminiAPIWithModel(prompt, model)
      break
    } catch (e) {
      lastGeminiError = e instanceof Error ? e.message : String(e)
      continue
    }
  }

  if (geminiResponse) {
    try {
      const firstBrace = geminiResponse.indexOf('{')
      const lastBrace = geminiResponse.lastIndexOf('}')
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('Gemini response did not contain valid JSON braces')
      }
      const jsonStr = geminiResponse.substring(firstBrace, lastBrace + 1)
      analysis = JSON.parse(jsonStr)
      usedAPI = 'Gemini'
    } catch (parseError: unknown) {
      lastGeminiError = parseError instanceof Error ? parseError.message : String(parseError)
    }
  }

  if (!analysis && openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert resume analyst and ATS specialist. Return ONLY valid JSON. No markdown, no explanation — just the JSON object.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 3500,
      })
      const content = completion.choices[0]?.message?.content
      if (!content) throw new Error('OpenAI returned empty content')
      const firstBrace = content.indexOf('{')
      const lastBrace = content.lastIndexOf('}')
      if (firstBrace === -1) throw new Error('OpenAI response has no JSON')
      analysis = JSON.parse(content.substring(firstBrace, lastBrace + 1))
      usedAPI = 'OpenAI'
    } catch (openaiError: unknown) {
      const openaiMsg = openaiError instanceof Error ? openaiError.message : String(openaiError)
      throw new Error(
        `Both APIs failed.\nGemini: ${lastGeminiError || 'all models failed'}\nOpenAI: ${openaiMsg}`
      )
    }
  }

  if (!analysis) {
    throw new Error(
      lastGeminiError
        ? `Gemini failed: ${lastGeminiError}. Add OPENAI_API_KEY in .env.local as fallback or use a new Gemini key from https://aistudio.google.com/apikey`
        : 'No AI provider available. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local and restart the server.'
    )
  }

  analysis.apiSource = usedAPI
  return enhanceAnalysis(analysis, resumeText)
}

function enhanceAnalysis(analysis: Record<string, unknown>, resumeText: string) {
  const clamp = (v: unknown, def: number) =>
    Math.min(100, Math.max(0, typeof v === 'number' && !isNaN(v) ? v : def))

  const atsScore = (analysis.atsScore as Record<string, number>) || {}
  const contentScore = (analysis.contentScore as Record<string, number>) || {}
  const atsCompat = (analysis.atsCompatibility as Record<string, unknown>) || {}
  const formatting = (analysis.formattingAnalysis as Record<string, boolean>) || {}
  const sectionAnalysis = (analysis.sectionAnalysis as Record<string, Record<string, unknown>>) || {}
  const contentQuality = (analysis.contentQuality as Record<string, unknown>) || {}
  const keywords = (analysis.keywords as Record<string, string[]>) || {}
  const jobMatchDetails = analysis.jobMatchDetails as Record<string, unknown> | null

  const enhanced = {
    candidateName: (analysis.candidateName as string) || extractNameFromResume(resumeText),
    score: clamp(analysis.score, 50),
    apiSource: (analysis.apiSource as string) || 'AI',
    industry: (analysis.industry as string) || 'general',
    experienceLevel: (analysis.experienceLevel as string) || 'mid',
    atsScore: {
      keywords: clamp(atsScore.keywords, 50),
      format: clamp(atsScore.format, 55),
      overall: clamp(atsScore.overall, 52),
    },
    contentScore: {
      grammar: clamp(contentScore.grammar, 60),
      clarity: clamp(contentScore.clarity, 55),
      actionVerbs: clamp(contentScore.actionVerbs, 50),
    },
    atsCompatibility: {
      overallScore: clamp(atsCompat.overallScore as number, 52),
      formattingScore: clamp(atsCompat.formattingScore as number, 55),
      keywordScore: clamp(atsCompat.keywordScore as number, 50),
      contentScore: clamp(atsCompat.contentScore as number, 55),
      improvementChecklist: (atsCompat.improvementChecklist as string[]) || [],
    },
    formattingAnalysis: {
      hasTables: !!formatting.hasTables,
      hasGraphics: !!formatting.hasGraphics,
      hasHeaders: !!formatting.hasHeaders,
      hasFooters: !!formatting.hasFooters,
      usesStandardSections: formatting.usesStandardSections !== false,
      usesBulletPoints: formatting.usesBulletPoints !== false,
      fontCompatible: formatting.fontCompatible !== false,
      hasSpecialCharacters: !!formatting.hasSpecialCharacters,
    },
    sectionAnalysis: {
      summary: {
        exists: !!(sectionAnalysis.summary?.exists),
        length: (sectionAnalysis.summary?.length as string) || 'medium',
        keywordRich: !!(sectionAnalysis.summary?.keywordRich),
        concise: !!(sectionAnalysis.summary?.concise),
      },
      experience: {
        usesActionVerbs: !!(sectionAnalysis.experience?.usesActionVerbs),
        quantifiedAchievements: !!(sectionAnalysis.experience?.quantifiedAchievements),
        focusOnAccomplishments: !!(sectionAnalysis.experience?.focusOnAccomplishments),
        properFormatting: sectionAnalysis.experience?.properFormatting !== false,
      },
      skills: {
        includesHardSkills: !!(sectionAnalysis.skills?.includesHardSkills),
        includesSoftSkills: !!(sectionAnalysis.skills?.includesSoftSkills),
        industryRelevant: !!(sectionAnalysis.skills?.industryRelevant),
        properlyCategorized: !!(sectionAnalysis.skills?.properlyCategorized),
      },
      education: {
        datesClear: sectionAnalysis.education?.datesClear !== false,
        degreesListed: sectionAnalysis.education?.degreesListed !== false,
        institutionsNamed: sectionAnalysis.education?.institutionsNamed !== false,
        relevantCertifications: !!(sectionAnalysis.education?.relevantCertifications),
      },
    },
    contentQuality: {
      quantifiedAchievements: clamp(contentQuality.quantifiedAchievements as number, 30),
      actionVerbUsage: clamp(contentQuality.actionVerbUsage as number, 50),
      vaguePhrases: (contentQuality.vaguePhrases as string[]) || [],
      genericStatements: (contentQuality.genericStatements as string[]) || [],
    },
    suggestions: (analysis.suggestions as unknown[]) || [],
    keywords: {
      found: keywords.found || [],
      missing: keywords.missing || [],
      jobSpecific: keywords.jobSpecific || [],
    },
    strengths: (analysis.strengths as string[]) || [],
    weaknesses: (analysis.weaknesses as string[]) || [],
    recommendations: (analysis.recommendations as string[]) || [],
    projectIdeas: (analysis.projectIdeas as string[]) || [],
    trendingTechnologies: (analysis.trendingTechnologies as string[]) || [],
    jobMatchScore: analysis.jobMatchScore as number | null,
    jobMatchDetails: jobMatchDetails || null,
  }

  // Supplement missing keywords from our database
  const industry = enhanced.industry as keyof typeof INDUSTRY_KEYWORDS
  if (INDUSTRY_KEYWORDS[industry]) {
    const found = enhanced.keywords.found
    const extra = INDUSTRY_KEYWORDS[industry].filter(
      kw => !found.some(f => f.toLowerCase().includes(kw.toLowerCase()))
    ).slice(0, 8)
    const existingMissing = new Set(enhanced.keywords.missing.map(k => k.toLowerCase()))
    enhanced.keywords.missing = [
      ...enhanced.keywords.missing,
      ...extra.filter(k => !existingMissing.has(k.toLowerCase())),
    ]
  }

  // Fill project ideas if empty
  if (enhanced.projectIdeas.length === 0 && INDUSTRY_PROJECTS[industry]) {
    enhanced.projectIdeas = INDUSTRY_PROJECTS[industry].slice(0, 5)
  }

  return enhanced
}
