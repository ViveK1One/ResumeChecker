import type { ResumeDraftContent } from './types'
import { applyHeuristicOnePage } from './onePage'

export function getPreviewContent(
  content: ResumeDraftContent,
  mode: 'full' | 'onePage'
): ResumeDraftContent {
  if (mode === 'onePage') {
    return applyHeuristicOnePage(content)
  }
  return content
}
