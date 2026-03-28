import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { exportAuditLog, getBias } from '../services/api'

const RANGE_OPTION_KEYS = [
  { value: '7d',  key: 'last7Days'  },
  { value: '30d', key: 'last30Days' },
  { value: '90d', key: 'last90Days' },
  { value: 'all', key: 'allTime'    },
]

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
  const tone = status === 'error'
    ? 'bg-error-container/60 border-error/30 text-on-error-container'
    : 'bg-secondary-container/60 border-secondary/20 text-on-secondary-container'
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button className="text-xs font-bold uppercase tracking-wider" onClick={onDismiss}>✕</button>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest p-4 rounded-xl shadow-xl border border-outline-variant/10 z-50">
        <p className="text-xs font-bold text-on-surface mb-2 tracking-widest uppercase">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-semibold text-on-surface">
              {entry.name}: {Number(entry.value).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// ── Metric Card ────────────────────────────────────────────────────────────────
function MetricCard({ icon, title, subtitle, value, unit, passed, description }) {
  const { t: tCard } = useTranslation()
  const isUnavailable = passed === null
  const colorClass   = isUnavailable ? 'text-on-surface-variant' : passed ? 'text-secondary' : 'text-error'
  const bgClass      = isUnavailable
    ? 'bg-surface-container border-outline-variant/20'
    : passed
      ? 'bg-secondary-container/20 border-secondary/20'
      : 'bg-error-container/20 border-error/20'
  const statusLabel  = isUnavailable ? tCard('unavailable') : passed ? tCard('passed') : tCard('flagged')
  const statusIcon   = isUnavailable ? 'help' : passed ? 'check_circle' : 'warning'

  return (
    <div className={`p-6 rounded-2xl border ambient-shadow flex flex-col gap-3 ${bgClass}`}>
      {/* top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-base ${colorClass}`}>{icon}</span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{subtitle}</p>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          isUnavailable
            ? 'border-outline-variant/30 text-on-surface-variant'
            : passed
              ? 'border-secondary/30 text-secondary bg-secondary/10'
              : 'border-error/30 text-error bg-error/10'
        }`}>
          <span className="material-symbols-outlined text-[11px]">{statusIcon}</span>
          {statusLabel}
        </span>
      </div>

      {/* metric */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-variant mb-0.5">{title}</h3>
        <p className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface">
          {value}<span className="text-base font-bold text-on-surface-variant ml-1">{unit}</span>
        </p>
      </div>

      {/* one-line hint */}
      <p className="text-[11px] text-on-surface-variant font-medium">{description}</p>
    </div>
  )
}

// ── Income Chart ───────────────────────────────────────────────────────────────
function IncomeChart({ data }) {
  const { t: tC } = useTranslation()
  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-70 mb-1">
          {tC('socioeconomicEquity')}
        </p>
        <h3 className="font-headline font-bold text-xl text-on-surface">{tC('incomeStratAudit')}</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          {tC('incomeChartDesc')}
        </p>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
              tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 600 }} />
            <Line type="monotone" dataKey="Approval Rate" name={tC('approvalRate')} stroke="#10B981" strokeWidth={4}
              dot={{ r: 6, fill: '#10B981', strokeWidth: 3, stroke: '#FFFFFF' }}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#059669' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Gender Chart ───────────────────────────────────────────────────────────────
function GenderChart({ data }) {
  const { t: tG } = useTranslation()
  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary opacity-70 mb-1">
          {tG('genderParityDiag')}
        </p>
        <h3 className="font-headline font-bold text-xl text-on-surface">{tG('demographicDisparity')}</h3>
        <p className="text-sm text-on-surface-variant mt-1">
          {tG('genderChartDesc')}
        </p>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: -20, bottom: 5 }} barSize={64}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
              tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
            <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 600 }} />
            <Bar dataKey="Approval Rate" name={tG('approvalRate')} radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={i === 0 ? '#0052FF' : '#8B5CF6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BiasFairness() {
  const { t } = useTranslation()
  const [selectedRange, setSelectedRange] = useState('30d')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast]       = useState({ status: '', message: '' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getBias(selectedRange)
        if (!cancelled) setData(res)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedRange])

  async function handleExport() {
    setExporting(true)
    setToast({ status: '', message: '' })
    try {
      const { blob, filename } = await exportAuditLog(selectedRange)
      downloadBlob(blob, filename)
      setToast({ status: 'success', message: t('auditExportSuccess') })
    } catch (e) {
      setToast({ status: 'error', message: e.message || t('exportFailed') })
    } finally {
      setExporting(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
            <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant animate-pulse">
              {t('runningFairnessAudit')}
            </p>
          </div>
        </main>
      </div>
    )
  }

  // ── Error ──
  if (error || !data || !data.gender || !data.income_groups) {
    return (
      <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 p-12 flex items-center justify-center">
            <div className="bg-error-container/20 p-8 rounded-2xl border border-error-container max-w-md text-center">
              <span className="material-symbols-outlined text-error text-5xl mb-4">gavel</span>
              <h2 className="font-headline font-bold text-xl mb-2">{t('dataUnavailable')}</h2>
              <p className="text-sm text-on-error-container/80 mb-6 font-medium">
                {error || t('biasApiError')}
              </p>
              <button onClick={() => window.location.reload()}
                className="bg-error text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition">
                {t('retry')}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Derived values ──
  const finalScore  = data.fairness_score || 0
  const dpd         = data.demographic_parity_diff   // null if fairlearn not installed
  const eod         = data.equalized_odds_diff        // null if fairlearn not installed

  const rates       = data.income_groups.map(g => g.approval_rate)
  const incomeGap   = rates.length
    ? ((Math.max(...rates) - Math.min(...rates)) * 100).toFixed(0)
    : 0

  const male   = data.gender?.male   || { approved: 0, total: 0 }
  const female = data.gender?.female || { approved: 0, total: 0 }
  const maleRate   = male.total   > 0 ? (male.approved   / male.total)   * 100 : 0
  const femaleRate = female.total > 0 ? (female.approved / female.total) * 100 : 0

  const genderData = [
    { name: t('male'),   'Approval Rate': maleRate   },
    { name: t('female'), 'Approval Rate': femaleRate },
  ]
  const incomeData = data.income_groups.map(g => ({
    name: g.range,
    'Approval Rate': g.approval_rate * 100,
  }))

  // Overall verdict
  const hasBias =
    (dpd !== null && dpd !== undefined && Math.abs(dpd) > 0.10) ||
    (eod !== null && eod !== undefined && Math.abs(eod) > 0.10) ||
    finalScore < 80

  // ── Metric card definitions ──
  const metrics = [
    {
      icon: 'balance',
      subtitle: t('incomeEquity'),
      title: t('compositeFairnessScore'),
      value: Number(finalScore).toFixed(1),
      unit: '/ 100',
      passed: finalScore >= 80,
      description: `${incomeGap}% gap between lowest & highest income bracket  •  threshold < 20%`,
    },
    {
      icon: 'groups',
      subtitle: t('genderApprovalGap'),
      title: t('demographicParityDiff'),
      value: dpd !== null && dpd !== undefined ? Math.abs(dpd).toFixed(4) : 'N/A',
      unit: '',
      passed: dpd === null || dpd === undefined ? null : Math.abs(dpd) <= 0.10,
      description: dpd !== null && dpd !== undefined
        ? `Men vs Women approval gap: ${(Math.abs(dpd) * 100).toFixed(0)}%  •  threshold ≤ 10%`
        : 'Install fairlearn to compute',
    },
    {
      icon: 'verified',
      subtitle: t('qualifiedApplicantGap'),
      title: t('equalizedOddsDiff'),
      value: eod !== null && eod !== undefined ? Math.abs(eod).toFixed(4) : 'N/A',
      unit: '',
      passed: eod === null || eod === undefined ? null : Math.abs(eod) <= 0.10,
      description: eod !== null && eod !== undefined
        ? `Gap among creditworthy applicants: ${(Math.abs(eod) * 100).toFixed(0)}%  •  threshold ≤ 10%`
        : 'Install fairlearn to compute',
    },
  ]

  return (
    <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Navbar />

        <div className="p-8 lg:p-12 space-y-8 max-w-[1440px] mx-auto w-full">

          {/* ── Header ── */}
          <div className="flex justify-between items-end gap-4 flex-wrap">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface">
                {t('biasFairnessAudit')}
              </h2>
              <p className="text-on-surface-variant mt-2 text-sm">
                {t('biasFairnessSubtitle')}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className="bg-white text-on-surface px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ambient-shadow cursor-pointer">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <select value={selectedRange} onChange={e => setSelectedRange(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer">
                  {RANGE_OPTION_KEYS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
                </select>
              </label>
              <button onClick={handleExport} disabled={exporting}
                className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ambient-shadow hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                {exporting
                  ? <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                  : <span className="material-symbols-outlined text-sm">download</span>}
                {exporting ? t('exporting') : t('exportAuditLog')}
              </button>
            </div>
          </div>

          <Toast status={toast.status} message={toast.message}
            onDismiss={() => setToast({ status: '', message: '' })} />

          {/* ── Key Finding Banner ── */}
          <div className={`flex items-start gap-4 p-5 rounded-2xl border ${
            hasBias
              ? 'bg-error-container/15 border-error/20'
              : 'bg-secondary-container/20 border-secondary/20'
          }`}>
            <span className={`material-symbols-outlined text-2xl mt-0.5 ${hasBias ? 'text-error' : 'text-secondary'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {hasBias ? 'warning' : 'check_circle'}
            </span>
            <div>
              <p className={`text-sm font-extrabold ${hasBias ? 'text-error' : 'text-secondary'}`}>
                {hasBias ? t('biasDetected') : t('noBiasDetected')}
              </p>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {hasBias ? t('biasDetectedDesc') : t('noBiasDetectedDesc')}
              </p>
            </div>
          </div>

          {/* ── 3 Metric Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map(m => <MetricCard key={m.title} {...m} />)}
          </div>

          {/* ── Charts ── */}
          <IncomeChart data={incomeData} />
          <GenderChart data={genderData} />

        </div>

        <footer className="mt-auto p-8 text-center border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">
            {t('copyright')} • Fairness Audit powered by fairlearn
          </p>
        </footer>
      </main>
    </div>
  )
}
