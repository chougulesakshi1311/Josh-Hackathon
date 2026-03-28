import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { logoutUser } from '../services/api'

export default function Sidebar() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const navItems = [
    { to: '/dashboard', icon: 'dashboard', label: t('dashboard') },
    { to: '/evaluation', icon: 'add_chart', label: t('newEvaluation') },
    { to: '/bias', icon: 'equalizer', label: t('biasFairness') },
    { to: '/reports', icon: 'description', label: t('reports') },
  ]

  const handleLogout = () => {
    logoutUser()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 bg-[#f3f4f5] dark:bg-slate-900 w-64 z-50">
      {/* Brand */}
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold tracking-tighter text-[#191c1d] dark:text-white font-headline">
          Credit AI
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold opacity-60">
          {t('tagline')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-3 text-[#0052FF] dark:text-blue-400 font-extrabold bg-[#ffffff] dark:bg-slate-800 rounded-lg shadow-sm font-headline text-sm tracking-tighter transform scale-[1.02] transition-all duration-300'
                : 'flex items-center gap-3 px-4 py-3 text-[#434656] dark:text-slate-400 hover:text-[#191c1d] hover:bg-[#e7e8e9] dark:hover:bg-slate-800 transition-all duration-300 hover:translate-x-1 font-headline text-sm font-bold tracking-tighter rounded-lg'
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer links */}
      <div className="mt-auto space-y-1 pt-4 border-t border-outline-variant/10">
        {/* <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-[#434656] dark:text-slate-400 hover:text-[#191c1d] hover:bg-[#e7e8e9] transition-colors rounded-lg font-headline text-sm font-semibold"
        >
          <span className="material-symbols-outlined">help</span>
          <span>Help Center</span>
        </a> */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-[#434656] dark:text-slate-400 hover:text-error hover:bg-error-container/20 transition-all duration-300 hover:translate-x-1 rounded-lg font-headline text-sm font-bold group"
        >
          <span className="material-symbols-outlined group-hover:text-error transition-colors">logout</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  )
}
