import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { getHistory } from '../services/api'

export default function Reports() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getHistory()
      .then(data => setHistory(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">
      <Sidebar />
      <main className="ml-64 flex flex-col min-h-screen">
        <Navbar />
        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
              Evaluation History
            </h2>
            <p className="text-on-surface-variant font-body">
              View your past credit evaluations and their generated reports.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center p-10"><p>Loading history...</p></div>
          ) : history.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl p-10 ambient-shadow border border-outline-variant/10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-4">history</span>
              <h3 className="font-headline font-bold text-lg text-on-surface">No historical records available</h3>
              <p className="text-sm text-on-surface-variant mt-2">Past evaluations will appear here once saved.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((app, i) => (
                <div 
                  key={app._id || i} 
                  onClick={() => navigate('/report', { state: { result: app.prediction, formData: app.input } })}
                  className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow border border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div>
                    <h3 className="font-headline font-bold text-lg">
                      Evaluation <span className="text-primary">#{app._id?.slice(-6) || i}</span>
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      {new Date(app.created_at).toLocaleString()} • Loan: ${app.input?.loan_amount?.toLocaleString() || 0} • Income: ${app.input?.income?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-1.5">
                      Evaluated by: <span className="text-primary-fixed-dim">{app.user_email || 'anonymous'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Score</p>
                      <p className="text-xl font-extrabold font-headline leading-none">{app.prediction?.credit_score || 'N/A'}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      app.prediction?.decision === 'Approved' ? 'bg-secondary-container text-on-secondary-container' :
                      app.prediction?.decision === 'Rejected' ? 'bg-error-container text-on-error-container' :
                      'bg-primary-fixed text-on-primary-fixed-variant'
                    }`}>
                      {app.prediction?.decision || 'Unknown'}
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
