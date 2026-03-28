import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { getHistory } from '../services/api'

export default function Reports() {
  const { t } = useTranslation()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  
  const searchParams = new URLSearchParams(location.search)
  const searchQuery = (searchParams.get('q') || '').toLowerCase().trim()

  useEffect(() => {
    getHistory()
      .then(data => setHistory(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredHistory = history.filter(app => {
    if (!searchQuery) return true
    const idStr = app._id || ''
    const emailStr = app.user_email || ''
    const decisionStr = app.prediction?.decision || ''
    const scoreStr = String(app.prediction?.credit_score || '')
    
    return idStr.toLowerCase().includes(searchQuery) || 
           emailStr.toLowerCase().includes(searchQuery) ||
           decisionStr.toLowerCase().includes(searchQuery) ||
           scoreStr.includes(searchQuery)
  })

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen">
      <Sidebar />
      <main className="ml-64 flex flex-col min-h-screen">
        <Navbar />
        <div className="p-8 lg:p-12 max-w-[1440px] mx-auto w-full space-y-8">
          <div className="flex justify-between items-end gap-6 flex-wrap">
            <div className="flex-1">
              <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-on-surface mb-2">
                {t('evaluationHistory')}
              </h2>
              <p className="text-on-surface-variant font-body">
                {t('historySubtitle')}
              </p>
            </div>
            <div className="flex gap-4 items-center">
              {searchQuery && (
                <button 
                  onClick={() => navigate('/reports')}
                  className="bg-surface-container-high px-5 py-2.5 rounded-xl text-xs font-black text-on-surface flex items-center gap-2 hover:bg-outline-variant/20 transition-all uppercase tracking-widest shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                  {t('clearFilter')}
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* History List */}
            <div className="lg:col-span-8 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
                  <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">{t('refreshingTrail')}</p>
                </div>
              ) : history.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-16 ambient-shadow border border-outline-variant/10 text-center">
                  <span className="material-symbols-outlined text-6xl text-outline/30 mb-6">history</span>
                  <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tight">{t('noHistoricalRecords')}</h3>
                  <p className="text-sm text-on-surface-variant mt-3 max-w-md mx-auto">{t('noHistoryDesc')}</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-16 ambient-shadow border border-outline-variant/10 text-center">
                  <span className="material-symbols-outlined text-6xl text-error/30 mb-6">search_off</span>
                  <h3 className="font-headline font-black text-xl text-on-surface uppercase tracking-tight">{t('noMatchFor')} "{searchQuery}"</h3>
                  <p className="text-sm text-on-surface-variant mt-3 max-w-md mx-auto">{t('refineSearch')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((app, i) => (
                    <div 
                      key={app._id || i} 
                      onClick={() => navigate('/report', { state: { result: app.prediction, formData: app.input, createdAt: app.created_at, reportId: app._id } })}
                      className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                           <h3 className="font-headline font-black text-lg text-on-surface">
                            Evaluation <span className="text-primary opacity-60">#{app._id?.slice(-6) || i}</span>
                          </h3>
                          <div className="h-1 w-1 rounded-full bg-outline-variant" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary group-hover:tracking-[0.3em] transition-all">{t('auditReady')}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                          {new Date((app.created_at || new Date().toISOString()) + (!app.created_at || app.created_at.endsWith('Z') ? '' : 'Z')).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} • Loan: ₹{app.input?.loan_amount?.toLocaleString() || 0}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter opacity-60">
                           <span className="material-symbols-outlined text-sm">person</span>
                           {app.user_email || 'anonymous'}
                        </div>
                      </div>
                      <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 border-outline-variant/10 pt-4 md:pt-0">
                        <div className="text-right w-[100px] shrink-0">
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60 text-right">{t('creditScoreLabel')}</p>
                          <p className={`text-2xl font-black font-headline leading-none text-right ${app.prediction?.credit_score > 700 ? 'text-secondary' : 'text-on-surface'}`}>{app.prediction?.credit_score || 'N/A'}</p>
                        </div>
                        <div className="w-[120px] flex justify-center h-full">
                          <div className={`px-5 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-[0.12em] shadow-sm border transition-all w-full text-center ${
                            app.prediction?.decision === 'Approved' ? 'bg-secondary/20 text-secondary border-secondary/40' :
                            app.prediction?.decision === 'Rejected' ? 'bg-error/20 text-error border-error/40' :
                            'bg-primary/20 text-primary border-primary/40'
                          }`}>
                            {app.prediction?.decision ? (
                              { Approved: t('approved'), Rejected: t('rejected'), Review: t('manualReview') }[app.prediction.decision] || app.prediction.decision
                            ) : t('unknown')}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-primary group-hover:translate-x-1.5 transition-transform duration-500">arrow_forward</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Intelligence Sidebar */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
               <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 ambient-shadow">
                  <h4 className="font-headline font-bold text-[#0052ff] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-primary/10 w-full pb-2">{t('searchIntelligence')}</h4>
                  <div className="space-y-6">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3 opacity-60">{t('statusFrequency')}</p>
                       <div className="space-y-3">
                          {[
                            { label: t('approvedAssessments'), count: history.filter(a => a.prediction?.decision === 'Approved').length, color: 'text-secondary' },
                            { label: t('adverseActions'), count: history.filter(a => a.prediction?.decision === 'Rejected').length, color: 'text-error' },
                            { label: t('manualOverrides'), count: history.filter(a => a.prediction?.decision === 'Review').length, color: 'text-primary' }
                          ].map(s => (
                            <div key={s.label} className="flex justify-between items-center text-xs">
                               <span className="font-bold text-on-surface-variant">{s.label}</span>
                               <span className={`font-black ${s.color}`}>{s.count}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-outline-variant/10 bg-primary/5 p-4 rounded-xl">
                       <div className="flex items-center gap-2 mb-2 text-primary">
                          <span className="material-symbols-outlined text-sm">info</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('auditPolicy')}</span>
                       </div>
                       <p className="text-[10px] text-on-surface-variant leading-relaxed font-semibold uppercase tracking-tighter opacity-70">
                          {t('auditPolicyText')}
                       </p>
                    </div>
                  </div>
               </div>

               <div className="bg-gradient-to-br from-[#003ec7] to-[#0052ff] p-8 rounded-2xl shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <div className="relative z-10">
                    <h4 className="font-headline font-bold text-white/70 mb-4 text-[10px] uppercase tracking-[0.2em] border-b border-white/20 w-full pb-2">{t('analysisHub')}</h4>
                    <p className="text-white text-xs font-bold leading-relaxed mb-6">
                      {t('analysisHubDesc')}
                    </p>
                    <button onClick={() => navigate('/evaluation')} className="w-full bg-white text-primary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-surface-container-low transition-all">
                       {t('newEvaluation')}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
