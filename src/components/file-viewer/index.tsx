// @ts-nocheck
'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, X, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileViewerProps {
  url: string
  fileName: string
  mimeType: string | null
  onClose: () => void
  onDownload: () => void
}

export function FileViewer({ url, fileName, mimeType, onClose, onDownload }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [scale, setScale] = useState(100)

  const isPdf = mimeType?.includes('pdf')
  const isImage = mimeType?.startsWith('image/')
  const isOffice = mimeType?.includes('word') ||
                   mimeType?.includes('spreadsheet') ||
                   mimeType?.includes('presentation') ||
                   mimeType?.includes('msword') ||
                   mimeType?.includes('ms-excel') ||
                   mimeType?.includes('ms-powerpoint') ||
                   mimeType?.includes('officedocument') ||
                   fileName.endsWith('.docx') ||
                   fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.pptx') ||
                   fileName.endsWith('.doc') ||
                   fileName.endsWith('.xls') ||
                   fileName.endsWith('.ppt')

  const zoomIn = () => setScale(prev => Math.min(prev + 25, 200))
  const zoomOut = () => setScale(prev => Math.max(prev - 25, 50))

  // Office Online Viewer URL
  const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`

  // Google Docs Viewer (backup for Office)
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 border-b border-zinc-700">
        <div className="flex items-center gap-4">
          <h3 className="font-medium truncate max-w-md text-white">{fileName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {(isPdf || isImage) && (
            <>
              <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 50} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm w-16 text-center text-zinc-300">{scale}%</span>
              <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 200} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-zinc-600 mx-2" />
            </>
          )}
          {isOffice && (
            <>
              <Button variant="ghost" size="sm" onClick={() => window.open(officeViewerUrl, '_blank')} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
                <ExternalLink className="h-4 w-4 mr-2" />
                새 탭
              </Button>
              <div className="w-px h-6 bg-zinc-600 mx-2" />
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onDownload} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
            <Download className="h-4 w-4 mr-2" />
            다운로드
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {isPdf && (
          <iframe
            src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            className="bg-white rounded-lg shadow-2xl"
            style={{
              width: `${scale}%`,
              height: '100%',
              maxWidth: '100%',
            }}
            title={fileName}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isImage && (
          <img
            src={url}
            alt={fileName}
            className="max-h-full object-contain rounded-lg shadow-2xl transition-transform"
            style={{
              transform: `scale(${scale / 100})`,
            }}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {isOffice && (
          <iframe
            src={officeViewerUrl}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
            title={fileName}
            onLoad={() => setIsLoading(false)}
          />
        )}

        {!isPdf && !isImage && !isOffice && (
          <div className="text-center text-white">
            <p className="mb-4">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
