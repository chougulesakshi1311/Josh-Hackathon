import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { exportAuditLog, getBias } from '../services/api'

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'all', label: 'All Time' },
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

  const tone =
    status === 'error'
      ? 'bg-error-container/60 border-error/30 text-on-error-container'
      : 'bg-secondary-container/60 border-secondary/20 text-on-secondary-container'

  return (
    <div className={`border rounded-xl px-4 py-3 text-sm font-medium ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button className="text-xs font-bold uppercase tracking-wider" onClick={onDismiss}>
          Close
        </button>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, suffix = '%' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-container-highest p-4 rounded-xl shadow-xl border border-outline-variant/10 z-50">
        <p className="text-xs font-bold text-on-surface mb-2 tracking-widest uppercase">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-semibold text-on-surface">
              {entry.name}: {Number(entry.value).toFixed(1)}
              {suffix}
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const FairnessScoreCard = ({ score }) => {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: Math.max(0, 100 - score) },
  ]
  const isHealthy = score >= 80

  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 h-full flex flex-col">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
          </div>
          <h3 className="font-headline font-bold text-on-surface text-lg">Composite Fairness Index</h3>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Aggregate health score evaluating disparity across all monitored demographic parameters.
        </p>
      </div>

      <div className="relative mt-8" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius="75%"
              outerRadius="95%"
              stroke="none"
              dataKey="value"
            >
              <Cell fill={isHealthy ? '#0052FF' : '#FF4F4F'} />
              <Cell fill="#E2E8F0" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-[15px]">
          <span className="text-5xl font-extrabold font-headline tracking-tighter">
            {Number(score).toFixed(1)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-1 mt-2">
            <span className={`material-symbols-outlined text-sm ${isHealthy ? 'text-secondary' : 'text-error'}`}>
              {isHealthy ? 'trending_up' : 'trending_down'}
            </span>
            {isHealthy ? 'Healthy Range' : 'Critical Warning'}
          </span>
        </div>
      </div>
    </div>
  )
}

const GenderChart = ({ data }) => (
  <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 h-full flex flex-col hover:shadow-xl transition-all duration-500">
    <div className="mb-8 w-full">
      <h4 className="font-headline font-bold text-primary mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-primary/10 w-full pb-2">Parity Diagnostics</h4>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline font-bold text-xl text-on-surface">Demographic Disparity</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Production audit of approval rates across protected gender classes.
          </p>
        </div>
      </div>
    </div>
    <div className="w-full relative" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barSize={48}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
          <Bar dataKey="Approval Rate" fill="#0052FF" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const IncomeChart = ({ data }) => (
  <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 h-full flex flex-col hover:shadow-xl transition-all duration-500">
    <div className="mb-8 w-full">
      <h4 className="font-headline font-bold text-secondary mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-secondary/10 w-full pb-2">Socioeconomic Equity</h4>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline font-bold text-xl text-on-surface">Income Stratification Audit</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Tracking model neutrality across diverse socioeconomic quartiles.
          </p>
        </div>
      </div>
    </div>
    <div className="w-full relative" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
          <Line
            type="monotone"
            dataKey="Approval Rate"
            stroke="#10B981"
            strokeWidth={4}
            dot={{ r: 6, fill: '#10B981', strokeWidth: 3, stroke: '#FFFFFF' }}
            activeDot={{ r: 8, strokeWidth: 0, fill: '#059669' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const ImpactAndAuditSection = () => (
  <div className="flex flex-col gap-8 h-full">
    {/* Top Disparate Impact Factors */}
    <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 flex-1 hover:shadow-xl transition-all duration-500">
      <h4 className="font-headline font-bold text-error mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-error/10 w-full pb-2">Risk Redlining Check</h4>
      <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Critical Bias Factors</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-error-container/10 rounded-xl border border-error-container/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">warning</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Income Disparity</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">Lower income brackets flag higher algorithmic rejection correlation</p>
            </div>
          </div>
          <span className="text-error font-bold text-[10px] uppercase tracking-wider bg-error-container px-2 py-1 rounded-full whitespace-nowrap">Review Rec</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-secondary-container/10 rounded-xl border border-secondary/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">check_circle</span>
            <div>
              <p className="text-sm font-bold text-on-surface">Gender Parity</p>
              <p className="text-xs text-on-surface-variant leading-relaxed">Approval distribution remains within 10% tolerance</p>
            </div>
          </div>
          <span className="text-secondary font-bold text-[10px] uppercase tracking-wider bg-secondary-container px-2 py-1 rounded-full whitespace-nowrap">Compliant</span>
        </div>
      </div>
    </div>

    {/* Recent Audit Activity */}
    <div className="bg-surface-container-lowest p-8 rounded-2xl ambient-shadow border border-outline-variant/10 flex-1 hover:shadow-xl transition-all duration-500">
      <h4 className="font-headline font-bold text-[#003ec7] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-primary/10 w-full pb-2">Regulatory Chain</h4>
      <h3 className="font-headline font-bold text-xl text-on-surface mb-6">System Compliance Logs</h3>
      <div className="space-y-4">
        {[
          { id: 1, action: "Algorithmic Health Check", time: "2 hours ago", status: "Passed", color: "text-secondary", bg: "bg-secondary-container" },
          { id: 2, action: "Demographic Variance Scan", time: "5 hours ago", status: "Flagged", color: "text-error", bg: "bg-error-container" },
          { id: 3, action: "Model Weights Re-calibration", time: "1 day ago", status: "Completed", color: "text-primary", bg: "bg-primary-fixed" }
        ].map((log) => (
          <div key={log.id} className="flex justify-between items-center text-sm border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
             <div>
               <p className="font-bold text-on-surface">{log.action}</p>
               <p className="text-xs text-on-surface-variant mt-0.5">{log.time}</p>
             </div>
             <span className={`font-bold ${log.color} ${log.bg} px-3 py-1 rounded-md text-[10px] uppercase tracking-wider whitespace-nowrap`}>
               {log.status}
             </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const AlertsSection = ({ selectedRange }) => (
  <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex items-start gap-5 w-full">
    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-primary/30">
      <span className="material-symbols-outlined">insights</span>
    </div>
    <div>
      <h3 className="font-headline font-bold text-primary text-lg leading-tight mb-1">
        AI Evaluation Insights Active
      </h3>
      <p className="text-on-surface-variant text-sm leading-relaxed max-w-3xl">
        Compliance monitoring is currently displaying the {RANGE_OPTIONS.find((option) => option.value === selectedRange)?.label.toLowerCase()} view.
        The charts below re-query backend fairness metrics whenever the range changes.
      </p>
    </div>
  </div>
)

export default function BiasFairness() {
  const [selectedRange, setSelectedRange] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState({ status: '', message: '' })

  useEffect(() => {
    let cancelled = false

    async function loadBiasMetrics() {
      setLoading(true)
      setError('')

      try {
        const response = await getBias(selectedRange)
        if (cancelled) return
        setData(response)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadBiasMetrics()
    return () => {
      cancelled = true
    }
  }, [selectedRange])

  async function handleExportAuditLog() {
    setExporting(true)
    setToast({ status: '', message: '' })

    try {
      const { blob, filename } = await exportAuditLog(selectedRange)
      downloadBlob(blob, filename)
      setToast({ status: 'success', message: 'Audit log exported successfully.' })
    } catch (e) {
      setToast({ status: 'error', message: e.message || 'Failed to export audit log.' })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 h-full">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
            <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant animate-pulse">
              Running Compliance Checks...
            </p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !data || !data.gender || !data.income_groups) {
    return (
      <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased min-h-screen">
        <Sidebar />
        <main className="ml-64 flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 p-12 flex flex-col items-center justify-center h-full">
            <div className="bg-error-container/20 p-8 rounded-2xl border border-error-container max-w-md text-center">
              <span className="material-symbols-outlined text-error text-5xl mb-4">gavel</span>
              <h2 className="font-headline font-bold text-xl mb-2 text-on-error-container">Data Unavailable</h2>
              <p className="text-sm text-on-error-container/80 mb-6 font-medium">
                {error || "The Bias & Fairness API endpoint isn't returning the expected metric format or is unreachable."}
              </p>
              <button onClick={() => window.location.reload()} className="bg-error text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-error/20 hover:opacity-90 transition">
                Retry Connection
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const male = data.gender?.male || { approved: 0, total: 0 }
  const female = data.gender?.female || { approved: 0, total: 0 }
  const genderData = [
    { name: 'Male', 'Approval Rate': male.total > 0 ? (male.approved / male.total) * 100 : 0 },
    { name: 'Female', 'Approval Rate': female.total > 0 ? (female.approved / female.total) * 100 : 0 },
  ]

  const incomeData = data.income_groups.map((group) => ({
    name: group.range,
    'Approval Rate': group.approval_rate * 100,
  }))

  const finalScore = data.fairness_score || 0

  return (
    <div className="bg-[#FAFAFA] font-sans text-on-surface antialiased">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Navbar />

        <div className="p-8 lg:p-12 space-y-8 max-w-[1440px] mx-auto w-full">
          <div className="flex justify-between items-end gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface">
                Bias &amp; Fairness Monitoring
              </h2>
              <p className="text-on-surface-variant font-body mt-2">
                Production-grade algorithmic neutrality monitoring across protected demographic and socioeconomic tiers.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <label className="bg-white text-on-surface px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ambient-shadow cursor-pointer">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <select
                  value={selectedRange}
                  onChange={(event) => setSelectedRange(event.target.value)}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  {RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={handleExportAuditLog}
                disabled={exporting}
                className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ambient-shadow hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {exporting ? (
                  <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">download</span>
                )}
                {exporting ? 'Exporting...' : 'Export Audit Log'}
              </button>
            </div>
          </div>

          <Toast
            status={toast.status}
            message={toast.message}
            onDismiss={() => setToast({ status: '', message: '' })}
          />

          <AlertsSection selectedRange={selectedRange} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-stretch">
            
            {/* --- ROW 1 --- */}
            <div className="lg:col-span-4">
              <FairnessScoreCard score={finalScore} />
            </div>
            <div className="lg:col-span-8">
              <IncomeChart data={incomeData} />
            </div>

            {/* --- ROW 2 --- */}
            <div className="lg:col-span-4">
              <GenderChart data={genderData} />
            </div>
            <div className="lg:col-span-8">
              <ImpactAndAuditSection />
            </div>

          </div>
        </div>

        <footer className="mt-auto p-8 text-center border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">
            Certified Explainable AI System • Continuous Audit Engine Active
          </p>
        </footer>
      </main>
    </div>
  )
}
