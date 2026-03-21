import api from './axios'
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api
      .post<AuthResponse>('/auth/refresh', null, {
        headers: { 'X-Refresh-Token': refreshToken },
      })
      .then((r) => r.data),

  logout: (refreshToken?: string) =>
    api
      .post('/auth/logout', null, {
        headers: refreshToken ? { 'X-Refresh-Token': refreshToken } : {},
      })
      .then((r) => r.data),
}
