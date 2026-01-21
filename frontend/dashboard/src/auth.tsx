import { Navigate, Outlet } from 'react-router-dom'

export const login = async (email: string, pass: string) => {
  // Simulate login
  // In a real app, this would hit the Go backend /api/login
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email) {
        localStorage.setItem('token', 'premium-token-' + Date.now())
        resolve({ email, token: localStorage.getItem('token') })
      } else {
        reject(new Error("Login failed"))
      }
    }, 800)
  })
}

export const logout = () => {
  localStorage.removeItem('token')
}

export function isAuthed(): boolean {
  return !!localStorage.getItem('token')
}

export function RequireAuth() {
  return isAuthed() ? <Outlet /> : <Navigate to="/login" replace />
}
