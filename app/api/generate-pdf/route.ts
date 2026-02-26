import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

// Helper function to add page break if needed
function checkPageBreak(pdf: jsPDF, yPosition: number, pageHeight: number, margin: number) {
  if (yPosition > pageHeight - 60) {
    pdf.addPage()
    addHeaderFooter(pdf)
    return margin + 30
  }
  return yPosition
}

// Helper function to add header and footer (professional design)
function addHeaderFooter(pdf: jsPDF) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Header with full width - extending to page edges
  pdf.setFillColor(11, 32, 79) // #0B204F - Dark Navy Blue
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  // Header text
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold') // Using bold for Poppins-like appearance
  pdf.setTextColor(255, 255, 255)
  pdf.text('RESUME ANALYSIS REPORT', pageWidth / 2, 18, { align: 'center' })
  
  // Subtitle
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(209, 213, 219)
  pdf.text('Professional Assessment & Strategic Recommendations', pageWidth / 2, 26, { align: 'center' })
  
  // Footer with full width - extending to page edges
  pdf.setFillColor(11, 32, 79) // #0B204F - Dark Navy Blue
  pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F')
  
  // Footer text
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(156, 163, 175)
  pdf.text('Copyright©2025 - Vivek Dudhat The One. All rights reserved.', pageWidth / 2, pageHeight - 6, { align: 'center' })
}

// Helper function to add professional section header
function addSectionHeader(pdf: jsPDF, title: string, yPosition: number, pageHeight: number, margin: number) {
  yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
  
  // Section background using color palette - reduced width
  const pageWidth = pdf.internal.pageSize.getWidth()
  const headerWidth = pageWidth * 0.6 // 60% of page width
  const headerX = (pageWidth - headerWidth) / 2 // Center the header
  
  pdf.setFillColor(6, 63, 120) // #063F78 - Medium Blue
  pdf.rect(headerX, yPosition - 8, headerWidth, 25, 'F')
  
  // Section border
  pdf.setDrawColor(1, 99, 148) // #016394 - Teal Blue
  pdf.setLineWidth(0.5)
  pdf.rect(headerX, yPosition - 8, headerWidth, 25, 'S')
  
  // Section title - Poppins-like bold styling
  pdf.setFontSize(15)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text(title, pageWidth / 2, yPosition + 2, { align: 'center' })
  
  return yPosition + 25
}

// Helper function to add subsection
function addSubsection(pdf: jsPDF, title: string, yPosition: number, pageHeight: number, margin: number) {
  yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
  
  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold') // Poppins-like bold for headings
  pdf.setTextColor(1, 99, 148) // #016394 - Teal Blue
  pdf.text(title, margin, yPosition)
  
  // Underline
  pdf.setDrawColor(11, 128, 161) // #0B80A1 - Bright Teal
  pdf.setLineWidth(0.3)
  pdf.line(margin, yPosition + 2, margin + 80, yPosition + 2)
  
  return yPosition + 12
}

// Helper function to add professional text with justification
function addWrappedText(pdf: jsPDF, text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, justify: boolean = true) {
  pdf.setFontSize(fontSize)
  pdf.setFont('helvetica', 'normal') // Lora-like font for content
  pdf.setTextColor(3, 46, 102) // #032E66 - Deep Blue for content
  
  const words = text.split(' ')
  let line = ''
  let currentY = y
  
  for (const word of words) {
    const testLine = line + word + ' '
    const testWidth = pdf.getTextWidth(testLine)
    
    if (testWidth > maxWidth && line !== '') {
      if (justify && line.trim().split(' ').length > 1) {
        // Justify the line
        const lineWords = line.trim().split(' ')
        const totalWordWidth = lineWords.reduce((sum, word) => sum + pdf.getTextWidth(word), 0)
        const spaceWidth = (maxWidth - totalWordWidth) / (lineWords.length - 1)
        
        let currentX = x
        lineWords.forEach((word, index) => {
          pdf.text(word, currentX, currentY)
          currentX += pdf.getTextWidth(word) + spaceWidth
        })
      } else {
        pdf.text(line, x, currentY)
      }
      currentY += fontSize * 0.6
      line = word + ' '
    } else {
      line = testLine
    }
  }
  
  if (line) {
    pdf.text(line, x, currentY)
    currentY += fontSize * 0.8
  }
  
  return currentY
}

