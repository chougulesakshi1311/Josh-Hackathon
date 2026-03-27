import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { predictCredit } from '../services/api'

const EMPLOYMENT_OPTIONS = [
  { value: 'Full-time', label: 'Full-time Professional' },
  { value: 'Part-time', label: 'Part-time Employment' },
  { value: 'Self-employed', label: 'Independent Freelance / Self-employed' },
  { value: 'Unemployed', label: 'Currently Unemployed' },
  { value: 'Gig', label: 'Gig Worker' },
]

const EDUCATION_OPTIONS = [
  { value: 'High School', label: 'High School' },
  { value: 'Some College', label: 'Some College' },
  { value: 'Bachelor\'s', label: 'Bachelor\'s Degree' },
  { value: 'Graduate', label: 'Graduate Degree' },
]

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
]

const RACE_OPTIONS = [
  { value: 'White', label: 'White' },
  { value: 'Black', label: 'Black' },
  { value: 'Hispanic', label: 'Hispanic' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Native American', label: 'Native American' },
  { value: 'Multiracial', label: 'Multiracial' },
]

const CITIZENSHIP_OPTIONS = [
  { value: 'Citizen', label: 'Citizen' },
  { value: 'Permanent Resident', label: 'Permanent Resident' },
  { value: 'Visa Holder', label: 'Visa Holder' },
]

const LOCATION_OPTIONS = [
  { value: 'Urban Professional', label: 'Urban Professional' },
  { value: 'High-income Suburban', label: 'High-income Suburban' },
  { value: 'Working Class Urban', label: 'Working Class Urban' },
  { value: 'Rural', label: 'Rural' },
  { value: 'Historically Redlined', label: 'Historically Redlined' },
]

const DEFAULT_FORM = {
  age: '',
  income: '',
  employment_type: 'Full-time',
  education_level: 'Bachelor\'s',
  gender: 'Male',
  race: 'White',
  citizenship_status: 'Citizen',
  criminal_record: false,
  disability_status: false,
  zip_code_group: 'Urban Professional',
  loan_amount: '',
  existing_debt: '',
  credit_score_input: 720,
}

export default function NewEvaluation() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        age: Number(form.age),
        income: Number(String(form.income).replace(/,/g, '')),
        employment_type: form.employment_type,
        education_level: form.education_level,
        gender: form.gender,
        race: form.race,
        citizenship_status: form.citizenship_status,
        criminal_record: form.criminal_record,
        disability_status: form.disability_status,
        zip_code_group: form.zip_code_group,
        loan_amount: Number(String(form.loan_amount).replace(/,/g, '')),
        existing_debt: Number(String(form.existing_debt).replace(/,/g, '')),
        credit_score_input: Number(form.credit_score_input),
      }
      const data = await predictCredit(payload)

      // Store result and form data in state, then navigate to /report
      navigate('/report', { state: { result: data, formData: payload } })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background font-body text-on-surface antialiased min-h-screen">
      <Sidebar />
      <header className="flex justify-between items-center px-8 ml-64 h-16 sticky top-0 z-40 bg-[#f8f9fa]/70 backdrop-blur-xl shadow-[0_12px_32px_-4px_rgba(0,76,237,0.06)]">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/50 outline-none" placeholder="Search evaluations..." type="text" />
          </div>
        </div>
        <Navbar />
      </header>

      <main className="ml-64 p-12 max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
            New Credit Evaluation
          </h2>
          <p className="text-on-surface-variant font-body max-w-xl">
            Initiate a deep-layer credit risk assessment. Our AI models curate data points to
            provide an explainable transparency score alongside the primary decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Form */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-10 ambient-shadow">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Applicant Profile */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Applicant Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Age</label>
                    <input name="age" type="number" min="18" max="100" required value={form.age} onChange={handleChange} placeholder="e.g. 34" className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                      Annual Income
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Total gross annual earnings before tax">info</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                      <input name="income" type="text" required value={form.income} onChange={handleChange} placeholder="75,000" className="w-full bg-surface border-none rounded-lg p-3 pl-8 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Demographics (For Fairness) */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Demographics & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Race / Ethnicity</label>
                    <select name="race" value={form.race} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {RACE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Citizenship</label>
                    <select name="citizenship_status" value={form.citizenship_status} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {CITIZENSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Location Type</label>
                    <select name="zip_code_group" value={form.zip_code_group} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {LOCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Education & Employment */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Education & Employment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Education Level</label>
                    <select name="education_level" value={form.education_level} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Employment Type</label>
                    <select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {EMPLOYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Background Risk Factors */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Risk Assessment Flags
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer">
                    <input type="checkbox" name="criminal_record" checked={form.criminal_record} onChange={handleChange} className="w-5 h-5 accent-primary rounded" />
                    <span className="text-sm font-semibold text-on-surface">Prior Criminal Record</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-surface rounded-lg cursor-pointer">
                    <input type="checkbox" name="disability_status" checked={form.disability_status} onChange={handleChange} className="w-5 h-5 accent-primary rounded" />
                    <span className="text-sm font-semibold text-on-surface">Disability Status (Optional test feature)</span>
                  </label>
                </div>
              </section>

              {/* Financial Liability */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Financial Liability
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                      Requested Loan Amount
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Principal amount the applicant is seeking">help</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                      <input name="loan_amount" type="text" required value={form.loan_amount} onChange={handleChange} placeholder="250,000" className="w-full bg-surface border-none rounded-lg p-3 pl-8 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                      Existing Debt
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Total outstanding liabilities">info</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                      <input name="existing_debt" type="text" required value={form.existing_debt} onChange={handleChange} placeholder="12,400" className="w-full bg-surface border-none rounded-lg p-3 pl-8 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Credit History */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Historical Data
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                    Credit History Score
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Internal or standardized credit scoring system value">analytics</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <input name="credit_score_input" type="range" min="300" max="850" value={form.credit_score_input} onChange={handleChange} className="flex-1 accent-primary h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer" />
                    <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold">
                      {form.credit_score_input}
                    </span>
                  </div>
                </div>
              </section>

              {error && (
                <div className="bg-error-container/40 border border-error/20 text-on-error-container text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="trust-gradient text-white w-full py-4 rounded-xl font-bold tracking-tight text-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">autorenew</span>
                      Evaluating…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Evaluate Credit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <h4 className="font-headline font-bold text-on-surface">Compliance Check</h4>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Evaluation follows the latest GDPR and Fair Lending regulations. All AI decisions
                are mapped to specific reason codes for regulatory auditing.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-xl h-48 group bg-gradient-to-br from-primary to-primary-container">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent p-6 flex flex-col justify-end">
                <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">
                  Explainability Engine
                </p>
                <p className="text-white/90 text-sm font-medium">Real-time risk mapping is active.</p>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/10 ambient-shadow">
              <h4 className="font-headline font-bold text-on-surface mb-4">Need Assistance?</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">book</span>
                  <div>
                    <p className="text-sm font-semibold">Evaluation Handbook</p>
                    <p className="text-xs text-on-surface-variant">Learn how to interpret AI scores</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg">support_agent</span>
                  <div>
                    <p className="text-sm font-semibold">Senior Review</p>
                    <p className="text-xs text-on-surface-variant">Request manual expert audit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
