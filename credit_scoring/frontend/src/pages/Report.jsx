import { useLocation, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'

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

  const { result, formData } = state
  const score = result.credit_score
  const scorePercent = ((score - 300) / 600) * 100
  const strokeDash = 364.4
  const strokeOffset = strokeDash - (strokeDash * scorePercent) / 100

  const decisionStyle = {
    Approved: { bg: 'bg-secondary-container/20', border: 'border-secondary-container/30', icon: 'check_circle', iconBg: 'bg-secondary-container', iconColor: 'text-on-secondary-container', textColor: 'text-on-secondary-container' },
    Review: { bg: 'bg-primary-fixed/30', border: 'border-primary-fixed/50', icon: 'pending', iconBg: 'bg-primary-fixed', iconColor: 'text-primary', textColor: 'text-primary' },
    Rejected: { bg: 'bg-error-container/20', border: 'border-error-container/30', icon: 'cancel', iconBg: 'bg-error-container', iconColor: 'text-on-error-container', textColor: 'text-on-error-container' },
  }

  const ds = decisionStyle[result.decision] || decisionStyle.Review

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed">
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
        <div className="max-w-4xl mx-auto bg-surface-container-lowest p-12 rounded-xl shadow-[0_12px_32px_-4px_rgba(0,76,237,0.06)] print-container">

          {/* Report Header */}
          <div className="flex justify-between items-start border-b border-surface-container-high pb-8 mb-8">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-on-background">
                Credit Evaluation Summary
              </h2>
              <p className="font-mono text-primary font-semibold mt-1">#REV-8921</p>
              <div className="mt-4 flex gap-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">calendar_today</span>
                  Just Now
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  AI Verified
                </div>
              </div>
            </div>
            <div className="text-right no-print">
              <button
                onClick={() => window.print()}
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
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                  <circle
                    className={result.decision === 'Rejected' ? 'text-error' : 'text-primary'}
                    cx="64" cy="64" fill="transparent" r="58"
                    stroke="currentColor" strokeDasharray={strokeDash} strokeDashoffset={strokeOffset} strokeWidth="8"
                    style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                  />
                </svg>
                <span className="absolute font-headline text-4xl font-extrabold text-on-background">{score}</span>
              </div>
            </div>

            <div className={"md:col-span-2  p-8 rounded-xl flex flex-col justify-center border "}>
              <div className="flex items-center gap-3 mb-4">
                <div className={"w-10 h-10 rounded-full  flex items-center justify-center "}>
                  <span className="material-symbols-outlined">{ds.icon}</span>
                </div>
                <h3 className={"font-headline text-2xl font-bold "}>{result.decision}</h3>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed italic">
                AI confidence scoring analysis performed based on the provided financial parameters.
                Result derived using continuous explainability engine models.
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                {result.decision === 'Approved' && (
                  <><span className="bg-secondary-container px-3 py-1 rounded-full text-[10px] font-bold text-on-secondary-container">Low Risk</span><span className="bg-surface-container-high px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-variant">Standard Rate Apply</span></>
                )}
                {result.decision === 'Rejected' && (
                  <span className="bg-error-container px-3 py-1 rounded-full text-[10px] font-bold text-on-error-container">High Risk</span>
                )}
                {result.decision === 'Review' && (
                  <span className="bg-primary-fixed px-3 py-1 rounded-full text-[10px] font-bold text-primary">Manual Review Required</span>
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
              {result.explanations.map((exp, i) => (
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
          {result.counterfactuals && result.counterfactuals.length > 0 && (
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
                  {result.counterfactuals.map((cf, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-tertiary mt-0.5 text-sm">track_changes</span>
                      <p className="text-sm font-medium text-on-surface">{cf}</p>
                    </li>
                  ))}
                </ul>
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
                  {Object.entries(result.feature_importance || {})
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
              <div className="bg-surface-container p-5 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 w-full text-left">
                  Peer Benchmarking
                </p>
                <div className="flex items-end gap-2 h-24 w-full">
                  {[8, 16, 24, 20, 12, 6].map((h, i) => {
                    const mappedTier = Math.floor((score - 300) / 100)
                    const isUserTier = mappedTier === i || (i === 5 && mappedTier >= 5)
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm ${isUserTier ? 'bg-primary relative' : 'bg-surface-container-high opacity-50'}`}
                        style={{ height: `${h * 4}px` }}
                      >
                        {isUserTier && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary">
                            YOU
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between w-full mt-2 text-[8px] font-bold text-on-surface-variant uppercase">
                  <span>Low Score</span>
                  <span>High Score</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