// Helper function to create professional table
function createTable(pdf: jsPDF, headers: string[], data: string[][], startY: number, margin: number, pageHeight: number) {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const contentWidth = pageWidth - 2 * margin
  const colWidth = contentWidth / headers.length
  
  let yPosition = startY
  yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
  
  // Table header
  pdf.setFillColor(11, 32, 79) // #0B204F - Dark Navy Blue
  pdf.rect(margin, yPosition - 5, contentWidth, 18, 'F')
  
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold') // Poppins-like bold
  pdf.setTextColor(255, 255, 255)
  
  headers.forEach((header, index) => {
    pdf.text(header, margin + (index * colWidth) + 10, yPosition + 5)
  })
  
  yPosition += 18
  
  // Table data
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal') // Lora-like font
  pdf.setTextColor(3, 46, 102) // #032E66 - Deep Blue
  
  data.forEach((row, rowIndex) => {
    yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
    
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(margin, yPosition - 3, contentWidth, 15, 'F')
    }
    
    row.forEach((cell, colIndex) => {
      pdf.text(cell, margin + (colIndex * colWidth) + 10, yPosition + 5)
    })
    
    yPosition += 15
  })
  
  return yPosition + 10
}

// Helper function to draw professional progress bar
function drawProgressBar(pdf: jsPDF, x: number, y: number, width: number, height: number, percentage: number, label: string) {
  // Background
  pdf.setFillColor(229, 231, 235)
  pdf.rect(x, y, width, height, 'F')
  
  // Progress with color palette
  const progressWidth = (width * percentage) / 100
  if (percentage >= 80) {
    pdf.setFillColor(11, 128, 161) // #0B80A1 - Bright Teal
  } else if (percentage >= 60) {
    pdf.setFillColor(1, 99, 148) // #016394 - Teal Blue
  } else {
    pdf.setFillColor(6, 63, 120) // #063F78 - Medium Blue
  }
  pdf.rect(x, y, progressWidth, height, 'F')
  
  // Border
  pdf.setDrawColor(209, 213, 219)
  pdf.setLineWidth(0.3)
  pdf.rect(x, y, width, height, 'S')
  
  // Label
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal') // Lora-like font
  pdf.setTextColor(3, 46, 102) // #032E66 - Deep Blue
  pdf.text(label, x + width + 10, y + height/2 + 3)
  
  // Percentage
  pdf.setFont('helvetica', 'bold') // Poppins-like bold
  pdf.setTextColor(11, 32, 79) // #0B204F - Dark Navy Blue
  pdf.text(`${percentage}%`, x + width/2, y + height/2 + 3, { align: 'center' })
}

// Helper function to get score rating
function getScoreRating(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Very Good'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  if (score >= 40) return 'Needs Improvement'
  return 'Poor'
}

// Helper function to generate humanized content based on score
function generateHumanizedSummary(score: number, industry: string, experienceLevel: string): string {
  const industryText = industry && industry !== 'general' ? ` in the ${industry} industry` : ''
  const experienceText = experienceLevel ? ` as a ${experienceLevel} professional` : ''
  
  if (score >= 85) {
    return `This resume demonstrates exceptional professional quality${industryText}. The candidate${experienceText} presents a compelling narrative with strong achievements, relevant experience, and excellent formatting that aligns perfectly with industry standards. This resume would likely pass ATS screening and make a strong impression on hiring managers.`
  } else if (score >= 75) {
    return `This resume shows strong professional potential${industryText}. The candidate${experienceText} has a solid foundation with good experience and achievements, though some refinements could enhance its impact. With targeted improvements, this resume could significantly improve interview prospects.`
  } else if (score >= 65) {
    return `This resume has a good foundation${industryText} but requires strategic improvements to maximize its effectiveness. The candidate${experienceText} demonstrates relevant experience, though the presentation and content optimization need attention to better showcase their qualifications.`
  } else if (score >= 50) {
    return `This resume needs substantial improvements${industryText} to meet current professional standards. While the candidate${experienceText} has relevant experience, the presentation, content structure, and keyword optimization require significant enhancement to improve ATS compatibility and hiring prospects.`
  } else {
    return `This resume requires comprehensive restructuring${industryText} to effectively represent the candidate's qualifications. The current format and content presentation${experienceText} fall below industry standards and would likely be filtered out by ATS systems. A complete overhaul is recommended.`
  }
}

