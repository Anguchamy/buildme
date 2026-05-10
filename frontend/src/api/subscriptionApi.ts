import api from './axios'
import type { Subscription } from '../types'

export interface InitiateUpgradeResponse {
  orderId: string
  keyId: string
  amount: number
  currency: string
  planType: string
  workspaceId: number
}

export interface VerifyPaymentPayload {
  orderId: string
  paymentId: string
  signature: string
  workspaceId: number
  planType: string
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
