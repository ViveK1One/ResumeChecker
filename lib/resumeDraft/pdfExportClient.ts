'use client'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const CANVAS_SCALE = 3

function rectRelativeToRoot(anchor: HTMLElement, root: HTMLElement) {
  const rr = root.getBoundingClientRect()
  const ar = anchor.getBoundingClientRect()
  return {
    left: ar.left - rr.left + root.scrollLeft,
    top: ar.top - rr.top + root.scrollTop,
    width: ar.width,
    height: ar.height,
  }
}

/** Rasterize resume preview + overlay clickable PDF links. Higher scale = sharper text. */
export async function downloadResumePdfFromElement(element: HTMLElement, fileName: string) {
  const canvas = await html2canvas(element, {
    scale: CANVAS_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png', 1)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > -1) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  const numPages = pdf.getNumberOfPages()
  const contentW = Math.max(element.scrollWidth, element.offsetWidth, 1)
  const contentH = Math.max(element.scrollHeight, element.offsetHeight, 1)

  const anchors = element.querySelectorAll<HTMLAnchorElement>('a[href]')
  anchors.forEach((a) => {
    let href = a.getAttribute('href')?.trim()
    if (!href || href === '#' || href.startsWith('javascript:')) return
    if (!href.startsWith('http') && !href.startsWith('mailto:')) {
      href = `https://${href}`
    }

    const r = rectRelativeToRoot(a, element)
    const topMm = (r.top / contentH) * imgHeight
    const leftMm = (r.left / contentW) * imgWidth
    const wMm = Math.max((r.width / contentW) * imgWidth, 1)
    const hMm = Math.max((r.height / contentH) * imgHeight, 0.5)

    for (let p = 0; p < numPages; p++) {
      const pageTop = p * pageHeight
      const pageBottom = (p + 1) * pageHeight
      const linkTop = topMm
      const linkBottom = topMm + hMm
      const y0 = Math.max(linkTop, pageTop)
      const y1 = Math.min(linkBottom, pageBottom)
      if (y0 >= y1 - 0.01) continue
      const localY = y0 - pageTop
      const localH = y1 - y0
      pdf.setPage(p + 1)
      try {
        pdf.link(leftMm, localY, wMm, localH, { url: href })
      } catch {
        /* ignore bad link coords */
      }
    }
  })

  pdf.save(fileName)
}
