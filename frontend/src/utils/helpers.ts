import { Platform } from '@/types'
import { format, parseISO } from 'date-fns'

export function formatDate(dateString: string, pattern = 'MMM d, yyyy HH:mm') {
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return dateString
  }
}

export function getPlatformColor(platform: Platform | string): string {
  const colors: Record<string, string> = {
    INSTAGRAM: '#E1306C',
    TIKTOK: '#010101',
    FACEBOOK: '#1877F2',
    TWITTER: '#1DA1F2',
    LINKEDIN: '#0A66C2',
    YOUTUBE: '#FF0000',
    PINTEREST: '#E60023',
  }
  return colors[platform] ?? '#6B7280'
}

export function getPlatformCharLimit(platform: Platform | string): number {
  const limits: Record<string, number> = {
    INSTAGRAM: 2200,
    TIKTOK: 2200,
    FACEBOOK: 63206,
    TWITTER: 280,
    LINKEDIN: 3000,
    YOUTUBE: 5000,
    PINTEREST: 500,
  }
  return limits[platform] ?? 2200
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function getPlatformIcon(platform: Platform | string): string {
  const icons: Record<string, string> = {
    INSTAGRAM: '📸',
    TIKTOK: '🎵',
    FACEBOOK: '👥',
    TWITTER: '🐦',
    LINKEDIN: '💼',
    YOUTUBE: '▶️',
    PINTEREST: '📌',
  }
  return icons[platform] ?? '📱'
}
