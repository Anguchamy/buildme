import { useEffect, useState } from 'react'
import api from '@/api/axios'

interface Props {
  src: string
  alt?: string
  className?: string
}

export default function AuthenticatedImage({ src, alt, className }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    let url: string
    api.get(src, { responseType: 'blob' }).then((res) => {
      url = URL.createObjectURL(res.data)
      setObjectUrl(url)
    }).catch(() => setObjectUrl(null))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [src])

  if (!objectUrl) return <div className={className} />
  return <img src={objectUrl} alt={alt} className={className} />
}
