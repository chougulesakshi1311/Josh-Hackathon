import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', name: 'English', script: 'EN' },
  { code: 'hi', name: 'हिन्दी', script: 'HI' },
  { code: 'ta', name: 'தமிழ்', script: 'TA' },
  { code: 'te', name: 'తెలుగు', script: 'TE' },
  { code: 'mr', name: 'मराठी', script: 'MR' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentCode = (i18n.language || 'en').split('-')[0]
  const current = LANGUAGES.find(l => l.code === currentCode) || LANGUAGES[0]

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container border border-outline-variant/20 hover:border-primary/20 transition-all group"
      >
        <span className="material-symbols-outlined text-base text-on-surface-variant group-hover:text-primary transition-colors">language</span>
        <span className="text-xs font-bold text-on-surface">{current.name}</span>
        <span className={`material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/15 overflow-hidden z-50 animate-fade-in">
          {LANGUAGES.map(({ code, name, script }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors text-left ${
                code === currentCode ? 'bg-primary/8 text-primary font-bold' : 'text-on-surface font-medium'
              }`}
            >
              <span className={`text-[10px] font-black w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                code === currentCode ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
              }`}>
                {script}
              </span>
              {name}
              {code === currentCode && (
                <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
