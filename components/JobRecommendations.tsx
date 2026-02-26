'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Search, Globe } from 'lucide-react'

interface JobRecommendationsProps {
  resumeKeywords?: string[]
  userLocation?: string
  resumeIndustry?: string
  resumeAnalysis?: any
}

export default function JobRecommendations({ resumeKeywords = [], userLocation, resumeIndustry, resumeAnalysis }: JobRecommendationsProps) {
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [locationLoading, setLocationLoading] = useState(false)

  // Detect user location on component mount
  useEffect(() => {
    detectUserLocation()
  }, [])

  const detectUserLocation = async () => {
    setLocationLoading(true)
    try {
      if (userLocation) {
        setCurrentLocation(userLocation)
        return
      }
      // IP-based only (geolocation is disabled by Permissions-Policy)
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        setCurrentLocation(data.country_name || 'Worldwide')
      } else {
        setCurrentLocation('Worldwide')
      }
    } catch {
      setCurrentLocation('Worldwide')
    } finally {
      setLocationLoading(false)
    }
  }

  const handleLocationChange = (location: string) => {
    setCurrentLocation(location)
  }

  // Generate industry-specific job keywords
  const getIndustryJobKeywords = (industry: string): string[] => {
    const industryKeywords: Record<string, string[]> = {
      'software': [
        'Software Engineer', 'Developer', 'Programmer', 'Full Stack Developer',
        'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Engineer',
        'React Developer', 'Node.js Developer', 'Python Developer', 'Java Developer',
        'Mobile Developer', 'iOS Developer', 'Android Developer', 'Cloud Engineer',
        'Data Engineer', 'Machine Learning Engineer', 'AI Engineer', 'System Administrator'
      ],
      'data': [
        'Data Analyst', 'Data Scientist', 'Business Analyst', 'Data Engineer',
        'Business Intelligence Analyst', 'Data Architect', 'Analytics Manager',
        'Machine Learning Engineer', 'AI Engineer', 'Statistician', 'Quantitative Analyst',
        'Data Visualization Specialist', 'ETL Developer', 'Database Administrator',
        'Research Analyst', 'Market Research Analyst', 'Financial Analyst'
      ],
      'marketing': [
        'Marketing Manager', 'Digital Marketing Specialist', 'SEO Specialist',
        'Content Marketing Manager', 'Social Media Manager', 'Marketing Analyst',
        'Brand Manager', 'Product Marketing Manager', 'Email Marketing Specialist',
        'Marketing Coordinator', 'Growth Marketing Manager', 'Marketing Director',
        'PPC Specialist', 'Marketing Automation Specialist', 'Influencer Marketing Manager'
      ],
      'finance': [
        'Financial Analyst', 'Accountant', 'Financial Manager', 'Investment Analyst',
        'Risk Analyst', 'Treasury Analyst', 'Credit Analyst', 'Financial Controller',
        'Finance Manager', 'Investment Banker', 'Portfolio Manager', 'Quantitative Analyst',
        'Financial Advisor', 'Compliance Officer', 'Auditor', 'Tax Specialist'
      ],
      'healthcare': [
        'Nurse', 'Medical Assistant', 'Healthcare Administrator', 'Medical Coder',
        'Health Information Manager', 'Clinical Research Coordinator', 'Medical Technologist',
        'Healthcare Analyst', 'Medical Office Manager', 'Health Educator', 'Pharmacy Technician',
        'Medical Device Specialist', 'Healthcare IT Specialist', 'Telemedicine Coordinator'
      ],
      'design': [
        'UI/UX Designer', 'Graphic Designer', 'Product Designer', 'Web Designer',
        'Visual Designer', 'Creative Director', 'Art Director', 'Brand Designer',
        'Illustrator', 'Motion Designer', '3D Designer', 'Design System Manager',
        'User Experience Designer', 'User Interface Designer', 'Interaction Designer'
      ],
      'sales': [
        'Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Representative',
        'Sales Director', 'Sales Engineer', 'Inside Sales Representative', 'Outside Sales Representative',
        'Sales Operations Manager', 'Customer Success Manager', 'Sales Analyst', 'Sales Trainer',
        'Channel Sales Manager', 'Key Account Manager', 'Sales Consultant'
      ],
      'education': [
        'Teacher', 'Professor', 'Educational Administrator', 'Curriculum Developer',
        'Instructional Designer', 'Education Consultant', 'School Counselor', 'Librarian',
        'Education Technology Specialist', 'Training Coordinator', 'Academic Advisor',
        'Education Policy Analyst', 'Special Education Teacher', 'Online Learning Specialist'
      ],
      'general': [
        'Project Manager', 'Business Analyst', 'Operations Manager', 'Administrative Assistant',
        'Human Resources Manager', 'Customer Service Representative', 'Office Manager',
        'Executive Assistant', 'Consultant', 'Coordinator', 'Manager', 'Director',
        'Analyst', 'Specialist', 'Coordinator'
      ]
    }
    
    return industryKeywords[industry] || industryKeywords['general']
  }

  if (locationLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Detecting your location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Job Search Platforms
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {resumeIndustry ? (
            <>
              Based on your <span className="font-semibold text-blue-600 capitalize">{resumeIndustry}</span> background, 
              here are the best platforms to find relevant job opportunities
            </>
          ) : (
            'Find your next career opportunity on these top job platforms'
          )}
        </p>
        {resumeIndustry && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Industry Detected:</span> {resumeIndustry.charAt(0).toUpperCase() + resumeIndustry.slice(1)}
              {resumeAnalysis?.experienceLevel && (
                <span className="ml-2">
                  • <span className="font-medium">Experience Level:</span> {resumeAnalysis.experienceLevel.charAt(0).toUpperCase() + resumeAnalysis.experienceLevel.slice(1)}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Location Selector */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={currentLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="India">🇮🇳 India</option>
              <option value="Germany">🇩🇪 Germany</option>
              <option value="United States">🇺🇸 United States</option>
              <option value="United Kingdom">🇬🇧 United Kingdom</option>
              <option value="Canada">🇨🇦 Canada</option>
              <option value="Australia">🇦🇺 Australia</option>
              <option value="Netherlands">🇳🇱 Netherlands</option>
              <option value="Sweden">🇸🇪 Sweden</option>
              <option value="Switzerland">🇨🇭 Switzerland</option>
              <option value="Singapore">🇸🇬 Singapore</option>
              <option value="Japan">🇯🇵 Japan</option>
              <option value="Worldwide">🌍 Worldwide (Remote)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Role Suggestions */}
      {resumeIndustry && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Suggested Job Roles for {resumeIndustry.charAt(0).toUpperCase() + resumeIndustry.slice(1)} Professionals
          </h3>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {getIndustryJobKeywords(resumeIndustry).slice(0, 8).map((jobTitle) => (
              <span
                key={jobTitle}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
              >
                {jobTitle}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Platform Links */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
          Search Jobs on Major Platforms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const industryKeywords = resumeIndustry ? getIndustryJobKeywords(resumeIndustry).slice(0, 3) : ['Software Engineer', 'Developer', 'Analyst']
            const searchTerms = industryKeywords.join(' ')
            
                         const platformLinks = [
               {
                 name: 'LinkedIn Jobs',
                 url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-blue-600',
                 bgColor: 'bg-blue-50 hover:bg-blue-100',
                 description: 'Professional networking and job search'
               },
               {
                 name: 'Indeed',
                 url: `https://www.indeed.com/jobs?q=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-blue-500',
                 bgColor: 'bg-blue-50 hover:bg-blue-100',
                 description: 'World\'s largest job site'
               },
               {
                 name: 'Adzuna',
                 url: `https://www.adzuna.com/search?q=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-green-600',
                 bgColor: 'bg-green-50 hover:bg-green-100',
                 description: 'Smart job search engine'
               },
               {
                 name: 'Reed',
                 url: `https://www.reed.co.uk/jobs?keywords=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-purple-600',
                 bgColor: 'bg-purple-50 hover:bg-purple-100',
                 description: 'UK job search platform'
               },
               {
                 name: 'Xing',
                 url: `https://www.xing.com/jobs/search?keywords=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-green-500',
                 bgColor: 'bg-green-50 hover:bg-green-100',
                 description: 'European professional network'
               },
               {
                 name: 'StepStone',
                 url: `https://www.stepstone.com/en/jobs?q=${encodeURIComponent(searchTerms)}`,
                 color: 'bg-red-600',
                 bgColor: 'bg-red-50 hover:bg-red-100',
                 description: 'European job search platform'
               }
             ]

            return platformLinks.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-6 rounded-lg border-2 border-transparent hover:border-gray-300 transition-all duration-200 text-center group ${platform.bgColor}`}
              >
                <div className={`w-16 h-16 rounded-full ${platform.color} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2 text-lg">{platform.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{platform.description}</p>
                <p className="text-xs text-gray-500">Search: {industryKeywords[0]}</p>
                <div className="mt-3 flex items-center justify-center text-blue-600 text-sm font-medium">
                  <span>Search Jobs</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </div>
              </a>
            ))
          })()}
        </div>
      </div>

             {/* Additional Platform Links */}
       <div className="mb-8">
         <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
           More Job Platforms
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <a
             href="https://www.glassdoor.com"
             target="_blank"
             rel="noopener noreferrer"
             className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
           >
             Glassdoor
           </a>
           <a
             href="https://www.totaljobs.com"
             target="_blank"
             rel="noopener noreferrer"
             className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-center"
           >
             TotalJobs
           </a>
         </div>
       </div>

      {/* Tips Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Job Search Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Optimize Your Profile</h4>
            <ul className="space-y-1">
              <li>• Update your resume with relevant keywords</li>
              <li>• Complete your LinkedIn profile</li>
              <li>• Add a professional photo</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Search Strategies</h4>
            <ul className="space-y-1">
              <li>• Use specific job titles and skills</li>
              <li>• Set up job alerts on multiple platforms</li>
              <li>• Network with industry professionals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
