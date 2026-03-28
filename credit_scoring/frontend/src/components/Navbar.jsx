import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const email = localStorage.getItem('user_email') || 'Senior Analyst'
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/reports?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="flex justify-between items-center px-8 bg-[#f8f9fa]/70 backdrop-blur-xl w-full h-16 sticky top-0 z-50 shadow-[0_12px_32px_-4px_rgba(0,76,237,0.06)]">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-high px-3 py-1.5 pl-9 rounded-full text-xs focus:ring-2 focus:ring-primary/20 border-none outline-none"
            placeholder="Search applications, reports..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-all">
          notifications
        </span>

        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">{email}</p>
            <p className="text-[10px] text-on-surface-variant">Senior Credit Analyst</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm border border-white">
            {email.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
