import { useLocation, Link } from 'react-router-dom'
import { useState } from 'react'
import html2pdf from 'html2pdf.js'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { predictCredit } from '../services/api'

export default function Report() {
  const { state } = useLocation()

  if (!state || !state.result || !state.formData) {
    return (
      <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col items-center justify-center">
        <h2 className="font-headline text-2xl font-bold mb-4 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          No Evaluation Result Found
          <p className="text-sm font-normal text-on-surface-variant mt-2">
            Please run an evaluation first to generate a report.
          </p>
          <div className="mt-6 text-center">
            <Link to="/evaluation" className="bg-primary text-white px-6 py-3 rounded-lg font-bold text-sm hover:opacity-90">
              Go to New Evaluation
            </Link>
          </div>
        </h2>
      </div>
    )
  }

  const { result, formData, createdAt, reportId } = state
  const [whatIfData, setWhatIfData] = useState(formData)
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      const data = await predictCredit(whatIfData)
      setWhatIfResult(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSimulating(false)
    }
  }

  const activeResult = whatIfResult || result
  const score = activeResult.credit_score
  const scorePercent = ((score - 300) / 600) * 100
  const strokeDash = 364.4
  const strokeOffset = strokeDash - (strokeDash * scorePercent) / 100

  const decisionStyle = {
    Approved: { bg: 'bg-secondary/10', border: 'border-secondary/30', icon: 'check_circle', iconBg: 'bg-secondary', iconColor: 'text-white', textColor: 'text-secondary' },
    Review: { bg: 'bg-primary/10', border: 'border-primary/30', icon: 'pending', iconBg: 'bg-primary', iconColor: 'text-white', textColor: 'text-primary' },
    Rejected: { bg: 'bg-error/10', border: 'border-error/30', icon: 'cancel', iconBg: 'bg-error', iconColor: 'text-white', textColor: 'text-error' },
  }

  const ds = decisionStyle[activeResult.decision] || decisionStyle.Review

  const handleExportPDF = () => {
    const element = document.getElementById('report-content')
    const opt = {
      margin: 10,
      filename: `Evaluation_Report_${reportId ? reportId.slice(-6).toUpperCase() : 'REV-8921'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  return (
    <div className="bg-surface font-sans text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
      <Sidebar />

      {/* Top Nav */}
      <header className="flex justify-between items-center px-8 ml-64 bg-[#f8f9fa]/70 dark:bg-slate-950/70 backdrop-blur-xl w-full h-16 sticky top-0 z-50 shadow-[0_12px_32px_-4px_rgba(0,76,237,0.06)] no-print">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface-container-high px-3 py-1.5 rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-sm mr-2">search</span>
            <input className="bg-transparent border-none text-xs focus:ring-0 w-48 outline-none" placeholder="Search report ID..." type="text" />
          </div>
        </div>
        <Navbar />
      </header>

      <main className="ml-64 p-8 lg:p-12 min-h-screen">
        <div id="report-content" className="max-w-4xl mx-auto bg-surface-container-lowest p-12 rounded-xl shadow-[0_12px_32px_-4px_rgba(0,76,237,0.06)] print-container relative">

          {/* Report Header */}
          <div className="flex justify-between items-start border-b border-surface-container-high pb-8 mb-8">
            <div>
              <div id="back-btn" className="mb-4 no-print" data-html2canvas-ignore="true">
                <Link to="/reports" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline w-fit">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Reports
                </Link>
              </div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-background">
                Credit Evaluation Summary
              </h2>
              <p className="font-mono text-primary font-semibold mt-1">#{reportId ? reportId.slice(-6).toUpperCase() : 'REV-8921'}</p>
              <div className="mt-4 flex gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  {createdAt ? new Date(createdAt + (createdAt.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Just Now'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  AI Verified
                </div>
              </div>
            </div>
            <div className="text-right no-print" data-html2canvas-ignore="true">
              <button
                onClick={handleExportPDF}
                className="bg-primary text-white px-5 py-2.5 rounded-lg font-headline text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export PDF
              </button>
            </div>
          </div>

          {/* Score Hero */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1 bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">
                Final Credit Score
              </p>
              <div className="relative flex items-center justify-center w-32 h-32">
                <svg width="128" height="128" viewBox="0 0 128 128" className="absolute inset-0">
                  <g transform="rotate(-90 64 64)">
                    <circle className="text-surface-container-high" cx="64" cy="64" fill="none" r="58" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className={activeResult.decision === 'Rejected' ? 'text-error' : 'text-primary'}
                      cx="64" cy="64" fill="none" r="58"
                      stroke="currentColor" strokeDasharray={strokeDash} strokeDashoffset={strokeOffset} strokeWidth="8"
                      style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                    />
                  </g>
                </svg>
                <span className="absolute font-headline text-4xl font-extrabold text-on-background z-10">{score}</span>
              </div>
            </div>

            <div className={`md:col-span-2 p-8 rounded-xl flex flex-col justify-center border transition-all duration-700 ${ds.bg} ${ds.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${ds.iconBg} ${ds.iconColor}`}>
                  <span className="material-symbols-outlined">{ds.icon}</span>
                </div>
                <h3 className={`font-headline text-3xl font-black ${ds.textColor}`}>{activeResult.decision}</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed italic">
                AI confidence scoring analysis performed based on the provided financial parameters.
                Result derived using continuous explainability engine models.
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                {activeResult.decision === 'Approved' && (
                  <>
                    <span className="bg-secondary/15 border border-secondary/40 px-3 py-1.5 rounded-full text-[12px] font-black text-secondary uppercase tracking-[0.1em] shadow-sm">Low Risk Profile</span>
                    <span className="bg-surface-container-high border border-outline-variant/10 px-3 py-1.5 rounded-full text-[12px] font-black text-on-surface-variant uppercase tracking-[0.1em] shadow-sm">Standard Rate Apply</span>
                  </>
                )}
                {activeResult.decision === 'Rejected' && (
                  <span className="bg-error/15 border border-error/40 px-3 py-1.5 rounded-full text-[12px] font-black text-error uppercase tracking-[0.1em] shadow-sm">High Risk Flags Active</span>
                )}
                {activeResult.decision === 'Review' && (
                  <span className="bg-primary/15 border border-primary/40 px-3 py-1.5 rounded-full text-[12px] font-black text-primary uppercase tracking-[0.1em] shadow-sm">Manual Review Queue</span>
                )}
              </div>
            </div>
          </div>

          {/* Applicant Summary */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">Applicant Summary</h3>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant/10">
                {[
                  ['Age', formData.age],
                  ['Annual Income', `$${formData.income.toLocaleString()}`],
                  ['Employment Type', formData.employment_type],
                  ['Education', formData.education_level],
                  ['Initial Credit Score', formData.credit_score_input],
                  ['Requested Amount', `$${formData.loan_amount.toLocaleString()}`],
                  ['Existing Debt', formData.existing_debt ? `$${formData.existing_debt.toLocaleString()}` : '$0'],
                  ['Location Type', formData.zip_code_group],
                ].map(([label, value]) => (
                  <div key={label} className="p-4 bg-surface-container-low">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Explanation */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">Explanation &amp; Impact</h3>
            </div>
            <div className="space-y-6">
              {activeResult.explanations.map((exp, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-12 text-center">
                    <p className={"text-lg font-bold "}>
                      {i % 2 === 0 ? '+' : '−'}
                    </p>
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase">Impact</p>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-on-surface mb-1">AI Logic Extraction</h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {exp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Counterfactuals */}
          {activeResult.counterfactuals && activeResult.counterfactuals.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1 h-5 bg-tertiary rounded-full" />
                <h3 className="font-headline text-lg font-bold text-on-background">Path to Approval</h3>
              </div>
              <div className="bg-tertiary-container/30 border border-tertiary-container/50 rounded-xl p-6">
                <p className="text-sm text-on-surface-variant mb-4">
                  Our alternative reasoning engine suggests the following realistic changes to qualify for approval:
                </p>
                <ul className="space-y-4">
                  {activeResult.counterfactuals.map((cf, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary mt-0.5 text-sm">track_changes</span>
                      <p className="text-sm font-medium text-on-surface">{cf}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* What-If Simulator */}
          {(activeResult.decision === 'Rejected' || activeResult.decision === 'Review') && (
            <section className="mb-12 no-print" data-html2canvas-ignore="true">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 bg-secondary rounded-full" />
                  <h3 className="font-headline text-lg font-bold text-on-background">What-If Simulator</h3>
                </div>
                {whatIfResult && (
                  <button
                    onClick={() => { setWhatIfData(formData); setWhatIfResult(null); }}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary-fixed transition-colors"
                  >
                    Reset to Original Result
                  </button>
                )}
              </div>
              
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 ambient-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                <p className="text-sm text-on-surface-variant mb-8 max-w-2xl relative z-10">
                  Adjust the primary metrics below to simulate a new credit risk evaluation instantly. See exactly what outcomes would result from different scenarios.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span>Target Income</span>
                      <span className="text-secondary font-mono">${whatIfData.income.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min="10000" max="250000" step="5000"
                      value={whatIfData.income}
                      onChange={(e) => setWhatIfData({ ...whatIfData, income: Number(e.target.value) })}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
                    />
                  </div>
                  
                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span>Target Request</span>
                      <span className="text-secondary font-mono">${whatIfData.loan_amount.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min="1000" max="500000" step="1000"
                      value={whatIfData.loan_amount}
                      onChange={(e) => setWhatIfData({ ...whatIfData, loan_amount: Number(e.target.value) })}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
                    />
                  </div>

                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span>Target Score</span>
                      <span className="text-secondary font-mono">{whatIfData.credit_score_input}</span>
                    </label>
                    <input
                      type="range"
                      min="300" max="850" step="1"
                      value={whatIfData.credit_score_input}
                      onChange={(e) => setWhatIfData({ ...whatIfData, credit_score_input: Number(e.target.value) })}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
                    />
                  </div>
                  
                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span>Existing Debt</span>
                      <span className="text-secondary font-mono">${whatIfData.existing_debt.toLocaleString()}</span>
                    </label>
                    <input
                      type="range"
                      min="0" max="250000" step="1000"
                      value={whatIfData.existing_debt}
                      onChange={(e) => setWhatIfData({ ...whatIfData, existing_debt: Number(e.target.value) })}
                      className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-secondary"
                    />
                  </div>

                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 group-focus-within:text-secondary transition-colors">
                      <span>Employment</span>
                    </label>
                    <select
                      value={whatIfData.employment_type}
                      onChange={(e) => setWhatIfData({ ...whatIfData, employment_type: e.target.value })}
                      className="w-full bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30 font-bold block rounded-xl px-3 text-xs focus:border-secondary/20 focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none text-on-surface transition-all"
                      style={{ height: '40px' }}
                    >
                      <option value="Full-time">Full-time Professional</option>
                      <option value="Part-time">Part-time Employment</option>
                      <option value="Self-employed">Independent Freelance</option>
                      <option value="Unemployed">Currently Unemployed</option>
                      <option value="Gig">Gig Worker</option>
                    </select>
                  </div>

                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 group-focus-within:text-secondary transition-colors">
                      <span>Education Level</span>
                    </label>
                    <select
                      value={whatIfData.education_level}
                      onChange={(e) => setWhatIfData({ ...whatIfData, education_level: e.target.value })}
                      className="w-full bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30 font-bold block rounded-xl px-3 text-xs focus:border-secondary/20 focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none text-on-surface transition-all"
                      style={{ height: '40px' }}
                    >
                      <option value="High School">High School</option>
                      <option value="Some College">Some College</option>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Graduate">Graduate Degree</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end relative z-10">
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all font-headline text-sm shadow-xl shadow-secondary/20 disabled:opacity-60"
                  >
                    {isSimulating ? (
                      <><span className="material-symbols-outlined animate-spin text-sm">autorenew</span> Simulating Model…</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">science</span> Run Scenario Analysis</>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Charts */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">Visual Compliance Data</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Weight */}
              <div className="bg-surface-container p-5 rounded-xl">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  Feature Weight Distribution
                </p>
                <div className="space-y-3">
                  {Object.entries(activeResult.feature_importance || {})
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .slice(0, 10)
                    .map(([feat, val]) => {
                      const pct = Math.min(Math.abs(val) * 300, 100) // Scale the SHAP val for visualization
                      return (
                        <div key={feat}>
                          <div className="flex justify-between text-[10px] font-bold mb-1 uppercase">
                            <span>{feat.replace(/_/g, ' ')}</span>
                            <span>{val.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${val >= 0 ? 'bg-primary' : 'bg-error'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Peer Benchmarking */}
              <div className="bg-surface-container p-5 rounded-xl flex flex-col items-start justify-start h-full">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-full text-left">
                  Peer Benchmarking
                </p>
                <div className="w-full my-auto flex flex-col items-center">
                  <div className="flex items-end gap-2 h-24 w-full">
                    {[8, 16, 24, 20, 12, 6].map((h, i) => {
                      const mappedTier = Math.floor((score - 300) / 100)
                      const isUserTier = mappedTier === i || (i === 5 && mappedTier >= 5)
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-sm transition-all ${isUserTier ? 'bg-primary relative shadow-md z-10' : 'bg-gray-300 dark:bg-slate-700'}`}
                          style={{ height: `${h * 4}px` }}
                        >
                          {isUserTier && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-primary">
                              YOU
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between w-full mt-3 text-[8px] font-bold text-on-surface-variant uppercase">
                    <span>Low Score</span>
                    <span>High Score</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
