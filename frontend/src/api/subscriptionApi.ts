import api from './axios'
import type { Subscription } from '../types'

export interface InitiateUpgradeResponse {
  razorpaySubscriptionId: string
  keyId: string
}

export interface VerifyPaymentPayload {
  razorpayPaymentId: string
  razorpaySubscriptionId: string
  razorpaySignature: string
}

const subscriptionApi = {
  getSubscription: (workspaceId: number) =>
    api.get<Subscription>(`/subscriptions/${workspaceId}`).then(r => r.data),

  initiateUpgrade: (workspaceId: number, planType: string) =>
    api.post<InitiateUpgradeResponse>('/subscriptions/initiate', { workspaceId, planType }).then(r => r.data),

  verifyPayment: (payload: VerifyPaymentPayload) =>
    api.post<Subscription>('/subscriptions/verify', payload).then(r => r.data),

  cancelSubscription: (workspaceId: number) =>
    api.post<Subscription>(`/subscriptions/${workspaceId}/cancel`).then(r => r.data),
}

export default subscriptionApi
