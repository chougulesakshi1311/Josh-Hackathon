import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { exportDashboardReport, getBias, getDashboard, getHistory } from '../services/api'

const EMPTY_STATS = {
  total_applications: 0,
  approval_rate: 0,
  avg_credit_score: 0,
  rejection_rate: 0,
  review_rate: 0,
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function Toast({ status, message, onDismiss }) {
  if (!message) return null

  const tone =
    status === 'error'
      ? 'bg-error-container/60 border-error/30 text-on-error-container'
      : 'bg-secondary-container/60 border-secondary/20 text-on-secondary-container'

  return (
    <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button className="text-xs font-bold uppercase tracking-wider" onClick={onDismiss}>
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [biasData, setBiasData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState({ status: '', message: '' })

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [dashboardData, historyData, biasResult] = await Promise.all([
          getDashboard(),
          getHistory(),
          getBias('30d').catch(() => null),
        ])

        if (cancelled) return
        setData(dashboardData)
        setHistory(historyData)
        setBiasData(biasResult)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExportReport() {
    setExporting(true)
    setToast({ status: '', message: '' })

    try {
      const { blob, filename } = await exportDashboardReport()
      downloadBlob(blob, filename)
      setToast({ status: 'success', message: t('downloadedSuccess') })
    } catch (e) {
      setToast({ status: 'error', message: e.message || t('exportFailed') })
    } finally {
      setExporting(false)
    }
  }

  const stats = data || EMPTY_STATS
  const totalC = 251.2
  const reviewPct = stats.review_rate || 0
  const rejectPct = stats.rejection_rate || 0
  const approvePct = stats.approval_rate || 0

  const offsetApprove = totalC * (1 - (reviewPct + rejectPct + approvePct) / 100)
  const offsetReject = totalC * (1 - (reviewPct + rejectPct) / 100)
  const offsetReview = totalC * (1 - reviewPct / 100)

  const DECISION_LABEL = { Approved: t('approved'), Rejected: t('rejected'), Review: t('manualReview') }

  const recentLogs = history.slice(0, 3).map((app) => {
    const decision = app.prediction?.decision
    const id = app._id?.slice(-4) || 'N/A'
    let icon = 'history'
    let bg = 'bg-primary/10'
    let text = 'text-primary'
    let border = 'border-primary/20'

    if (decision === 'Approved') {
      icon = 'verified'
      bg = 'bg-secondary/10'
      text = 'text-secondary'
      border = 'border-secondary/20'
    }
    if (decision === 'Rejected') {
      icon = 'gavel'
      bg = 'bg-error/10'
      text = 'text-error'
      border = 'border-error/20'
    }

    return {
      id: app._id,
      icon,
      bg,
      text,
      border,
      title: `${t('caseLabel')} #${id} — ${DECISION_LABEL[decision] || decision || t('unknown')}`,
      desc: app.prediction?.explanations?.[0] || t('viewFullDetails'),
    }
  })

  return (
    <div className="bg-surface font-sans text-on-surface antialiased">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Navbar />

        <section className="p-8 space-y-8 max-w-[1440px] mx-auto w-full">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
                {t('execOverview')}
              </h2>
              <p className="text-on-surface-variant font-sans">
                {t('execSubtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportReport}
                disabled={exporting}
                className="bg-surface-container-lowest text-primary font-semibold px-6 py-2.5 rounded-xl text-sm ambient-shadow hover:bg-surface-container hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting && (
                  <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                )}
                {exporting ? t('generating') : t('exportReport')}
              </button>
              <button
                onClick={() => (window.location.href = '/evaluation')}
                className="bg-gradient-to-r from-[#003ec7] to-[#0052ff] text-white font-semibold px-6 py-2.5 rounded-xl text-sm ambient-shadow hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                {t('newEvaluation')}
              </button>
            </div>
          </div>

          <Toast
            status={toast.status}
            message={toast.message}
            onDismiss={() => setToast({ status: '', message: '' })}
          />

          {error && (
            <div className="bg-error-container/40 border border-error/20 text-on-error-container text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="analytics"
              iconBg="bg-primary-fixed"
              iconColor="text-primary"
              label={t('totalApplications')}
              value={loading ? '-' : stats.total_applications.toLocaleString()}
            />
            <StatCard
              icon="check_circle"
              iconBg="bg-secondary-container"
              iconColor="text-on-secondary-container"
              label={t('approvalRate')}
              value={loading ? '-' : `${stats.approval_rate}%`}
              valueColor="text-[#15803d]"
            />
            <StatCard
              icon="cancel"
              iconBg="bg-error-container"
              iconColor="text-on-error-container"
              label={t('rejectionRate')}
              value={loading ? '-' : `${stats.rejection_rate}%`}
              valueColor="text-[#EF4444]"
            />
            <StatCard
              icon="speed"
              iconBg="bg-primary-fixed-dim"
              iconColor="text-on-primary-fixed-variant"
              label={t('avgCreditScore')}
              value={loading ? '-' : stats.avg_credit_score}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Row 1: Distribution & Splits */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 relative overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-500">
              <div className="flex justify-between items-center mb-10">
                <div className="w-full">
                  <h4 className="font-headline font-bold text-[#0052ff] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-primary/10 w-full pb-2">{t('riskStratification')}</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold font-headline text-on-surface">{t('creditScoreDistribution')}</h4>
                      <p className="text-sm text-on-surface-variant">{t('scoreDistSubtitle')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-64 flex items-end justify-around gap-2 px-2 mt-auto">
                {[20, 40, 60, 80, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="w-3/4 max-w-[80px] bg-surface-container-low rounded-t-lg relative group"
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute inset-0 bg-primary opacity-20 rounded-t-lg" />
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all group-hover:opacity-90"
                      style={{ height: `${Math.min(h + 15, 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-around mt-4 text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-tighter">
                {['300-579', '580-669', '670-739', '740-799', '800-850', '850+'].slice(0, 6).map((label, idx) => (
                  <span key={label} className="w-3/4 max-w-[80px] text-center">{label}</span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 flex flex-col items-center text-center h-full hover:shadow-xl transition-all duration-500">
              <h4 className="font-headline font-bold text-[#15803d] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-success/10 w-full pb-2">{t('intelligenceSplit')}</h4>
              <h4 className="text-xl font-bold font-headline mb-2 text-on-surface">{t('portfolioSplit')}</h4>
              <p className="text-sm text-on-surface-variant mb-8">
                {t('portfolioSubtitle')}
              </p>
              <div className="relative w-48 h-48 mb-8 mt-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-surface-container-low" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="12" />
                  <circle className="text-secondary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetApprove} strokeLinecap="round" strokeWidth="12" />
                  <circle className="text-error" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetReject} strokeLinecap="round" strokeWidth="12" />
                  <circle className="text-primary-fixed-dim" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetReview} strokeLinecap="round" strokeWidth="12" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold font-headline leading-none">
                    {loading ? '-' : stats.total_applications >= 1000 ? `${(stats.total_applications / 1000).toFixed(1)}k` : stats.total_applications}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">{t('total')}</span>
                </div>
              </div>
              <div className="w-full space-y-4 mb-auto">
                {[
                  { color: 'bg-secondary', label: t('approved'), value: `${stats.approval_rate}%` },
                  { color: 'bg-error', label: t('rejected'), value: `${stats.rejection_rate}%` },
                  { color: 'bg-primary-fixed-dim', label: t('manualReview'), value: `${stats.review_rate}%` },
                ].map(({ color, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span className="text-on-surface-variant font-bold">{label}</span>
                    </div>
                    <span className="font-black text-on-surface">{loading ? '-' : value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            {/* Row 2: Analysis & Logs */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 flex flex-col h-full hover:shadow-xl transition-all duration-500">
              <div className="flex justify-between items-center mb-8">
                <div className="w-full">
                  <h4 className="font-headline font-bold text-[#15803d] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-success/10 w-full pb-2">{t('fairnessEngine')}</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xl font-bold font-headline text-on-surface">{t('biasFairnessAnalysis')}</h4>
                      <p className="text-sm text-on-surface-variant">{t('incomeSubtitle')}</p>
                    </div>
                    <a href="/bias" className="text-primary text-xs font-bold flex items-center gap-1 group">
                      {t('viewAudit')}
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="space-y-6 mt-auto mb-auto">
                {biasData?.income_groups?.length > 0 ? (
                  [...biasData.income_groups].reverse().map(({ range, approval_rate }) => {
                    const pct = Math.round(approval_rate * 100)
                    const isLow = pct < 60
                    return (
                      <div key={range} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-on-surface font-semibold">₹{range}</span>
                          <span className={`font-black ${isLow ? 'text-error' : 'text-secondary'}`}>{pct}{t('approvalLabel')}</span>
                        </div>
                        <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-error' : 'bg-secondary'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-on-surface-variant text-center py-4">{t('noBiasData')}</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 hover:shadow-xl transition-all duration-500 flex flex-col h-full">
              <h4 className="font-headline font-bold text-[#003ec7] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-primary/10 w-full pb-2">{t('transparencyLogs')}</h4>
              <h4 className="text-xl font-bold font-headline mb-6 text-on-surface">{t('explainabilityLogs')}</h4>
              <div className="space-y-6 overflow-y-auto pr-2 mt-auto mb-auto">
                {recentLogs.length > 0 ? (
                  recentLogs.map(({ id, icon, bg, text, border, title, desc }) => (
                    <div key={id || title} className="flex gap-4 p-3 -mx-2 rounded-xl hover:bg-surface-container-low/80 transition-all duration-300 group cursor-pointer" onClick={() => (window.location.href = '/reports')}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${text} ${border} border flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm shadow-black/5`}>
                        <span className={`material-symbols-outlined text-2xl font-black`}>{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">{title}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">{desc}</p>
                        <div className="flex items-center gap-1 mt-2.5">
                           <span className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">{t('inspectAITrace')}</span>
                           <span className="material-symbols-outlined text-[10px] text-primary">analytics</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant font-medium">
                    {t('noEvaluations')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto px-8 py-6 border-t border-outline-variant/10 flex justify-between items-center text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
          <span>{t('copyright')}</span>
          <div className="flex gap-6">
            <a className="hover:text-primary transition-colors" href="#">{t('privacyPolicy')}</a>
            <a className="hover:text-primary transition-colors" href="#">{t('termsOfService')}</a>
            <a className="hover:text-primary transition-colors" href="#">{t('auditLogs')}</a>
          </div>
        </footer>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = 'text-on-surface',
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="relative z-10">
        <div className="mb-4">
          <div className={`p-2.5 ${iconBg} rounded-xl ${iconColor} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm inline-flex mb-4`}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.15em] mb-1 opacity-70">{label}</p>
          <h3 className={`text-3xl font-black font-headline leading-none tracking-tighter ${valueColor}`}>{value}</h3>
        </div>
      </div>
    </div>
  )
}
