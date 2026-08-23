import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export async function generatePreview(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(1)

  const scale = 2
  const viewport = page.getViewport({ scale })

  // Disegniamo l'intera prima pagina su un canvas temporaneo
  const fullCanvas = document.createElement('canvas')
  fullCanvas.width = viewport.width
  fullCanvas.height = viewport.height
  const fullContext = fullCanvas.getContext('2d')

  await page.render({ canvasContext: fullContext, viewport }).promise

  // Ritagliamo la striscia centrale: 100% larghezza, 20% altezza
  const cropHeight = viewport.height * 0.2
  const cropY = (viewport.height - cropHeight) / 2

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = viewport.width
  cropCanvas.height = cropHeight
  const cropContext = cropCanvas.getContext('2d')

  cropContext.drawImage(
    fullCanvas,
    0, cropY, viewport.width, cropHeight,
    0, 0, viewport.width, cropHeight
  )

  return new Promise((resolve) => {
    cropCanvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}