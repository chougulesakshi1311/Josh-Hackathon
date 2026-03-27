import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { getDashboard, getHistory } from '../services/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      getDashboard().then(setData),
      getHistory().then(setHistory)
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = data || {
    total_applications: 0,
    approval_rate: 0,
    avg_credit_score: 0,
    rejection_rate: 0,
    review_rate: 0,
  }

  const totalC = 251.2;
  const reviewPct = stats.review_rate || 0;
  const rejectPct = stats.rejection_rate || 0;
  const approvePct = stats.approval_rate || 0;
  
  const offsetApprove = totalC * (1 - (reviewPct + rejectPct + approvePct) / 100);
  const offsetReject = totalC * (1 - (reviewPct + rejectPct) / 100);
  const offsetReview = totalC * (1 - (reviewPct) / 100);

  const recentLogs = history.slice(0, 3).map((app, i) => {
    const decision = app.prediction?.decision
    const id = app._id?.slice(-4) || 'N/A'
    let icon = 'history'; let color = 'text-primary-container'
    if (decision === 'Approved') { icon = 'verified'; color = 'text-secondary' }
    if (decision === 'Rejected') { icon = 'gavel'; color = 'text-error' }
    
    return {
      id: app._id,
      icon, color, 
      title: `Case #${id} ${decision}`, 
      desc: app.prediction?.explanations?.[0] || 'View full evaluation for details.'
    }
  })

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Navbar />

        <section className="p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
                Executive Overview
              </h2>
              <p className="text-on-surface-variant mt-1">
                Real-time credit performance &amp; bias monitoring.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-surface-container-lowest text-primary font-semibold px-6 py-2.5 rounded-xl text-sm ambient-shadow hover:bg-surface-container transition-colors">
                Export Report
              </button>
              <button
                onClick={() => (window.location.href = '/evaluation')}
                className="bg-gradient-to-r from-[#003ec7] to-[#0052ff] text-white font-semibold px-6 py-2.5 rounded-xl text-sm ambient-shadow hover:opacity-90 transition-opacity"
              >
                New Evaluation
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-error-container/40 border border-error/20 text-on-error-container text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              icon="analytics"
              iconBg="bg-primary-fixed"
              iconColor="text-primary"
              badge="+12% vs LY"
              badgeColor="text-secondary bg-secondary-container"
              label="Total Applications"
              value={loading ? '—' : stats.total_applications.toLocaleString()}
            />
            <StatCard
              icon="check_circle"
              iconBg="bg-secondary-container"
              iconColor="text-on-secondary-container"
              badge="Stable"
              badgeColor="text-secondary bg-secondary-container"
              label="Approval Rate"
              value={loading ? '—' : `${stats.approval_rate}%`}
              valueColor="text-[#10B981]"
            />
            <StatCard
              icon="cancel"
              iconBg="bg-error-container"
              iconColor="text-on-error-container"
              badge="-3% Improvement"
              badgeColor="text-error bg-error-container"
              label="Rejection Rate"
              value={loading ? '—' : `${stats.rejection_rate}%`}
              valueColor="text-[#EF4444]"
            />
            <StatCard
              icon="speed"
              iconBg="bg-primary-fixed-dim"
              iconColor="text-on-primary-fixed-variant"
              badge="Prime Avg"
              badgeColor="text-primary bg-primary-fixed"
              label="Average Credit Score"
              value={loading ? '—' : stats.avg_credit_score}
            />
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Distribution */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-surface-container-lowest p-8 rounded-xl ambient-shadow relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h4 className="text-xl font-bold font-headline">Credit Score Distribution</h4>
                    <p className="text-sm text-on-surface-variant">
                      Density of applicant scores across major tiers
                    </p>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-4 px-2">
                  {[20, 40, 60, 80, 90, 70].map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-surface-container-low rounded-t-lg relative group"
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
                <div className="flex justify-between mt-4 text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-tighter">
                  {['300-579', '580-669', '670-739', '740-799', '800-850'].map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Bias quick view */}
              <div className="bg-surface-container-lowest p-8 rounded-xl ambient-shadow">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h4 className="text-xl font-bold font-headline">Bias &amp; Fairness Analysis</h4>
                    <p className="text-sm text-on-surface-variant">
                      Approval rates segmented by income quartiles
                    </p>
                  </div>
                  <a
                    href="/bias"
                    className="text-primary text-xs font-bold flex items-center gap-1 group"
                  >
                    View Detail{' '}
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </a>
                </div>
                <div className="space-y-6">
                  {[
                    { label: 'High Income (>$120k)', pct: 82, color: 'bg-secondary', textColor: 'text-secondary' },
                    { label: 'Upper Middle ($80k-$120k)', pct: 71, color: 'bg-secondary', textColor: 'text-secondary' },
                    { label: 'Lower Middle ($45k-$80k)', pct: 64, color: 'bg-secondary', textColor: 'text-secondary' },
                    { label: 'Low Income (<$45k)', pct: 52, color: 'bg-error', textColor: 'text-error' },
                  ].map(({ label, pct, color, textColor }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{label}</span>
                        <span className={textColor}>{pct}% Approval</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar stats */}
            <div className="space-y-8">
              {/* Donut */}
              <div className="bg-surface-container-lowest p-8 rounded-xl ambient-shadow flex flex-col items-center text-center">
                <h4 className="text-xl font-bold font-headline mb-2">Portfolio Split</h4>
                <p className="text-sm text-on-surface-variant mb-8">
                  Current approval decision velocity
                </p>
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-surface-container-low" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="12" />
                    <circle className="text-secondary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetApprove} strokeLinecap="round" strokeWidth="12" />
                    <circle className="text-error" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetReject} strokeLinecap="round" strokeWidth="12" />
                    <circle className="text-primary-fixed-dim" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={offsetReview} strokeLinecap="round" strokeWidth="12" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold font-headline leading-none">
                      {loading ? '—' : `${(stats.total_applications / 1000).toFixed(1)}k`}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total</span>
                  </div>
                </div>
                <div className="w-full space-y-4">
                  {[
                    { color: 'bg-secondary', label: 'Approved', value: `${stats.approval_rate}%` },
                    { color: 'bg-error', label: 'Rejected', value: `${stats.rejection_rate}%` },
                    { color: 'bg-primary-fixed-dim', label: 'Manual Review', value: `${stats.review_rate}%` },
                  ].map(({ color, label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="text-on-surface-variant">{label}</span>
                      </div>
                      <span>{loading ? '—' : value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explainability logs */}
              <div className="bg-surface-container-lowest p-8 rounded-xl ambient-shadow">
                <h4 className="text-xl font-bold font-headline mb-6">Explainability Logs</h4>
                <div className="space-y-6">
                  {recentLogs.length > 0 ? recentLogs.map(({ id, icon, color, title, desc }) => (
                    <div key={id || title} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center ${color} flex-shrink-0`}>
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-tight">{title}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{desc}</p>
                        <p className="text-[10px] font-bold text-primary mt-2 cursor-pointer hover:underline" onClick={() => (window.location.href = '/reports')}>View AI Trace</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-on-surface-variant font-medium">No evaluation records available yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto px-8 py-6 border-t border-outline-variant/10 flex justify-between items-center text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
          <span>© 2024 Explainable Credit AI • Version 1.0.0</span>
          <div className="flex gap-6">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Audit Logs</a>
          </div>
        </footer>
      </main>
    </div>
  )
}

function StatCard({ icon, iconBg, iconColor, badge, badgeColor, label, value, valueColor = 'text-on-surface' }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow border border-outline-variant/5">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className={`text-[10px] font-bold ${badgeColor} px-2 py-1 rounded-full`}>{badge}</span>
      </div>
      <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h3 className={`text-4xl font-extrabold font-headline leading-none ${valueColor}`}>{value}</h3>
    </div>
  )
}
