import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

export function isAuthed(): boolean {
  return !!localStorage.getItem('token')
}

export function RequireAuth() {
  return isAuthed() ? <Outlet /> : <Navigate to="/login" replace />
}


