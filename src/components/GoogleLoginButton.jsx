import { useEffect, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Muat script Google Identity Services satu kali (dipakai bersama semua instance)
let gsiPromise = null
function loadGsi() {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Gagal memuat Google Sign-In'))
    document.head.appendChild(s)
  })
  return gsiPromise
}

/**
 * Tombol "Masuk dengan Google" (Google Identity Services).
 * onCredential(credential) dipanggil dengan ID token saat login berhasil.
 * text: 'signin_with' | 'signup_with' | 'continue_with'
 * Tidak merender apa pun bila VITE_GOOGLE_CLIENT_ID belum diset.
 */
export default function GoogleLoginButton({ onCredential, text = 'continue_with' }) {
  const ref = useRef(null)
  const cbRef = useRef(onCredential)

  useEffect(() => {
    cbRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadGsi()
      .then(() => {
        if (cancelled || !window.google || !ref.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => resp?.credential && cbRef.current?.(resp.credential),
        })
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text,
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(ref.current.offsetWidth || 360, 400),
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  if (!CLIENT_ID) return null

  return <div ref={ref} className="flex w-full justify-center" />
}