// Helper function to generate personalized recommendations
function generatePersonalizedRecommendations(analysisData: any): string[] {
  const recommendations = []
  const score = analysisData.score
  const atsScore = analysisData.atsScore.overall
  const contentScore = Math.round((analysisData.contentScore.grammar + analysisData.contentScore.clarity + analysisData.contentScore.actionVerbs) / 3)
  
  if (score < 70) {
    recommendations.push('Consider a complete resume redesign to improve visual appeal and professional presentation')
  }
  
  if (atsScore < 70) {
    recommendations.push('Optimize keyword placement and ensure ATS-friendly formatting throughout the document')
  }
  
  if (contentScore < 70) {
    recommendations.push('Enhance content clarity and use more impactful action verbs to strengthen achievements')
  }
  
  if (analysisData.keywords?.missing?.length > 0) {
    recommendations.push('Incorporate industry-specific keywords naturally throughout your experience descriptions')
  }
  
  if (analysisData.contentQuality?.vaguePhrases?.length > 0) {
    recommendations.push('Replace vague phrases with specific, quantifiable achievements and measurable results')
  }
  
  recommendations.push('Focus on quantifying achievements with specific metrics, percentages, and dollar amounts')
  recommendations.push('Ensure consistent formatting and professional presentation throughout all sections')
  
  return recommendations.slice(0, 6)
}

