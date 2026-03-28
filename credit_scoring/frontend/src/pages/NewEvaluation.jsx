import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

const PURPOSE_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'Auto', label: 'Auto' },
  { value: 'Business', label: 'Business' },
  { value: 'Education', label: 'Education' },
  { value: 'Medical', label: 'Medical' },
  { value: 'Other', label: 'Other' },
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
  loan_purpose: 'Other',
  loan_amount: '',
  existing_debt: '',
  credit_score_input: 650,
  no_credit_score: false,
}

const FORM_FIELDS = [
  'age', 'income', 'employment_type', 'education_level', 
  'gender', 'race', 'citizenship_status', 'zip_code_group', 
  'loan_amount', 'existing_debt'
]

export default function NewEvaluation() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { t } = useTranslation()

  const calculateProgress = () => {
    const filled = FORM_FIELDS.filter(field => !!form[field]).length
    return Math.round((filled / FORM_FIELDS.length) * 100)
  }

  const progress = calculateProgress()
  const isReady = progress === 100

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
        loan_purpose: form.loan_purpose,
        loan_amount: Number(String(form.loan_amount).replace(/,/g, '')),
        existing_debt: Number(String(form.existing_debt).replace(/,/g, '')),
        credit_score_input: form.no_credit_score ? null : Number(form.credit_score_input),
        language: localStorage.getItem('language') || 'en',
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
      <Navbar />

      <main className="ml-64 p-12 max-w-[1440px] mx-auto">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">
            {t('newEvaluation')}
          </h2>
          <p className="text-on-surface-variant font-sans">
            Initiate a deep-layer credit risk assessment. Our AI models curate data points to
            provide an explainable transparency score alongside the primary decision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Applicant Profile */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Applicant Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">{t('age')}</label>
                    <input name="age" type="number" min="18" max="100" required value={form.age} onChange={handleChange} placeholder="e.g. 34" className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none hover:border-outline-variant/30" />
                  </div>
                  <div className="space-y-2 group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">
                      {t('annualIncome')}
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Total gross annual earnings before tax">info</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">₹</span>
                      <input name="income" type="text" required value={form.income} onChange={handleChange} placeholder="75,000" className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 pl-9 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none hover:border-outline-variant/30" />
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
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">{t('gender')}</label>
                    <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
                      {GENDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">{t('race')}</label>
                    <select name="race" value={form.race} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
                      {RACE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">Citizenship</label>
                    <select name="citizenship_status" value={form.citizenship_status} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
                      {CITIZENSHIP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">Location Type</label>
                    <select name="zip_code_group" value={form.zip_code_group} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
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
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">{t('educationLevel')}</label>
                    <select name="education_level" value={form.education_level} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
                      {EDUCATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">{t('employmentType')}</label>
                    <select name="employment_type" value={form.employment_type} onChange={handleChange} className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none appearance-none hover:border-outline-variant/30">
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
                  <label className="flex items-center gap-3 p-4 bg-surface border-2 border-transparent rounded-xl cursor-pointer hover:border-primary/10 hover:bg-white transition-all">
                    <input type="checkbox" name="criminal_record" checked={form.criminal_record} onChange={handleChange} className="w-5 h-5 accent-primary rounded shadow-inner" />
                    <span className="text-sm font-semibold text-on-surface">Prior Criminal Record</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-surface border-2 border-transparent rounded-xl cursor-pointer hover:border-primary/10 hover:bg-white transition-all">
                    <input type="checkbox" name="disability_status" checked={form.disability_status} onChange={handleChange} className="w-5 h-5 accent-primary rounded shadow-inner" />
                    <span className="text-sm font-semibold text-on-surface">Disability Status (Optional Feature)</span>
                  </label>
                </div>
              </section>

              {/* Financial Liability */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Financial Liability & Purpose
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-on-surface font-label ml-1">Loan Purpose</label>
                    <select name="loan_purpose" value={form.loan_purpose} onChange={handleChange} className="w-full bg-surface border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all font-body outline-none appearance-none">
                      {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                      {t('loanAmount')}
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Principal amount the applicant is seeking">help</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">₹</span>
                      <input name="loan_amount" type="text" required value={form.loan_amount} onChange={handleChange} placeholder="250,000" className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 pl-9 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none hover:border-outline-variant/30" />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1 group-focus-within:text-primary transition-colors">
                      {t('existingDebt')}
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Total outstanding liabilities">info</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">₹</span>
                      <input name="existing_debt" type="text" required value={form.existing_debt} onChange={handleChange} placeholder="12,400" className="w-full bg-surface border-2 border-transparent rounded-xl p-3.5 pl-9 text-sm focus:border-primary/20 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all font-body outline-none hover:border-outline-variant/30" />
                    </div>
                  </div>
                </div>
              </section>

              {/* Credit History */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-6 font-label">
                  Credit History
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 bg-surface border-2 border-transparent rounded-xl cursor-pointer hover:border-primary/10 transition-all">
                    <input
                      type="checkbox"
                      name="no_credit_score"
                      checked={form.no_credit_score}
                      onChange={handleChange}
                      className="w-5 h-5 accent-primary rounded"
                    />
                    <div>
                      <p className="text-sm font-semibold text-on-surface">I don't have a CIBIL / credit score</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">If you've never taken a loan or credit card, leave this checked. We'll estimate based on your other details.</p>
                    </div>
                  </label>
                  {!form.no_credit_score && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-on-surface font-label ml-1">
                        {t('creditScore')}
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant cursor-help" title="Your existing credit score from CIBIL or another bureau (300–850)">analytics</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <input name="credit_score_input" type="range" min="300" max="850" value={form.credit_score_input} onChange={handleChange} className="flex-1 accent-primary h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer" />
                        <span className="bg-primary-fixed text-on-primary-fixed-variant px-3 py-1 rounded-full text-xs font-bold min-w-[48px] text-center">
                          {form.credit_score_input}
                        </span>
                      </div>
                    </div>
                  )}
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
                      {t('submitEvaluation')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 content-start">
            {/* AI Readiness Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-lg group hover:-translate-y-1 transition-all duration-500 overflow-hidden relative flex flex-col h-[280px]">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 w-full h-full flex flex-col">
                <div className="flex justify-between items-center gap-2 mb-4">
                  <h4 className="font-headline font-bold text-on-surface tracking-tight text-xs uppercase tracking-[0.2em] opacity-80">AI Readiness</h4>
                  <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm border ${isReady ? 'bg-[#15803d]/15 text-[#15803d] border-[#15803d]/40' : 'bg-primary/15 text-primary border-primary/40 animate-pulse'}`}>
                    {isReady ? 'Optimized' : 'In Progress'}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative shrink-0">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-surface-container-high" />
                      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * progress) / 100} className="text-primary transition-all duration-1000 ease-out" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black font-headline text-on-surface">{progress}%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-on-surface-variant leading-relaxed font-semibold mb-1 uppercase tracking-tighter opacity-70">Model Precision</p>
                    <p className="text-[10px] text-on-surface-variant leading-tight font-medium">
                      {progress < 100 ? `Complete all fields for maximum decision precision.` : `Data parameters are fully optimized for analysis.`}
                    </p>
                  </div>
                </div>
              </div>
            </div>



            {/* Submission Checklist */}
            <div className="bg-white rounded-2xl p-6 border-2 border-[#15803d]/10 shadow-lg flex flex-col items-start h-[280px]">
              <h4 className="font-headline font-bold text-[#15803d] mb-4 text-[10px] uppercase tracking-[0.2em] opacity-80 border-b border-[#15803d]/10 w-full pb-2">Ready for Submission</h4>
              <div className="grid grid-cols-1 gap-3 w-full flex-1 justify-center">
                {[
                  { label: 'Demographics Integrity', key: 'gender' },
                  { label: 'Financial Capacity', key: 'income' },
                  { label: 'Liability Assessment', key: 'loan_amount' },
                  { label: 'Historical Benchmarking', key: 'credit_score_input' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm border ${form[item.key] ? 'bg-[#15803d]/20 text-[#15803d] border-[#15803d]/30 scale-105 shadow-md' : 'bg-surface-container-high/40 text-on-surface-variant/40 border-transparent'}`}>
                      <span className="material-symbols-outlined text-[14px] font-black">{form[item.key] ? 'check_circle' : 'radio_button_unchecked'}</span>
                    </div>
                    <span className={`text-[11px] block font-bold transition-colors ${form[item.key] ? 'text-on-surface' : 'text-on-surface-variant opacity-60'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  )
}
