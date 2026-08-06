import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('vb_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('vb_token'))
      .finally(() => setLoading(false))
  }, [])

  const persist = (data) => {
    localStorage.setItem('vb_token', data.token)
    setUser(data.user)
  }

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    persist(res.data)
    return res.data.user
  }

  const adminLogin = async (username, password) => {
    const res = await api.post('/admin/login', { username, password })
    persist(res.data)
    return res.data.user
  }

  const register = async (payload) => {
    const res = await api.post('/register', payload)
    persist(res.data)
    return res.data.user
  }

  // Login/daftar via Google (SSO) — credential = ID token dari Google Identity Services
  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google', { credential })
    persist(res.data)
    return res.data.user
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('vb_token')
    setUser(null)
  }

  const updateUser = (u) => setUser(u)

  return (
    <AuthContext.Provider
      value={{ user, loading, login, adminLogin, register, loginWithGoogle, logout, updateUser, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
