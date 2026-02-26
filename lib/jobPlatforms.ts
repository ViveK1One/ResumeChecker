// Job Platform Integration via Public APIs (No API Keys Required)
// This file contains functions to fetch job data from public APIs

export interface JobPlatformConfig {
  name: string
  rssUrl: string
  enabled: boolean
  country?: string
}

export interface JobSearchParams {
  keywords: string[]
  location?: string
  platform?: string
  limit?: number
}

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  type: string
  postedDate: string
  description: string
  url: string
  platform: string
  logo?: string
  requirements?: string[]
  benefits?: string[]
}

// Public API configurations for job platforms
export const jobPlatforms: Record<string, JobPlatformConfig> = {
  adzuna: {
    name: 'Adzuna',
    rssUrl: 'https://api.adzuna.com/v1/api/jobs/de/search/1',
    enabled: true,
    country: 'Germany'
  },
  reed: {
    name: 'Reed',
    rssUrl: 'https://www.reed.co.uk/api/1.0/search',
    enabled: true,
    country: 'United Kingdom'
  },
  github: {
    name: 'GitHub Jobs',
    rssUrl: 'https://jobs.github.com/positions.json',
    enabled: true,
    country: 'Worldwide'
  }
}

// Fetch jobs from public APIs
async function fetchFromAPI(url: string, params?: any): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from API: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.results || data.jobs || []
  } catch (error) {
    console.error('Error fetching from API:', error)
    return []
  }
}

// Adzuna Jobs API Integration
export async function fetchAdzunaJobs(params: JobSearchParams): Promise<JobListing[]> {
  try {
    const keywords = params.keywords.join(' ')
    const location = params.location || 'Germany'
    const url = `${jobPlatforms.adzuna.rssUrl}?app_id=test&app_key=test&what=${encodeURIComponent(keywords)}&where=${encodeURIComponent(location)}&results_per_page=20`
    
    const jobs = await fetchFromAPI(url)
    
    return jobs.map((job: any, index: number) => ({
      id: `adzuna_${index}_${Date.now()}`,
      title: job.title || job.display_name || '',
      company: job.company?.display_name || job.company_name || 'Unknown Company',
      location: job.location?.display_name || job.location_name || 'Remote',
      salary: job.salary_min ? `€${job.salary_min} - €${job.salary_max}` : '',
      type: job.contract_time || 'Full-time',
      postedDate: new Date(job.created).toLocaleDateString(),
      description: job.description || job.redirect_url || '',
      url: job.redirect_url || job.url || '',
      platform: 'adzuna'
    }))
  } catch (error) {
    console.error('Adzuna API error:', error)
    return []
  }
}

// Reed Jobs API Integration
export async function fetchReedJobs(params: JobSearchParams): Promise<JobListing[]> {
  try {
    const keywords = params.keywords.join(' ')
    const location = params.location || 'United Kingdom'
    const url = `${jobPlatforms.reed.rssUrl}?keywords=${encodeURIComponent(keywords)}&locationName=${encodeURIComponent(location)}&resultsToTake=20`
    
    const jobs = await fetchFromAPI(url)
    
    return jobs.map((job: any, index: number) => ({
      id: `reed_${index}_${Date.now()}`,
      title: job.jobTitle || '',
      company: job.employerName || 'Unknown Company',
      location: job.locationName || 'Remote',
      salary: job.maximumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : '',
      type: job.employmentType || 'Full-time',
      postedDate: new Date(job.datePosted).toLocaleDateString(),
      description: job.jobDescription || '',
      url: job.jobUrl || '',
      platform: 'reed'
    }))
  } catch (error) {
    console.error('Reed API error:', error)
    return []
  }
}

// GitHub Jobs API Integration
export async function fetchGitHubJobs(params: JobSearchParams): Promise<JobListing[]> {
  try {
    const keywords = params.keywords.join(' ')
    const location = params.location || ''
    const url = `${jobPlatforms.github.rssUrl}?search=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`
    
    const jobs = await fetchFromAPI(url)
    
    return jobs.map((job: any, index: number) => ({
      id: `github_${index}_${Date.now()}`,
      title: job.title || '',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      salary: job.salary || '',
      type: job.type || 'Full-time',
      postedDate: new Date(job.created_at).toLocaleDateString(),
      description: job.description || '',
      url: job.url || job.html_url || '',
      platform: 'github'
    }))
  } catch (error) {
    console.error('GitHub Jobs API error:', error)
    return []
  }
}

// Main function to fetch jobs from all RSS platforms
export async function fetchJobsFromAllPlatforms(params: JobSearchParams): Promise<JobListing[]> {
  const allJobs: JobListing[] = []
  
  // Fetch from all enabled platforms in parallel
  const platformPromises = Object.entries(jobPlatforms)
    .filter(([_, config]) => config.enabled)
    .map(async ([platform, config]) => {
      try {
                 switch (platform) {
           case 'adzuna':
             return await fetchAdzunaJobs(params)
           case 'reed':
             return await fetchReedJobs(params)
           case 'github':
             return await fetchGitHubJobs(params)
           default:
             return []
         }
      } catch (error) {
        console.error(`Error fetching from ${platform}:`, error)
        return []
      }
    })

  const results = await Promise.allSettled(platformPromises)
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value)
    }
  })

  // Sort by relevance and date
  return allJobs.sort((a, b) => {
    // Sort by date first (newer first)
    const dateA = new Date(a.postedDate)
    const dateB = new Date(b.postedDate)
    return dateB.getTime() - dateA.getTime()
  }).slice(0, params.limit || 50) // Limit results
}

// Function to get platform-specific job URLs
export function getJobApplicationUrl(job: JobListing): string {
  return job.url || '#'
}

// Return empty array when no real jobs are available
export function getMockJobs(): JobListing[] {
  return []
}

