'use client'

import Cropper, { Area } from 'react-easy-crop'
import { useCallback, useState } from 'react'

// Crop the selected area of an image to a square JPEG blob (client-side canvas).
async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  )
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9),
  )
}

export function ImageCropModal({
  src,
  onCancel,
  onCropped,
}: {
  src: string
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onComplete = useCallback((_: Area, areaPx: Area) => setAreaPixels(areaPx), [])

  const save = async () => {
    if (!areaPixels) return
    setBusy(true)
    try {
      onCropped(await getCroppedBlob(src, areaPixels))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900">Adjust your photo</h3>
          <p className="text-sm text-gray-500">Drag to position, slide to zoom.</p>
        </div>
        <div className="relative h-72 bg-gray-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="p-4 space-y-4">
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
            <button
              onClick={save}
              disabled={busy}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
