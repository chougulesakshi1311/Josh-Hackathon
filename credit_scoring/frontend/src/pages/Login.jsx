import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loginUser, signupUser } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await loginUser(form)
      } else {
        await signupUser(form)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-soft min-h-screen font-body text-on-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-[2rem] overflow-hidden ambient-shadow">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary-container relative overflow-hidden text-on-primary-container">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <span className="material-symbols-outlined text-4xl">account_balance</span>
              <span className="font-headline font-extrabold text-2xl tracking-tighter">
                {t('appTitle')}
              </span>
            </div>
            <h1 className="font-headline text-4xl font-extrabold leading-tight mb-6">
              {t('heroHeading').split('\n').map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h1>
            <p className="text-lg opacity-80 max-w-sm">
              {t('heroSubtitle')}
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="glass-effect p-6 rounded-xl border border-white/10">
              <p className="font-headline font-bold text-sm uppercase tracking-widest mb-2 text-white/60">
                {t('systemStatus')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary-fixed shadow-[0_0_10px_#6cf8bb]" />
                <span className="text-sm font-semibold">{t('allSystemsOk')}</span>
              </div>
            </div>
          </div>

          {/* Background texture */}
          <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent" />
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
            <span className="font-headline font-extrabold text-xl tracking-tighter text-on-surface">
              Credit AI
            </span>
          </div>

          <div className="mb-10">
            <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2">
              {mode === 'login' ? t('welcomeBack') : t('createAccount')}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {mode === 'login' ? t('loginSubtitle') : t('signupSubtitle')}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label className="font-label text-sm font-semibold text-on-surface pl-1" htmlFor="email">
                {t('workEmail')}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-4 bg-surface border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline-variant font-body"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-sm font-semibold text-on-surface" htmlFor="password">
                  {t('password')}
                </label>
                {mode === 'login' && (
                  <a className="text-xs font-bold text-primary hover:underline" href="#">
                    {t('forgot')}
                  </a>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-4 bg-surface border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all duration-200 outline-none placeholder:text-outline-variant font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-outline hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-error-container/40 border border-error/20 text-on-error-container text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full primary-gradient text-white py-4 rounded-xl font-headline font-bold text-base ambient-shadow hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    autorenew
                  </span>
                  {t('processing')}
                </>
              ) : (
                <>
                  {mode === 'login' ? t('signIn') : t('createAccount')}
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-8 text-center text-sm text-on-surface-variant">
            {mode === 'login' ? t('noAccount') + ' ' : t('haveAccount') + ' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-primary font-bold hover:underline"
            >
              {mode === 'login' ? t('signUp') : t('signInShort')}
            </button>
          </p>

          {/* SSO divider */}
          <div className="mt-10 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-outline">
                <span className="bg-surface-container-lowest px-4">{t('enterpriseSSO')}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-colors font-semibold text-sm text-on-surface">
                <span className="material-symbols-outlined text-sm text-outline">language</span>
                Google
              </button>
              <button className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-colors font-semibold text-sm text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-outline">key</span>
                Okta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-8 text-xs font-bold text-outline uppercase tracking-widest">
          <a className="hover:text-primary transition-colors" href="#">{t('privacyPolicy')}</a>
          <a className="hover:text-primary transition-colors" href="#">{t('termsOfService')}</a>
          <a className="hover:text-primary transition-colors" href="#">{t('securityAudit')}</a>
        </div>
        <p className="text-[10px] text-outline-variant font-medium uppercase tracking-[0.2em]">
          {t('copyright')}
        </p>
      </footer>
    </div>
  )
}
