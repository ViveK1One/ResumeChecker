// RSS Parser Utility for Node.js
// This file contains functions to parse RSS feeds in a Node.js environment

export interface RSSItem {
  title: string
  company: string
  location: string
  description: string
  url: string
  postedDate: string
  salary: string
  type: string
}

// Simple XML parser using regex (no external dependencies)
function parseXML(xml: string): any {
  const result: any = {}
  
  // Parse RSS format
  const channelMatch = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i)
  if (channelMatch) {
    result.rss = { channel: {} }
    const channelContent = channelMatch[1]
    
    // Parse items
    const itemMatches = channelContent.match(/<item[^>]*>([\s\S]*?)<\/item>/gi)
    if (itemMatches) {
      result.rss.channel.item = itemMatches.map(item => {
        const itemObj: any = {}
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
        if (titleMatch) itemObj.title = titleMatch[1].trim()
        
        const linkMatch = item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
        if (linkMatch) itemObj.link = linkMatch[1].trim()
        
        const descMatch = item.match(/<description[^>]*>([\s\S]*?)<\/description>/i)
        if (descMatch) itemObj.description = descMatch[1].trim()
        
        const pubDateMatch = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)
        if (pubDateMatch) itemObj.pubDate = pubDateMatch[1].trim()
        
        const authorMatch = item.match(/<author[^>]*>([\s\S]*?)<\/author>/i)
        if (authorMatch) itemObj.author = authorMatch[1].trim()
        
        return itemObj
      })
    }
  }
  
  // Parse Atom format
  const feedMatch = xml.match(/<feed[^>]*>([\s\S]*?)<\/feed>/i)
  if (feedMatch) {
    result.feed = {}
    const feedContent = feedMatch[1]
    
    // Parse entries
    const entryMatches = feedContent.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi)
    if (entryMatches) {
      result.feed.entry = entryMatches.map(entry => {
        const entryObj: any = {}
        const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
        if (titleMatch) entryObj.title = titleMatch[1].trim()
        
        const linkMatch = entry.match(/<link[^>]*href="([^"]*)"/i)
        if (linkMatch) entryObj.link = linkMatch[1].trim()
        
        const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)
        if (summaryMatch) entryObj.summary = summaryMatch[1].trim()
        
        const publishedMatch = entry.match(/<published[^>]*>([\s\S]*?)<\/published>/i)
        if (publishedMatch) entryObj.published = publishedMatch[1].trim()
        
        const authorMatch = entry.match(/<author[^>]*>([\s\S]*?)<\/author>/i)
        if (authorMatch) entryObj.author = authorMatch[1].trim()
        
        return entryObj
      })
    }
  }
  
  return result
}

export async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const text = await response.text()
    const result = parseXML(text)
    
    // Handle different RSS formats
    let items: any[] = []
    
    if (result.rss && result.rss.channel && result.rss.channel.item) {
      items = Array.isArray(result.rss.channel.item) ? result.rss.channel.item : [result.rss.channel.item]
    } else if (result.feed && result.feed.entry) {
      items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry]
    }

    return items.map((item) => ({
      title: item.title || item['dc:title'] || '',
      company: item.company || item.author || item['dc:creator'] || 'Unknown Company',
      location: item.location || item.city || 'Remote',
      description: item.description || item.summary || item.content || '',
      url: item.link || item.url || '',
      postedDate: item.pubDate || item.published || item.updated || new Date().toISOString(),
      salary: item.salary || '',
      type: item.type || item.employmentType || 'Full-time'
    }))
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    return []
  }
}

// Alternative RSS parser using regex for simple cases
export async function parseRSSFeedSimple(url: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`)
    }

    const text = await response.text()
    const items: RSSItem[] = []
    
    // Simple regex-based parsing for common RSS elements
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    
    const regex = text.includes('<item>') ? itemRegex : entryRegex
    let match
    
    while ((match = regex.exec(text)) !== null) {
      const itemContent = match[1]
      
      const title = extractContent(itemContent, 'title') || extractContent(itemContent, 'dc:title') || ''
      const company = extractContent(itemContent, 'company') || extractContent(itemContent, 'author') || extractContent(itemContent, 'dc:creator') || 'Unknown Company'
      const location = extractContent(itemContent, 'location') || extractContent(itemContent, 'city') || 'Remote'
      const description = extractContent(itemContent, 'description') || extractContent(itemContent, 'summary') || extractContent(itemContent, 'content') || ''
      const url = extractContent(itemContent, 'link') || extractContent(itemContent, 'url') || ''
      const postedDate = extractContent(itemContent, 'pubDate') || extractContent(itemContent, 'published') || extractContent(itemContent, 'updated') || new Date().toISOString()
      const salary = extractContent(itemContent, 'salary') || ''
      const type = extractContent(itemContent, 'type') || extractContent(itemContent, 'employmentType') || 'Full-time'
      
      items.push({
        title,
        company,
        location,
        description,
        url,
        postedDate,
        salary,
        type
      })
    }
    
    return items
  } catch (error) {
    console.error('Error parsing RSS feed (simple):', error)
    return []
  }
}

function extractContent(content: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}

// Mock RSS data for development/testing
export function getMockRSSData(): RSSItem[] {
  return []
}
