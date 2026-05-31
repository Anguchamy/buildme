import { useEffect, useState } from 'react'
import api from '@/api/axios'

interface Props {
  src: string
  alt?: string
  className?: string
}

/**
 * Loads an image via the authenticated backend proxy.
 *
 * History: we used to detect http(s) URLs and load them directly via the
 * browser, which worked when MediaAsset.url was a public CDN URL but broke
 * for R2 presigned URLs (CORS quirks, axios redirect-with-bearer problems,
 * and IG-side ingestion failures masked as success). It's simpler and more
 * reliable to always fetch through `/api/workspaces/{w}/media/{id}/file`
 * which the backend now streams as raw bytes from R2 — same auth as every
 * other request, no CORS surprises.
 *
 * Accepts either a relative `/workspaces/.../file` path (preferred) OR an
 * absolute URL (still passed through for non-asset cases like avatars).
 */
export default function AuthenticatedImage({ src, alt, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    setObjectUrl(null)
    let url: string | undefined
    let cancelled = false
    api.get(src, { responseType: 'blob' }).then((res) => {
      if (cancelled) return
      url = URL.createObjectURL(res.data)
      setObjectUrl(url)
    }).catch(() => {
      if (!cancelled) setFailed(true)
    })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [src])

  if (failed) {
    // Render a transparent placeholder so layout doesn't collapse; the parent
    // container's background shows through (matches the dark surface tiles).
    return <div className={className} />
  }
  if (!objectUrl) return <div className={className} />
  return <img src={objectUrl} alt={alt} className={className} />
}
