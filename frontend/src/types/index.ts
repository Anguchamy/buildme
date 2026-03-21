export enum Platform {
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  YOUTUBE = 'YOUTUBE',
  PINTEREST = 'PINTEREST',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
  AGENCY = 'AGENCY',
}

export enum MediaSource {
  UPLOAD = 'UPLOAD',
  PINTEREST = 'PINTEREST',
  URL = 'URL',
}

export enum ScheduledPostStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: number
  email: string
  fullName: string
  avatarUrl?: string
  provider: string
  emailVerified: boolean
  createdAt: string
}

export interface Workspace {
  id: number
  name: string
  slug: string
  description?: string
  logoUrl?: string
  ownerId: number
  ownerName: string
  planType: PlanType
  createdAt: string
}

export interface MediaAsset {
  id: number
  fileName: string
  originalName?: string
  contentType?: string
  fileSize?: number
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  durationSeconds?: number
  source: MediaSource
  externalId?: string
  createdAt: string
}

export interface Post {
  id: number
  workspaceId: number
  authorId: number
  authorName: string
  caption?: string
  status: PostStatus
  scheduledAt?: string
  publishedAt?: string
  platforms: string[]
  gridPosition?: number
  notes?: string
  mediaAssets: MediaAsset[]
  createdAt: string
  updatedAt: string
}

export interface SocialAccount {
  id: number
  workspaceId: number
  platform: Platform
  accountId: string
  handle?: string
  displayName?: string
  connected: boolean
  tokenExpiresAt?: string
  createdAt: string
}

export interface Analytics {
  id: number
  postId?: number
  workspaceId: number
  platform: Platform
  metricDate: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  clicks: number
  profileVisits: number
  follows: number
  engagementRate: number
}

export interface ScheduledPost {
  id: number
  postId: number
  platform: Platform
  socialAccountId?: number
  status: ScheduledPostStatus
  scheduledTime: string
  publishedTime?: string
  externalPostId?: string
  errorMessage?: string
  retryCount: number
  createdAt: string
}

export interface Subscription {
  id: number
  workspaceId: number
  planType: PlanType
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  seats: number
  monthlyPostLimit: number
  postsUsedThisMonth: number
}

export interface HashtagSet {
  id: number
  workspaceId: number
  name: string
  hashtags: string[]
  platform?: Platform
  useCount: number
  createdAt: string
}

// API Request types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface CreatePostRequest {
  caption?: string
  platforms: string[]
  status?: PostStatus
  scheduledAt?: string
  mediaAssetIds?: number[]
  gridPosition?: number
  notes?: string
}

export interface SchedulePostRequest {
  scheduledAt: string
  platforms?: string[]
}

export interface GenerateCaptionRequest {
  topic: string
  tone?: string
  platform?: Platform
  includeHashtags?: boolean
  includeEmojis?: boolean
}

// API Response types
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface AICaptionResponse {
  captions: string[]
  suggestedHashtags: string[]
  bestTimeToPost?: string
}

export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
  fieldErrors?: Record<string, string>
}