export async function POST(request: NextRequest) {
  try {
    const analysisData = await request.json()

    // Create PDF with professional design
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 25
    const contentWidth = pageWidth - 2 * margin

    // Add header and footer to first page
    addHeaderFooter(pdf)

    let yPosition = 50

    // Professional title
    pdf.setFontSize(22)
    pdf.setFont('helvetica', 'bold') // Poppins-like bold
    pdf.setTextColor(11, 32, 79) // #0B204F - Dark Navy Blue
    pdf.text('Comprehensive Resume Analysis', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 8
    
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'normal') // Lora-like font
    pdf.setTextColor(3, 46, 102) // #032E66 - Deep Blue
    pdf.text('Professional Assessment & Strategic Recommendations', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Candidate information
    if (analysisData.candidateName && analysisData.candidateName !== 'there') {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold') // Poppins-like bold
      pdf.setTextColor(1, 99, 148) // #016394 - Teal Blue
      pdf.text(`Candidate: ${analysisData.candidateName}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10
    }

    // Date
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal') // Lora-like font
    pdf.setTextColor(3, 46, 102) // #032E66 - Deep Blue
    pdf.text(`Analysis Date: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 25

    // 1. Executive Summary
    yPosition = addSectionHeader(pdf, '1. Executive Summary', yPosition, pageHeight, margin)
    
    const rating = getScoreRating(analysisData.score)
    const summary = generateHumanizedSummary(analysisData.score, analysisData.industry, analysisData.experienceLevel)
    
    yPosition = addWrappedText(pdf, summary, margin, yPosition, contentWidth, 11, true)
    yPosition += 15
    
    // Overall score display
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold') // Poppins-like bold
    pdf.setTextColor(11, 32, 79) // #0B204F - Dark Navy Blue
    pdf.text(`Overall Rating: ${rating} (${analysisData.score}/100)`, margin, yPosition)
    yPosition += 15
    
    drawProgressBar(pdf, margin, yPosition, 100, 10, analysisData.score, 'Overall Score')
    yPosition += 25

    // 2. Detailed Assessment
    yPosition = addSectionHeader(pdf, '2. Detailed Assessment', yPosition, pageHeight, margin)
    
    // Assessment table
    const assessmentHeaders = ['Category', 'Score', 'Rating', 'Impact']
    const assessmentData = [
      ['ATS Compatibility', `${analysisData.atsScore.overall}%`, getScoreRating(analysisData.atsScore.overall), 'High'],
      ['Content Quality', `${Math.round((analysisData.contentScore.grammar + analysisData.contentScore.clarity + analysisData.contentScore.actionVerbs) / 3)}%`, 
       getScoreRating(Math.round((analysisData.contentScore.grammar + analysisData.contentScore.clarity + analysisData.contentScore.actionVerbs) / 3)), 'Medium'],
      ['Format & Structure', `${analysisData.atsScore.format}%`, getScoreRating(analysisData.atsScore.format), 'Medium'],
      ['Keyword Optimization', `${analysisData.atsScore.keywords}%`, getScoreRating(analysisData.atsScore.keywords), 'High']
    ]
    
    yPosition = createTable(pdf, assessmentHeaders, assessmentData, yPosition, margin, pageHeight)

    // 3. Key Findings
    yPosition = addSectionHeader(pdf, '3. Key Findings', yPosition, pageHeight, margin)
    
    // Strengths
    if (analysisData.strengths && analysisData.strengths.length > 0) {
      yPosition = addSubsection(pdf, 'Strengths', yPosition, pageHeight, margin)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(34, 197, 94)
      
      analysisData.strengths.slice(0, 4).forEach((strength: string) => {
        yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
        yPosition = addWrappedText(pdf, `• ${strength}`, margin + 5, yPosition, contentWidth - 10, 10, false)
        yPosition += 3
      })
      yPosition += 10
    }
    
    // Areas for Improvement
    if (analysisData.weaknesses && analysisData.weaknesses.length > 0) {
      yPosition = addSubsection(pdf, 'Areas for Improvement', yPosition, pageHeight, margin)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(239, 68, 68)
      
      analysisData.weaknesses.slice(0, 4).forEach((weakness: string) => {
        yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
        yPosition = addWrappedText(pdf, `• ${weakness}`, margin + 5, yPosition, contentWidth - 10, 10, false)
        yPosition += 3
      })
      yPosition += 15
    }

    // 4. Strategic Recommendations
    yPosition = addSectionHeader(pdf, '4. Strategic Recommendations', yPosition, pageHeight, margin)
    
    const recommendations = generatePersonalizedRecommendations(analysisData)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(55, 65, 81)
    
    recommendations.forEach((rec: string, index: number) => {
      yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
      yPosition = addWrappedText(pdf, `${index + 1}. ${rec}`, margin + 5, yPosition, contentWidth - 10, 10, true)
      yPosition += 5
    })
    yPosition += 15

    // 5. Action Plan
    yPosition = addSectionHeader(pdf, '5. Action Plan', yPosition, pageHeight, margin)
    
    const actionSteps = [
      'Review and implement all critical recommendations within 1-2 weeks',
      'Focus on keyword optimization and ATS compatibility improvements',
      'Enhance achievement descriptions with specific metrics and results',
      'Consider professional resume review after implementing changes',
      'Test resume with ATS systems to verify improvements'
    ]
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(55, 65, 81)
    
    actionSteps.forEach((step: string, index: number) => {
      yPosition = checkPageBreak(pdf, yPosition, pageHeight, margin)
      yPosition = addWrappedText(pdf, `${index + 1}. ${step}`, margin + 5, yPosition, contentWidth - 10, 10, true)
      yPosition += 5
    })
    yPosition += 15

    // 6. Final Score Summary
    yPosition = addSectionHeader(pdf, '6. Final Score Summary', yPosition, pageHeight, margin)
    
    const finalHeaders = ['Category', 'Score', 'Status', 'Priority']
    const finalData = [
      ['Overall Score', `${analysisData.score}%`, rating, 'Primary'],
      ['ATS Compatibility', `${analysisData.atsScore.overall}%`, getScoreRating(analysisData.atsScore.overall), 'High'],
      ['Content Quality', `${Math.round((analysisData.contentScore.grammar + analysisData.contentScore.clarity + analysisData.contentScore.actionVerbs) / 3)}%`, 
       getScoreRating(Math.round((analysisData.contentScore.grammar + analysisData.contentScore.clarity + analysisData.contentScore.actionVerbs) / 3)), 'Medium'],
      ['Format & Structure', `${analysisData.atsScore.format}%`, getScoreRating(analysisData.atsScore.format), 'Medium']
    ]
    
    yPosition = createTable(pdf, finalHeaders, finalData, yPosition, margin, pageHeight)

    // Convert to buffer
    const pdfBuffer = pdf.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="professional-resume-analysis-report.pdf"',
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
