import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { LoginRequest, RegisterRequest } from '@/types'

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken)
      navigate('/app/dashboard')
    },
  })
}

export function useRegisterMutation() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => {
      login(data.user, data.accessToken, data.refreshToken)
      navigate('/app/dashboard')
    },
  })
}

export function useLogoutMutation() {
  const { logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? undefined),
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}
