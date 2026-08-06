import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

const SettingsContext = createContext({})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({})

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => setSettings(res.data || {}))
      .catch(() => {})
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
