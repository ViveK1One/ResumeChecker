// Location Detection and Country Mapping Utilities

export interface CountryInfo {
  name: string
  code: string
  flag: string
  timezone: string
  currency: string
}

export const countries: Record<string, CountryInfo> = {
  'India': {
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  },
  'Germany': {
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    timezone: 'Europe/Berlin',
    currency: 'EUR'
  },
  'United States': {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    currency: 'USD'
  },
  'United Kingdom': {
    name: 'United Kingdom',
    code: 'GB',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    currency: 'GBP'
  },
  'Canada': {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    timezone: 'America/Toronto',
    currency: 'CAD'
  },
  'Australia': {
    name: 'Australia',
    code: 'AU',
    flag: '🇦🇺',
    timezone: 'Australia/Sydney',
    currency: 'AUD'
  },
  'Netherlands': {
    name: 'Netherlands',
    code: 'NL',
    flag: '🇳🇱',
    timezone: 'Europe/Amsterdam',
    currency: 'EUR'
  },
  'Sweden': {
    name: 'Sweden',
    code: 'SE',
    flag: '🇸🇪',
    timezone: 'Europe/Stockholm',
    currency: 'SEK'
  },
  'Switzerland': {
    name: 'Switzerland',
    code: 'CH',
    flag: '🇨🇭',
    timezone: 'Europe/Zurich',
    currency: 'CHF'
  },
  'Singapore': {
    name: 'Singapore',
    code: 'SG',
    flag: '🇸🇬',
    timezone: 'Asia/Singapore',
    currency: 'SGD'
  },
  'Japan': {
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    timezone: 'Asia/Tokyo',
    currency: 'JPY'
  },
  'Worldwide': {
    name: 'Worldwide',
    code: 'WW',
    flag: '🌍',
    timezone: 'UTC',
    currency: 'USD'
  }
}

// Detect user location using multiple methods
export async function detectUserLocation(): Promise<string> {
  try {
    // Method 1: Try browser geolocation
    if (navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false
        })
      })

      // Reverse geocoding to get country
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        return data.countryName || 'Worldwide'
      }
    }

    // Method 2: IP-based location detection
    const response = await fetch('https://api.ipapi.com/api/check?access_key=free')
    if (response.ok) {
      const data = await response.json()
      return data.country_name || 'Worldwide'
    }

    // Method 3: Alternative IP service
    const altResponse = await fetch('https://ipapi.co/json/')
    if (altResponse.ok) {
      const data = await altResponse.json()
      return data.country_name || 'Worldwide'
    }

    return 'Worldwide'
  } catch (error) {
    console.log('Location detection failed:', error)
    return 'Worldwide'
  }
}

// Get country info by name
export function getCountryInfo(countryName: string): CountryInfo | null {
  return countries[countryName] || null
}

// Get all available countries
export function getAvailableCountries(): CountryInfo[] {
  return Object.values(countries)
}

// Format salary based on country
export function formatSalary(amount: string, country: string): string {
  const countryInfo = getCountryInfo(country)
  if (!countryInfo) return amount

  // Add currency symbol based on country
  switch (countryInfo.currency) {
    case 'INR':
      return `₹${amount}`
    case 'USD':
      return `$${amount}`
    case 'EUR':
      return `€${amount}`
    case 'GBP':
      return `£${amount}`
    case 'CAD':
      return `C$${amount}`
    case 'AUD':
      return `A$${amount}`
    case 'SGD':
      return `S$${amount}`
    case 'JPY':
      return `¥${amount}`
    default:
      return amount
  }
}

// Get timezone offset for a country
export function getTimezoneOffset(country: string): number {
  const countryInfo = getCountryInfo(country)
  if (!countryInfo) return 0

  const now = new Date()
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const countryTime = new Date(utc + (getTimezoneOffset(countryInfo.timezone) * 60000))
  
  return countryTime.getTimezoneOffset()
}

// Helper function to get timezone offset
function getTimezoneOffset(timezone: string): number {
  const date = new Date()
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  const targetTime = new Date(utc + (new Date().toLocaleString("en-US", {timeZone: timezone}) as any))
  return targetTime.getTimezoneOffset()
}

