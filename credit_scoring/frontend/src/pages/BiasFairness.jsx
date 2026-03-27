import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { getBias } from '../services/api'

export default function BiasFairness() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getBias()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const safeData = data || {
    low_income: 52,
    middle_income: 64,
    high_income: 82,
    fairness_score: 92.4,
    bias_detected: false,
  }

  const strokeCircum = 440
  const fairnessOffset = strokeCircum - (strokeCircum * safeData.fairness_score) / 100

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Navbar />
        <div className="p-8 space-y-8">

          {/* Bias warning */}
          {(safeData.bias_detected || data?.bias_detected) && (
            <div className="bg-error-container/40 border-l-4 border-error p-6 rounded-xl flex items-start gap-4 ambient-shadow">
              <span className="material-symbols-outlined text-error text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div>
                <h3 className="font-headline font-bold text-on-error-container text-lg leading-tight">
                  Potential bias detected in model predictions for low-income brackets
                </h3>
                <p className="text-on-error-container/80 text-sm mt-1 font-body">
                  A statistically significant disparity exists between income groups. Immediate
                  review of the training distribution is recommended.
                </p>
              </div>
              <button className="ml-auto bg-error text-on-error px-4 py-2 rounded-lg text-sm font-bold hover:bg-tertiary transition-colors">
                Investigate Gap
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
                Bias &amp; Fairness Monitoring
              </h2>
              <p className="text-on-surface-variant font-body mt-2">
                Continuous audit of explainable credit risk models across protected attributes.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-all">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Last 30 Days
              </button>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                <span className="material-symbols-outlined text-sm">download</span>
                Export Audit Log
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-error-container/40 border border-error/20 text-on-error-container text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Metric Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Gender bar chart placeholder */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 ambient-shadow relative overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-xl font-bold font-headline">Approval Rate by Gender</h3>
                  <p className="text-sm text-on-surface-variant font-body">
                    Demographic parity comparison across applicant pool
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs font-semibold text-on-surface-variant">Male</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-xs font-semibold text-on-surface-variant">Female</span>
                  </div>
                </div>
              </div>
              <div className="h-64 flex items-end justify-between gap-12 px-4 border-b border-outline-variant/10">
                {[
                  { label: 'Tier 1 Credits', m: 85, f: 82 },
                  { label: 'Tier 2 Credits', m: 65, f: 60 },
                  { label: 'Small Business', m: 45, f: 48 },
                  { label: 'Personal Loans', m: 75, f: 70 },
                ].map(({ label, m, f }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex justify-center items-end gap-2 h-full">
                      <div className="w-full bg-primary rounded-t-lg" style={{ height: `${m}%` }} />
                      <div className="w-full bg-secondary rounded-t-lg" style={{ height: `${f}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fairness score gauge */}
            <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <h3 className="font-headline font-bold text-on-surface">Composite Fairness Index</h3>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Aggregate score across all 12 fairness metrics monitored.
                </p>
              </div>
              <div className="py-6 flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle className="text-surface-container-high" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="12" />
                    <circle
                      className={safeData.bias_detected ? 'text-error' : 'text-primary'}
                      cx="80" cy="80" fill="transparent" r="70"
                      stroke="currentColor"
                      strokeDasharray={strokeCircum}
                      strokeDashoffset={loading ? strokeCircum : fairnessOffset}
                      strokeWidth="12"
                      style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold font-headline">
                      {loading ? '—' : safeData.fairness_score}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Fairness Points
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold">Bias Detected</span>
                  <span className={`text-xs font-bold ${safeData.bias_detected ? 'text-error' : 'text-secondary'}`}>
                    {safeData.bias_detected ? 'Yes — Review Required' : 'No — All Clear'}
                  </span>
                </div>
                <p className="text-[11px] text-on-surface-variant">Last updated: just now</p>
              </div>
            </div>

            {/* Income group breakdown */}
            <div className="col-span-12 bg-surface-container-lowest rounded-xl p-8 ambient-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h3 className="text-xl font-bold font-headline">Approval Rate by Income Group</h3>
                  <p className="text-sm text-on-surface-variant font-body">
                    Tracking model equity across socioeconomic spectrum
                  </p>
                </div>
                {safeData.bias_detected && (
                  <div className="px-4 py-2 bg-error-container/20 rounded-lg flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                    <span className="text-xs font-bold text-on-error-container">Critical anomaly detected</span>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                {[
                  { label: 'High Income (>$120k)', rate: safeData.high_income, color: 'bg-secondary', textColor: 'text-secondary' },
                  { label: 'Middle Income ($45k-$120k)', rate: safeData.middle_income, color: 'bg-secondary', textColor: 'text-secondary' },
                  { label: 'Low Income (<$45k)', rate: safeData.low_income, color: safeData.bias_detected ? 'bg-error' : 'bg-secondary', textColor: safeData.bias_detected ? 'text-error' : 'text-secondary' },
                ].map(({ label, rate, color, textColor }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{label}</span>
                      <span className={textColor}>{loading ? '—' : `${rate}% Approval`}</span>
                    </div>
                    <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-1000`}
                        style={{ width: loading ? '0%' : `${rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disparate impact factors */}
            <div className="col-span-12 md:col-span-6 bg-surface-container-low rounded-xl p-6">
              <h4 className="font-headline font-bold mb-4">Top Disparate Impact Factors</h4>
              <div className="space-y-4">
                {[
                  { icon: 'payments', iconBg: 'bg-secondary-container', iconColor: 'text-on-secondary-container', label: 'Income Stability', status: 'Healthy', statusColor: 'text-secondary', pct: 88, barColor: 'bg-secondary' },
                  { icon: 'home_pin', iconBg: 'bg-tertiary-fixed', iconColor: 'text-on-tertiary-fixed', label: 'Zip Code Proxies', status: 'Moderate Risk', statusColor: 'text-error', pct: 42, barColor: 'bg-error' },
                ].map(({ icon, iconBg, iconColor, label, status, statusColor, pct, barColor }) => (
                  <div key={label} className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-lg">
                    <span className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor} material-symbols-outlined`}>{icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold">{label}</span>
                        <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit log */}
            <div className="col-span-12 md:col-span-6 bg-surface-container-low rounded-xl p-6">
              <h4 className="font-headline font-bold mb-4">Recent Audit Activity</h4>
              <div className="space-y-4">
                {[
                  { dot: 'bg-primary', title: 'Model Bias Check Executed', time: 'Today, 09:42 AM • Automated Scan' },
                  { dot: 'bg-error', title: 'Warning Threshold Tripped', time: 'Today, 09:43 AM • Socioeconomic Segment', red: true },
                  { dot: 'bg-primary-fixed-dim', title: 'Calibration Update Scheduled', time: 'Tomorrow, 02:00 AM • Routine' },
                ].map(({ dot, title, time, red }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${dot} mt-1.5`} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${red ? 'text-error' : ''}`}>{title}</p>
                      <p className="text-[10px] text-on-surface-variant">{time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto p-8 text-center border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">
            Certified Explainable AI System • ISO 27001 Compliant
          </p>
        </footer>
      </main>
    </div>
  )
}
