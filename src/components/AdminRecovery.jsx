import { useState } from 'react'
import { ArrowLeft, Check, KeyRound, MessageCircle, Send, ShieldCheck } from 'lucide-react'

async function readResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'تعذّر إكمال طلب استعادة كلمة المرور.')
  return data
}

export default function AdminRecovery({ onBack }) {
  const [step, setStep] = useState('request')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    try {
      if (step === 'request') {
        await readResponse(await fetch('/api/admin/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request-code' }),
        }))
        setStep('reset')
        setMessage('إذا كان الاسترداد مهيّأ، أرسلنا رمزًا إلى رقم واتساب الإدارة. الرمز صالح لخمس دقائق.')
      } else {
        if (newPassword !== confirmPassword) throw new Error('كلمتا المرور غير متطابقتين.')
        await readResponse(await fetch('/api/admin/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset-password', code, newPassword }),
        }))
        setStep('complete')
        setMessage('تم تغيير كلمة المرور. سجّل الدخول باستخدام كلمة المرور الجديدة.')
        setCode('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="admin-recovery">
        <div className="admin-recovery-icon"><Check size={20} /></div>
        <h3>تم تحديث كلمة المرور</h3>
        <p className="admin-recovery-success" role="status">{message}</p>
        <button className="button button-yellow" type="button" onClick={onBack}>العودة لتسجيل الدخول <ArrowLeft size={15} /></button>
      </div>
    )
  }

  return (
    <div className="admin-recovery">
      <div className="admin-recovery-icon">{step === 'request' ? <MessageCircle size={20} /> : <ShieldCheck size={20} />}</div>
      <h3>{step === 'request' ? 'استعادة كلمة مرور الإدارة' : 'التحقق وتعيين كلمة مرور جديدة'}</h3>
      <p>{step === 'request'
        ? 'سنرسل رمز تحقق لمرة واحدة إلى رقم واتساب الإدارة الموثوق.'
        : 'أدخل الرمز المرسل إلى واتساب، ثم اختر كلمة مرور جديدة لا تقل عن 12 حرفًا.'}</p>
      {error && <p className="admin-message" role="alert">{error}</p>}
      {message && <p className="admin-recovery-success" role="status">{message}</p>}
      <form className="admin-form" onSubmit={submit}>
        {step === 'reset' && (
          <>
            <label>رمز التحقق<input type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} minLength={6} maxLength={6} pattern="\d{6}" required /></label>
            <label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
            <label>تأكيد كلمة المرور<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
          </>
        )}
        <button className="button button-yellow" type="submit" disabled={busy}>
          {busy ? 'جارٍ التحقق…' : step === 'request' ? 'إرسال رمز واتساب' : 'تغيير كلمة المرور'}
          {step === 'request' ? <Send size={15} /> : <KeyRound size={15} />}
        </button>
      </form>
      <button className="admin-recovery-back" type="button" onClick={onBack}><ArrowLeft size={14} />العودة لتسجيل الدخول</button>
    </div>
  )
}
