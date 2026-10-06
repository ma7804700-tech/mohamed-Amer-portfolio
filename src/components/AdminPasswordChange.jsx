import { useState } from 'react'
import { Check, KeyRound, Save } from 'lucide-react'

export default function AdminPasswordChange({ onChanged }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const changePassword = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدتان غير متطابقتين.')
      return
    }

    setBusy(true)
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'تعذّر تغيير كلمة المرور.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      onChanged()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-password-panel" aria-labelledby="admin-password-title">
      <div className="admin-password-heading">
        <span><KeyRound size={18} /></span>
        <div>
          <h3 id="admin-password-title">تغيير كلمة مرور الإدارة</h3>
          <p>أدخل كلمة المرور الحالية، ثم اختر كلمة مرور جديدة لا تقل عن 12 حرفًا.</p>
        </div>
      </div>
      {error && <p className="admin-message" role="alert">{error}</p>}
      <form className="admin-form admin-password-form" onSubmit={changePassword}>
        <label>كلمة المرور الحالية<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} maxLength={128} required /></label>
        <label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
        <label>تأكيد كلمة المرور الجديدة<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} maxLength={128} required /></label>
        <button className="button button-yellow" type="submit" disabled={busy}>
          {busy ? 'جارٍ تغيير كلمة المرور…' : 'حفظ كلمة المرور الجديدة'}
          {busy ? <Check size={15} /> : <Save size={15} />}
        </button>
      </form>
    </section>
  )
}
