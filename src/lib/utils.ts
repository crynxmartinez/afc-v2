import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isAfter, isBefore } from 'date-fns'

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Format date to readable format (e.g., "Dec 25, 2024")
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy')
}

// Format date with time (e.g., "Dec 25, 2024 at 3:00 PM")
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
}

// Get contest status from dates
export function getContestStatus(
  startDate: string | Date,
  endDate: string | Date,
  finalizedAt: string | Date | null
): 'upcoming' | 'active' | 'ended' | 'finalized' {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (finalizedAt) return 'finalized'
  if (isBefore(now, start)) return 'upcoming'
  if (isAfter(now, end)) return 'ended'
  return 'active'
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'badge-warning'
    case 'active':
      return 'badge-success'
    case 'ended':
      return 'badge-gray'
    case 'finalized':
      return 'badge-primary'
    case 'approved':
      return 'badge-success'
    case 'pending':
      return 'badge-warning'
    case 'rejected':
      return 'badge-danger'
    case 'draft':
      return 'badge-gray'
    default:
      return 'badge-gray'
  }
}

// Format number with commas (e.g., 1,234,567)
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

// Format number to compact form (e.g., 1.2K, 3.4M)
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate username format (alphanumeric, underscores, 3-20 chars)
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

// Get file extension
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

// Check if file is an image
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const ext = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(ext)
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  // Level thresholds from database
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000]
  
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      return i + 1
    }
  }
  return 1
}

// Calculate XP progress to next level
export function calculateLevelProgress(xp: number): { current: number; next: number; progress: number } {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000]
  const level = calculateLevel(xp)
  
  if (level >= 20) {
    return { current: thresholds[19], next: thresholds[19], progress: 100 }
  }
  
  const current = thresholds[level - 1]
  const next = thresholds[level]
  const progress = ((xp - current) / (next - current)) * 100
  
  return { current, next, progress: Math.min(progress, 100) }
}

// Get level title
export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Newcomer',
    2: 'Beginner',
    3: 'Apprentice',
    4: 'Artist',
    5: 'Skilled Artist',
    6: 'Expert',
    7: 'Master',
    8: 'Grand Master',
    9: 'Legend',
    10: 'Champion',
    11: 'Elite',
    12: 'Virtuoso',
    13: 'Prodigy',
    14: 'Maestro',
    15: 'Legendary',
    16: 'Mythic',
    17: 'Divine',
    18: 'Immortal',
    19: 'Transcendent',
    20: 'Ultimate',
  }
  return titles[level] || 'Unknown'
}

// Get placement suffix (1st, 2nd, 3rd, etc.)
export function getPlacementSuffix(placement: number): string {
  if (placement === 1) return '1st'
  if (placement === 2) return '2nd'
  if (placement === 3) return '3rd'
  return `${placement}th`
}

// Get placement emoji
export function getPlacementEmoji(placement: number): string {
  if (placement === 1) return '🏆'
  if (placement === 2) return '🥈'
  if (placement === 3) return '🥉'
  return ''
}
