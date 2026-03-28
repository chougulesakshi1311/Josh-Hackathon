import { useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { predictCredit, submitFeedback, reExplain } from '../services/api'
import { useTranslation } from 'react-i18next'

function getFeatLabel(key, t) {
  const tk = `feat_${key}`
  const translated = t(tk)
  // if key not found, i18next returns the key itself — fall back to prettified key
  return translated === tk ? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : translated
}

function cleanText(text) {
  if (!text) return text
  return text
    .replace(/\s*\(SHAP:\s*[+-]?\d+\.\d+\)/gi, '')   // strip "(SHAP: +0.234)"
    .replace(/\bLTI ratio\b/gi, 'loan-to-income ratio')
    .replace(/\bDTI ratio\b/gi, 'debt-to-income ratio')
    .replace(/\blti_ratio\b/gi, 'loan-to-income ratio')
    .replace(/\bdti_ratio\b/gi, 'debt-to-income ratio')
    .replace(/\bLTI\b/g, 'loan-to-income')
    .replace(/\bDTI\b/g, 'debt-to-income')
    .replace(/\bSHAP\b/gi, '')
    .replace(/\bXGBoost\b/gi, 'the AI model')
    .replace(/\bfeature importance\b/gi, 'factor weight')
    .replace(/\bcredit_score_input\b/gi, 'credit history score')
    .replace(/  +/g, ' ')
    .trim()
}

const FALLBACK_EXPLANATIONS = {
  Approved: {
    en: (score, pos) => `Your application was approved with a credit score of ${score}. ${pos ? `Strong indicators like ${pos}` : 'Your overall financial profile'} worked in your favour, reflecting a low-risk profile that meets our lending criteria.`,
    hi: (score) => `आपका आवेदन ${score} क्रेडिट स्कोर के साथ स्वीकृत हुआ। आपकी वित्तीय प्रोफ़ाइल हमारी ऋण शर्तों को पूरा करती है।`,
    ta: (score) => `உங்கள் விண்ணப்பம் ${score} கடன் மதிப்பெண்ணுடன் ஒப்புதல் அளிக்கப்பட்டது. உங்கள் நிதி சுயவிவரம் எங்கள் வணிக தேவைகளை பூர்த்தி செய்கிறது.`,
    te: (score) => `మీ దరఖాస్తు ${score} క్రెడిట్ స్కోర్‌తో ఆమోదించబడింది. మీ ఆర్థిక ప్రొఫైల్ మా రుణ ప్రమాణాలకు అనుగుణంగా ఉంది.`,
    mr: (score) => `तुमचा अर्ज ${score} क्रेडिट स्कोरसह मंजूर झाला. तुमची आर्थिक प्रोफाइल आमच्या कर्ज निकषांना पूर्ण करते.`,
  },
  Rejected: {
    en: (score, _, neg) => `Your application received a credit score of ${score}, which did not meet the minimum threshold. Key concerns include ${neg || 'your current financial obligations'}. Improving these areas can significantly increase your chances next time.`,
    hi: (score) => `आपके आवेदन को ${score} क्रेडिट स्कोर मिला जो न्यूनतम सीमा से कम है। इन क्षेत्रों में सुधार करके आप अगली बार स्वीकृति पा सकते हैं।`,
    ta: (score) => `உங்கள் விண்ணப்பம் ${score} மதிப்பெண் பெற்றது, இது குறைந்தபட்ச வரம்பை பூர்த்தி செய்யவில்லை. இந்த துறைகளில் மேம்பட்டால் அடுத்த முறை வாய்ப்பு அதிகரிக்கும்.`,
    te: (score) => `మీ దరఖాస్తు ${score} స్కోర్ పొందింది, ఇది కనీస అర్హతను పూర్తి చేయలేదు. ఈ రంగాలలో మెరుగుపరిస్తే తదుపరి విజయం సాధ్యమవుతుంది.`,
    mr: (score) => `तुमच्या अर्जाला ${score} क्रेडिट स्कोर मिळाला जो किमान मर्यादेपेक्षा कमी आहे. या क्षेत्रांत सुधारणा केल्यास पुढच्या वेळी संधी वाढेल.`,
  },
  Review: {
    en: (score, pos, neg) => `Your application is under manual review with a credit score of ${score}. While ${pos || 'some factors'} are positive, ${neg || 'certain indicators'} require closer examination before a final decision.`,
    hi: (score) => `आपका आवेदन ${score} क्रेडिट स्कोर के साथ मैन्युअल समीक्षा में है। कुछ पहलुओं पर अधिक जानकारी की आवश्यकता है।`,
    ta: (score) => `உங்கள் விண்ணப்பம் ${score} மதிப்பெண்ணுடன் கைமுறை மறுஆய்வில் உள்ளது. சில காரணிகளுக்கு கூடுதல் ஆய்வு தேவை.`,
    te: (score) => `మీ దరఖాస్తు ${score} స్కోర్‌తో మాన్యువల్ సమీక్షలో ఉంది. కొన్ని అంశాలకు మరింత పరిశీలన అవసరం.`,
    mr: (score) => `तुमचा अर्ज ${score} क्रेडिट स्कोरसह मॅन्युअल पुनरावलोकनात आहे. काही बाबींसाठी अधिक तपशील आवश्यक आहे.`,
  },
}

const FALLBACK_PATH_FORWARD = {
  Approved: {
    en: '1. Make all EMI payments on time every month — this keeps your score high.\n2. Avoid taking on new loans or credit cards in the next 6 months.\n3. Keep your credit utilisation below 30% to maintain a healthy profile.',
    hi: '1. हर महीने EMI समय पर चुकाएं — इससे स्कोर मजबूत रहेगा।\n2. अगले 6 महीनों तक नए कर्ज़ या क्रेडिट कार्ड से बचें।\n3. अपनी क्रेडिट उपयोग 30% से कम रखें।',
    ta: '1. ஒவ்வொரு மாதமும் EMI சரியான நேரத்தில் செலுத்துங்கள்.\n2. அடுத்த 6 மாதங்களுக்கு புதிய கடன்களை தவிர்க்கவும்.\n3. கடன் பயன்பாட்டை 30% க்கும் குறைவாக வைத்திருங்கள்.',
    te: '1. ప్రతి నెలా EMI సకాలంలో చెల్లించండి.\n2. వచ్చే 6 నెలలు కొత్త రుణాలు తీసుకోవద్దు.\n3. క్రెడిట్ వినియోగాన్ని 30% కంటే తక్కువగా ఉంచండి.',
    mr: '1. दर महिन्याला EMI वेळेवर भरा — यामुळे स्कोर मजबूत राहतो.\n2. पुढील 6 महिने नवीन कर्ज किंवा क्रेडिट कार्ड टाळा.\n3. क्रेडिट वापर 30% पेक्षा कमी ठेवा.',
  },
  Review: {
    en: '1. Gather and submit any additional income or employment documents requested.\n2. Reduce your existing debt as much as possible before the review is finalised.\n3. Avoid any new credit enquiries during the review period.',
    hi: '1. आय या रोज़गार के अतिरिक्त दस्तावेज़ तैयार करें।\n2. समीक्षा पूरी होने से पहले मौजूदा कर्ज़ कम करें।\n3. समीक्षा के दौरान नई क्रेडिट जांच से बचें।',
    ta: '1. கூடுதல் வருமான அல்லது வேலை ஆவணங்களை சமர்ப்பிக்கவும்.\n2. மறுஆய்வு முடிவதற்கு முன் தற்போதைய கடனை குறைக்கவும்.\n3. மறுஆய்வு காலத்தில் புதிய கடன் விசாரணைகளை தவிர்க்கவும்.',
    te: '1. అదనపు ఆదాయ లేదా ఉద్యోగ పత్రాలు సమర్పించండి.\n2. సమీక్ష పూర్తవడానికి ముందు ప్రస్తుత అప్పును తగ్గించండి.\n3. సమీక్ష సమయంలో కొత్త క్రెడిట్ విచారణలు చేయవద్దు.',
    mr: '1. अतिरिक्त उत्पन्न किंवा रोजगार कागदपत्रे सादर करा.\n2. पुनरावलोकन पूर्ण होण्यापूर्वी सध्याचे कर्ज कमी करा.\n3. पुनरावलोकन काळात नवीन क्रेडिट चौकशी टाळा.',
  },
  Rejected: {
    en: '1. Work on paying down your existing debts — this has the highest impact on your score.\n2. Maintain a stable income for at least 6 months and avoid job changes before reapplying.\n3. Consider applying for a smaller loan amount that is more proportionate to your current income.',
    hi: '1. मौजूदा कर्ज़ चुकाने पर ध्यान दें — इसका स्कोर पर सबसे अधिक प्रभाव पड़ता है।\n2. कम से कम 6 महीने स्थिर आय बनाए रखें।\n3. अपनी आय के अनुपात में छोटी ऋण राशि के लिए आवेदन करें।',
    ta: '1. தற்போதைய கடன்களை திரும்ப செலுத்துவதில் கவனம் செலுத்துங்கள்.\n2. குறைந்தபட்சம் 6 மாதங்கள் நிலையான வருமானத்தை பராமரிக்கவும்.\n3. உங்கள் வருமானத்திற்கு ஏற்ற சிறிய கடன் தொகைக்கு விண்ணப்பிக்கவும்.',
    te: '1. ప్రస్తుత అప్పులు తీర్చడంపై దృష్టి పెట్టండి.\n2. కనీసం 6 నెలలు స్థిరమైన ఆదాయం కాపాడుకోండి.\n3. మీ ఆదాయానికి తగిన చిన్న రుణ మొత్తానికి దరఖాస్తు చేయండి.',
    mr: '1. सध्याचे कर्ज फेडण्यावर लक्ष केंद्रित करा — याचा स्कोरवर सर्वाधिक परिणाम होतो.\n2. किमान 6 महिने स्थिर उत्पन्न राखा आणि नोकरी बदल टाळा.\n3. तुमच्या उत्पन्नाच्या प्रमाणात लहान कर्ज रकमेसाठी अर्ज करा.',
  },
}

function getFallbackExplanation(result, formData, lang = 'en') {
  const score = result.credit_score
  const decision = result.decision
  const feats = Object.entries(result.feature_importance || {}).sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
  const topPos = feats.filter(([, v]) => v > 0).slice(0, 1).map(([k]) => k.replace(/_/g, ' '))[0]
  const topNeg = feats.filter(([, v]) => v < 0).slice(0, 1).map(([k]) => k.replace(/_/g, ' '))[0]
  const templates = FALLBACK_EXPLANATIONS[decision] || FALLBACK_EXPLANATIONS.Review
  const fn = templates[lang] || templates.en
  return fn(score, topPos, topNeg)
}

function getFallbackPathForward(decision, lang = 'en') {
  const templates = FALLBACK_PATH_FORWARD[decision] || FALLBACK_PATH_FORWARD.Rejected
  return templates[lang] || templates.en
}

export default function Report() {
  const { state } = useLocation()
  const { t, i18n } = useTranslation()

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
  const lang = i18n.language || 'en'
  const [whatIfData, setWhatIfData] = useState(formData)
  const [whatIfResult, setWhatIfResult] = useState(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackField, setFeedbackField] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [liveNL, setLiveNL] = useState(null)
  const [livePath, setLivePath] = useState(null)
  const [isReExplaining, setIsReExplaining] = useState(false)
  const prevLang = useRef(lang)

  useEffect(() => {
    if (prevLang.current === lang) return
    prevLang.current = lang
    const activeRes = whatIfResult || result
    setIsReExplaining(true)
    reExplain({
      formData,
      feature_importance: activeRes.feature_importance || {},
      decision: activeRes.decision,
      score: activeRes.credit_score,
      language: lang,
    })
      .then(data => {
        setLiveNL(data.nl_explanation || null)
        setLivePath(data.path_forward || null)
      })
      .catch(() => {
        setLiveNL(null)
        setLivePath(null)
      })
      .finally(() => setIsReExplaining(false))
  }, [lang])

  const handleFeedbackSubmit = async () => {
    if (!feedbackComment.trim()) return
    setFeedbackLoading(true)
    try {
      await submitFeedback({ application_id: reportId || '', field: feedbackField, comment: feedbackComment })
      setFeedbackSent(true)
    } catch (e) {
      console.error(e)
    } finally {
      setFeedbackLoading(false)
    }
  }

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
            <input className="bg-transparent border-none text-xs focus:ring-0 w-48 outline-none" placeholder={t('searchReportId')} type="text" />
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
                {t('creditEvaluationSummary')}
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
                {t('finalCreditScore')}
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
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {t('aiDecisionSubtext')}
              </p>
              <div className="mt-6 flex gap-3 flex-wrap">
                {activeResult.decision === 'Approved' && (
                  <>
                    <span className="bg-secondary/15 border border-secondary/40 px-3 py-1.5 rounded-full text-[12px] font-black text-secondary uppercase tracking-[0.1em] shadow-sm">{t('lowRiskProfile')}</span>
                    <span className="bg-surface-container-high border border-outline-variant/10 px-3 py-1.5 rounded-full text-[12px] font-black text-on-surface-variant uppercase tracking-[0.1em] shadow-sm">{t('standardRate')}</span>
                  </>
                )}
                {activeResult.decision === 'Rejected' && (
                  <span className="bg-error/15 border border-error/40 px-3 py-1.5 rounded-full text-[12px] font-black text-error uppercase tracking-[0.1em] shadow-sm">{t('highRiskFlags')}</span>
                )}
                {activeResult.decision === 'Review' && (
                  <span className="bg-primary/15 border border-primary/40 px-3 py-1.5 rounded-full text-[12px] font-black text-primary uppercase tracking-[0.1em] shadow-sm">{t('manualReviewQueue')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Applicant Summary */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">{t('applicantSummary')}</h3>
            </div>
            <div className="bg-surface-container-low rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-outline-variant/10">
                {[
                  [t('age'), formData.age],
                  [t('annualIncome'), `₹${formData.income.toLocaleString()}`],
                  [t('employmentType'), formData.employment_type],
                  [t('educationLevel'), formData.education_level],
                  [t('initialCreditScore'), formData.credit_score_input ?? '—'],
                  [t('requestedAmount'), `₹${formData.loan_amount.toLocaleString()}`],
                  [t('existingDebt'), formData.existing_debt ? `₹${formData.existing_debt.toLocaleString()}` : '₹0'],
                  [t('location'), formData.zip_code_group],
                ].map(([label, value]) => (
                  <div key={label} className="p-4 bg-surface-container-low">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Explanation & Impact */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">{t('explanationImpact')}</h3>
            </div>

            {/* AI plain-language explanation — always shown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className={`material-symbols-outlined text-primary text-[18px] ${isReExplaining ? 'animate-spin' : ''}`}>
                  {isReExplaining ? 'autorenew' : 'psychology'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">{t('whyThisDecision')}</p>
                {isReExplaining ? (
                  <p className="text-xs text-on-surface-variant italic">{t('regeneratingExplanation')}</p>
                ) : (
                  <p className="text-sm text-on-surface leading-relaxed">
                    {liveNL || activeResult.nl_explanation || getFallbackExplanation(activeResult, formData, lang)}
                  </p>
                )}
              </div>
            </div>

            {/* Factor summary pills */}
            {(() => {
              const signs = activeResult.explanation_signs || activeResult.explanations.map((_, i) => i % 2 === 0)
              const pos = signs.filter(Boolean).length
              const neg = signs.length - pos
              return (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {pos} {t('positiveFactor')}{pos !== 1 ? 's' : ''}
                  </span>
                  <span className="bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {neg} {t('riskFactor')}{neg !== 1 ? 's' : ''}
                  </span>
                </div>
              )
            })()}

            {/* Factor cards — clean, no raw SHAP numbers */}
            <div className="space-y-2.5">
              {(() => {
                const featureEntries = Object.entries(activeResult.feature_importance || {})
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                const totalWeight = featureEntries.reduce((s, [, v]) => s + Math.abs(v), 0) || 1

                return activeResult.explanations.map((exp, i) => {
                  const isPositive = activeResult.explanation_signs
                    ? activeResult.explanation_signs[i]
                    : i % 2 === 0
                  const [featKey, featVal] = featureEntries[i] || ['', 0]
                  const impactPct = totalWeight > 0 ? Math.round((Math.abs(featVal) / totalWeight) * 100) : 0
                  const impactLabel = impactPct >= 20 ? t('highImpact') : impactPct >= 10 ? t('mediumImpact') : t('lowImpact')
                  const featLabel = getFeatLabel(featKey, t)

                  return (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {isPositive ? 'trending_up' : 'trending_down'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface flex-1">{featLabel || `Factor ${i + 1}`}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {isPositive ? `▲ ${t('helps')}` : `▼ ${t('hurts')}`}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium ml-1">
                          {impactLabel} Impact · {impactPct}%
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full mb-2.5 overflow-hidden ml-10">
                        <div
                          className={`h-full rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`}
                          style={{ width: `${impactPct * 2.5}%`, maxWidth: '100%' }}
                        />
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed ml-10">
                        {cleanText(exp)}
                      </p>
                    </div>
                  )
                })
              })()}
            </div>
          </section>

          {/* Path Forward — always shown for every decision */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-1 h-5 rounded-full ${
                activeResult.decision === 'Approved' ? 'bg-emerald-500' :
                activeResult.decision === 'Review' ? 'bg-amber-500' : 'bg-primary'
              }`} />
              <h3 className="font-headline text-lg font-bold text-on-background">
                {activeResult.decision === 'Approved' ? t('keepScoreStrong') :
                 activeResult.decision === 'Review' ? t('watchOutFor') : t('pathToApproval')}
              </h3>
            </div>
            <div className={`rounded-xl p-6 border ${
              activeResult.decision === 'Approved'
                ? 'bg-emerald-50 border-emerald-200'
                : activeResult.decision === 'Review'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="space-y-3">
                {isReExplaining ? (
                  <p className="text-xs text-on-surface-variant italic flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                    {t('regeneratingExplanation')}
                  </p>
                ) : null}
                {!isReExplaining && (livePath || activeResult.path_forward || getFallbackPathForward(activeResult.decision, lang))
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5 ${
                        activeResult.decision === 'Approved' ? 'bg-emerald-500' :
                        activeResult.decision === 'Review' ? 'bg-amber-500' : 'bg-primary'
                      }`}>{i + 1}</span>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {line.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          {/* What-If Simulator */}
          {(activeResult.decision === 'Rejected' || activeResult.decision === 'Review') && (
            <section className="mb-12 no-print" data-html2canvas-ignore="true">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 bg-secondary rounded-full" />
                  <h3 className="font-headline text-lg font-bold text-on-background">{t('whatIfSimulator')}</h3>
                </div>
                {whatIfResult && (
                  <button
                    onClick={() => { setWhatIfData(formData); setWhatIfResult(null); }}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary-fixed transition-colors"
                  >
                    {t('resetOriginalResult')}
                  </button>
                )}
              </div>
              
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-xl p-8 ambient-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                
                <p className="text-sm text-on-surface-variant mb-8 max-w-2xl relative z-10">
                  {t('simulatorDesc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span>{t('targetIncome')}</span>
                      <span className="text-secondary font-mono">₹{whatIfData.income.toLocaleString()}</span>
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
                      <span>{t('targetLoan')}</span>
                      <span className="text-secondary font-mono">₹{whatIfData.loan_amount.toLocaleString()}</span>
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
                      <span>{t('targetScore')}</span>
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
                      <span>{t('existingDebtSim')}</span>
                      <span className="text-secondary font-mono">₹{whatIfData.existing_debt.toLocaleString()}</span>
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
                      <span>{t('employment')}</span>
                    </label>
                    <select
                      value={whatIfData.employment_type}
                      onChange={(e) => setWhatIfData({ ...whatIfData, employment_type: e.target.value })}
                      className="w-full bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30 font-bold block rounded-xl px-3 text-xs focus:border-secondary/20 focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none text-on-surface transition-all"
                      style={{ height: '40px' }}
                    >
                      <option value="Full-time">{t('opt_fulltime')}</option>
                      <option value="Part-time">{t('opt_parttime')}</option>
                      <option value="Self-employed">{t('opt_selfemployed')}</option>
                      <option value="Unemployed">{t('opt_unemployed')}</option>
                      <option value="Gig">{t('opt_gig')}</option>
                    </select>
                  </div>

                  <div className="space-y-4 bg-surface px-5 py-6 rounded-2xl border-2 border-transparent hover:border-secondary/10 hover:shadow-lg transition-all duration-300 group">
                    <label className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1 group-focus-within:text-secondary transition-colors">
                      <span>{t('educationLevel')}</span>
                    </label>
                    <select
                      value={whatIfData.education_level}
                      onChange={(e) => setWhatIfData({ ...whatIfData, education_level: e.target.value })}
                      className="w-full bg-surface-container-lowest border-2 border-transparent hover:border-outline-variant/30 font-bold block rounded-xl px-3 text-xs focus:border-secondary/20 focus:bg-white focus:ring-4 focus:ring-secondary/5 outline-none text-on-surface transition-all"
                      style={{ height: '40px' }}
                    >
                      <option value="High School">{t('opt_highschool')}</option>
                      <option value="Some College">{t('opt_somecollege')}</option>
                      <option value="Bachelor's">{t('opt_bachelors')}</option>
                      <option value="Graduate">{t('opt_graduate')}</option>
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
                      <><span className="material-symbols-outlined animate-spin text-sm">autorenew</span> {t('simulating')}</>
                    ) : (
                      <><span className="material-symbols-outlined text-sm">science</span> {t('runScenario')}</>
                    )}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Report Bias / Feedback */}
          <section className="mb-12 no-print" data-html2canvas-ignore="true">
            <div className="border border-outline-variant/20 rounded-xl p-6 bg-surface-container-low">
              {!feedbackOpen ? (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-base">flag</span>
                  {t('reportBias')}
                </button>
              ) : feedbackSent ? (
                <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {t('thankYou')}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">flag</span>
                    <h4 className="text-sm font-bold text-on-surface">{t('reportBias')}</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant">{t('reportBiasDesc')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{t('reportBiasField')}</label>
                      <select
                        value={feedbackField}
                        onChange={e => setFeedbackField(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/30"
                      >
                        <option value="">{t('selectField')}</option>
                        <option value="credit_score">{t('creditScoreDecision')}</option>
                        <option value="income">{t('incomeAssessment')}</option>
                        <option value="gender">{t('genderBiasLabel')}</option>
                        <option value="location">{t('locationBias')}</option>
                        <option value="employment">{t('employmentType')}</option>
                        <option value="other">{t('otherConcern')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">{t('reportBiasComment')}</label>
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={e => setFeedbackComment(e.target.value)}
                        placeholder={t('describeConcern')}
                        className="w-full bg-surface border border-outline-variant/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackLoading || !feedbackComment.trim()}
                      className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold disabled:opacity-50 hover:opacity-90 transition-all"
                    >
                      {feedbackLoading ? t('sending') : t('submitReport')}
                    </button>
                    <button onClick={() => setFeedbackOpen(false)} className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Charts */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="font-headline text-lg font-bold text-on-background">{t('visualCompliance')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Weight */}
              <div className="bg-surface-container p-5 rounded-xl">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  {t('featureWeight')}
                </p>
                <div className="space-y-3">
                  {(() => {
                    const entries = Object.entries(activeResult.feature_importance || {})
                      .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                      .slice(0, 10)
                    const total = entries.reduce((s, [, v]) => s + Math.abs(v), 0) || 1
                    return entries.map(([feat, val]) => {
                      const pct = Math.round((Math.abs(val) / total) * 100)
                      return (
                        <div key={feat}>
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-on-surface">{getFeatLabel(feat, t)}</span>
                            <span className={val >= 0 ? 'text-emerald-600' : 'text-red-500'}>{pct}%</span>
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
                  )()}
                </div>
              </div>

              {/* Peer Benchmarking */}
              <div className="bg-surface-container p-5 rounded-xl flex flex-col items-start justify-start h-full">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest w-full text-left">
                  {t('peerBenchmarking')}
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
                              {t('youLabel')}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between w-full mt-3 text-[8px] font-bold text-on-surface-variant uppercase">
                    <span>{t('lowScore')}</span>
                    <span>{t('highScore')}</span>
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
