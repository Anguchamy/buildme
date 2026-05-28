import { useEffect, useState } from 'react'
import api from '@/api/axios'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function AuthenticatedImage({ src, alt, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const isPublic = src.startsWith('http://') || src.startsWith('https://')

  useEffect(() => {
    if (isPublic) return
    let url: string
    api.get(src, { responseType: 'blob' }).then((res) => {
      url = URL.createObjectURL(res.data)
      setObjectUrl(url)
    }).catch(() => setObjectUrl(null))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [src, isPublic])

  if (isPublic) return <img src={src} alt={alt} className={className} />
  if (!objectUrl) return <div className={className} />
  return <img src={objectUrl} alt={alt} className={className} />
}
