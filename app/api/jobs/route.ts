import { NextRequest, NextResponse } from 'next/server'
import { fetchJobsFromAllPlatforms, getMockJobs, JobSearchParams, JobListing } from '../../../lib/jobPlatforms'

export async function POST(request: NextRequest) {
  try {
    const body: JobSearchParams = await request.json()
    const { keywords = [], location, platform = 'all', limit = 50 } = body

    // Validate input
    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      )
    }

         // Fetch jobs from public APIs
     let jobs: JobListing[] = []
     
     try {
       jobs = await fetchJobsFromAllPlatforms({ keywords, location, platform, limit })
     } catch (error) {
       console.error('Error fetching from public APIs:', error)
       // Return empty array if APIs fail - no fake data
       jobs = []
     }

    // Filter by platform if specified
    if (platform && platform !== 'all') {
      jobs = jobs.filter(job => job.platform === platform)
    }

    // Return jobs with pagination info
    return NextResponse.json({
      jobs,
      total: jobs.length,
      platform: platform,
      keywords: keywords,
      location: location,
      source: 'Public APIs'
    })

  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    const jobs = await fetchJobsFromAllPlatforms({ 
      keywords: ['software', 'developer', 'engineer'],
      platform: 'all',
      limit: 20
    })

    return NextResponse.json({
      jobs,
      total: jobs.length,
      message: 'Jobs loaded from public APIs successfully',
      source: 'Public APIs'
    })

  } catch (error) {
    console.error('Error in GET /api/jobs:', error)
    
    // Fallback to mock data
    const mockJobs = getMockJobs()
    
    return NextResponse.json({
      jobs: mockJobs,
      total: mockJobs.length,
      message: 'Mock jobs loaded (APIs unavailable)',
      source: 'Mock Data'
    })
  }
}

