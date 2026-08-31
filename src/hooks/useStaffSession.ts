import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { isSupabaseConfigured, supabase, SUPABASE_ADMINS_TABLE, SUPABASE_STAFF_TABLE } from '../lib/supabase'
import type { CompanyRole } from '../types'

export type StaffAuthStage =
  | 'setup'
  | 'sign-in'
  | 'recovery'
  | 'no-access'
  | 'mfa-setup'
  | 'mfa-challenge'
  | 'ready'

export interface VerifiedFactor {
  id: string
  friendlyName?: string
}

interface StaffSessionState {
  authStage: StaffAuthStage
  isCheckingAccess: boolean
  isSecurityBusy: boolean
  authError: string
  authMessage: string
  sessionEmail: string
  pendingEmail: string
  setPendingEmail: (value: string) => void
  currentPassword: string
  setCurrentPassword: (value: string) => void
  newPassword: string
  setNewPassword: (value: string) => void
  recoveryPassword: string
  setRecoveryPassword: (value: string) => void
  recoveryPasswordConfirm: string
  setRecoveryPasswordConfirm: (value: string) => void
  loginEmail: string
  setLoginEmail: (value: string) => void
  loginPassword: string
  setLoginPassword: (value: string) => void
  enrollmentName: string
  setEnrollmentName: (value: string) => void
  enrollmentQrCode: string
  enrollmentSecret: string
  enrollmentUri: string
  hasEnrollmentInProgress: boolean
  mfaCode: string
  setMfaCode: (value: string) => void
  verifiedFactors: VerifiedFactor[]
  selectedFactorId: string
  setSelectedFactorId: (value: string) => void
  role: CompanyRole | null
  storeId: string | null
  aal: string
  refreshAuthState: (preferredStage?: StaffAuthStage) => Promise<void>
  handleLogin: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleSendResetEmail: (targetEmail?: string) => Promise<void>
  handleLogout: () => Promise<void>
  handleRecoveryPassword: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleUpdateEmail: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleUpdatePassword: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleEnrollMfa: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleVerifyNewFactor: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleVerifyExistingFactor: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleRemoveFactor: (factorId: string) => Promise<void>
  startMfaSetup: () => void
}

interface StaffAccessResult {
  allowed: boolean
  role: CompanyRole | null
  storeId: string | null
}

const DEFAULT_MFA_NAME = 'SGS Admin Authenticator'

function resolveAuthStage(hasAccess: boolean, factorCount: number, currentLevel: string): StaffAuthStage {
  if (!hasAccess) return 'no-access'
  if (factorCount === 0) return 'mfa-setup'
  if (currentLevel !== 'aal2') return 'mfa-challenge'
  return 'ready'
}

function isMissingTableError(error: { message?: string; code?: string } | null | undefined) {
  const message = String(error?.message || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()

  return (
    message.includes('relation') ||
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    code === 'pgrst205'
  )
}

export function useStaffSession(): StaffSessionState {
  const [authStage, setAuthStage] = useState<StaffAuthStage>(isSupabaseConfigured ? 'sign-in' : 'setup')
  const [isCheckingAccess, setIsCheckingAccess] = useState(isSupabaseConfigured)
  const [isSecurityBusy, setIsSecurityBusy] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [sessionEmail, setSessionEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [enrollmentName, setEnrollmentName] = useState(DEFAULT_MFA_NAME)
  const [enrollmentFactorId, setEnrollmentFactorId] = useState('')
  const [enrollmentQrCode, setEnrollmentQrCode] = useState('')
  const [enrollmentSecret, setEnrollmentSecret] = useState('')
  const [enrollmentUri, setEnrollmentUri] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [verifiedFactors, setVerifiedFactors] = useState<VerifiedFactor[]>([])
  const [selectedFactorId, setSelectedFactorId] = useState('')
  const [role, setRole] = useState<CompanyRole | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [aal, setAal] = useState('')

  const clearEnrollment = useCallback(() => {
    setEnrollmentFactorId('')
    setEnrollmentQrCode('')
    setEnrollmentSecret('')
    setEnrollmentUri('')
    setMfaCode('')
  }, [])

  const resolveStaffAccess = useCallback(async (userId: string, email: string | null): Promise<StaffAccessResult> => {
    if (!supabase) return { allowed: false, role: null, storeId: null }

    const { data: staffRow, error: staffError } = await supabase
      .from(SUPABASE_STAFF_TABLE)
      .select('role, store_id, email')
      .eq('user_id', userId)
      .maybeSingle()

    if (staffError && !isMissingTableError(staffError)) {
      setAuthError(staffError.message)
      return { allowed: false, role: null, storeId: null }
    }

    if (staffRow) {
      return {
        allowed: true,
        role: staffRow.role as CompanyRole,
        storeId: (staffRow.store_id as string | null) ?? null,
      }
    }

    const { data: adminRow, error: adminError } = await supabase
      .from(SUPABASE_ADMINS_TABLE)
      .select('email')
      .eq('user_id', userId)
      .maybeSingle()

    if (adminError && !isMissingTableError(adminError)) {
      setAuthError(adminError.message)
      return { allowed: false, role: null, storeId: null }
    }

    if (adminRow) {
      return {
        allowed: true,
        role: email && adminRow.email === email ? 'admin' : 'admin',
        storeId: null,
      }
    }

    return { allowed: false, role: null, storeId: null }
  }, [])

  const refreshAuthState = useCallback(async (preferredStage?: StaffAuthStage) => {
    if (!supabase) return

    setIsCheckingAccess(true)
    setAuthError('')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      setAuthError(sessionError.message)
      setAuthStage('sign-in')
      setIsCheckingAccess(false)
      return
    }

    const user = sessionData.session?.user
    if (!user) {
      setSessionEmail('')
      setPendingEmail('')
      setRole(null)
      setStoreId(null)
      setVerifiedFactors([])
      setSelectedFactorId('')
      setAal('')
      setAuthStage(preferredStage === 'recovery' ? 'recovery' : 'sign-in')
      setIsCheckingAccess(false)
      return
    }

    setSessionEmail(user.email ?? '')
    setPendingEmail(user.email ?? '')

    const staffAccess = await resolveStaffAccess(user.id, user.email ?? null)
    setRole(staffAccess.role)
    setStoreId(staffAccess.storeId)

    if (!staffAccess.allowed) {
      setAuthStage('no-access')
      setIsCheckingAccess(false)
      return
    }

    const [{ data: factorsData, error: factorsError }, { data: aalData, error: aalError }] =
      await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ])

    if (factorsError || aalError) {
      setAuthError(factorsError?.message || aalError?.message || 'Unable to check MFA status.')
      setAuthStage('mfa-setup')
      setIsCheckingAccess(false)
      return
    }

    const factors = factorsData.all
      .filter((factor) => factor.factor_type === 'totp' && factor.status === 'verified')
      .map((factor) => ({ id: factor.id, friendlyName: factor.friendly_name }))

    setVerifiedFactors(factors)
    setSelectedFactorId((current) => current || factors[0]?.id || '')
    setAal(aalData.currentLevel ?? 'aal1')
    setAuthStage(preferredStage ?? resolveAuthStage(true, factors.length, aalData.currentLevel ?? 'aal1'))
    setIsCheckingAccess(false)
  }, [resolveStaffAccess])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    void refreshAuthState()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMessage('Set a new password to finish account recovery.')
        void refreshAuthState('recovery')
        return
      }

      void refreshAuthState()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [refreshAuthState])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setIsSecurityBusy(true)
    setAuthError('')
    setAuthMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password accepted. Continue with MFA to unlock staff access.')
      setLoginPassword('')
      await refreshAuthState()
    }

    setIsSecurityBusy(false)
  }

  async function handleSendResetEmail(targetEmail?: string) {
    if (!supabase) return
    const email = (targetEmail ?? loginEmail).trim()
    if (!email) {
      setAuthError('Enter the email first, then send the password setup link.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin`,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password setup/reset email sent. Open the link from your inbox and finish it on /admin.')
    }

    setIsSecurityBusy(false)
  }

  async function handleLogout() {
    if (!supabase) return
    setAuthMessage('')
    clearEnrollment()
    await supabase.auth.signOut()
  }

  async function handleRecoveryPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (recoveryPassword.length < 8) {
      setAuthError('Use at least 8 characters for the new password.')
      return
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setAuthError('The new password confirmation does not match.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.updateUser({ password: recoveryPassword })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password updated. Continue with MFA setup or sign in again if prompted.')
      setRecoveryPassword('')
      setRecoveryPasswordConfirm('')
      await refreshAuthState()
    }

    setIsSecurityBusy(false)
  }

  async function handleUpdateEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (!pendingEmail.trim()) {
      setAuthError('Enter the email address you want to use for this account.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.updateUser({ email: pendingEmail.trim() })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Check your inbox to confirm the email change.')
    }

    setIsSecurityBusy(false)
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (newPassword.length < 8) {
      setAuthError('Use at least 8 characters for the new password.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      current_password: currentPassword || undefined,
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('Password updated for this account.')
      setCurrentPassword('')
      setNewPassword('')
    }

    setIsSecurityBusy(false)
  }

  async function handleEnrollMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setIsSecurityBusy(true)
    setAuthError('')
    setAuthMessage('')
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: enrollmentName.trim() || DEFAULT_MFA_NAME,
      issuer: 'SGS Hyper Supermarket',
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setEnrollmentFactorId(data.id)
      setEnrollmentQrCode(data.totp.qr_code)
      setEnrollmentSecret(data.totp.secret)
      setEnrollmentUri(data.totp.uri)
      setAuthMessage('Scan the QR code in your authenticator app, then enter the 6-digit code below.')
    }

    setIsSecurityBusy(false)
  }

  async function handleVerifyNewFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !enrollmentFactorId) return
    if (!mfaCode.trim()) {
      setAuthError('Enter the 6-digit code from your authenticator app.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollmentFactorId,
    })

    if (challengeError) {
      setAuthError(challengeError.message)
      setIsSecurityBusy(false)
      return
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollmentFactorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    })

    if (error) {
      setAuthError(error.message)
    } else {
      clearEnrollment()
      setAuthMessage('MFA verified. This account now requires the authenticator code for access.')
      await refreshAuthState()
    }

    setIsSecurityBusy(false)
  }

  async function handleVerifyExistingFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase || !selectedFactorId) return
    if (!mfaCode.trim()) {
      setAuthError('Enter the 6-digit code from your authenticator app.')
      return
    }

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: selectedFactorId,
      code: mfaCode.trim(),
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setMfaCode('')
      setAuthMessage('MFA verified. Staff access is unlocked for this session.')
      await refreshAuthState()
    }

    setIsSecurityBusy(false)
  }

  async function handleRemoveFactor(factorId: string) {
    if (!supabase) return
    if (!window.confirm('Remove this MFA factor from the account?')) return

    setIsSecurityBusy(true)
    setAuthError('')
    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
      setAuthError(error.message)
    } else {
      setAuthMessage('MFA factor removed.')
      await refreshAuthState()
    }

    setIsSecurityBusy(false)
  }

  return {
    authStage,
    isCheckingAccess,
    isSecurityBusy,
    authError,
    authMessage,
    sessionEmail,
    pendingEmail,
    setPendingEmail,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    recoveryPassword,
    setRecoveryPassword,
    recoveryPasswordConfirm,
    setRecoveryPasswordConfirm,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    enrollmentName,
    setEnrollmentName,
    enrollmentQrCode,
    enrollmentSecret,
    enrollmentUri,
    hasEnrollmentInProgress: Boolean(enrollmentFactorId),
    mfaCode,
    setMfaCode,
    verifiedFactors,
    selectedFactorId,
    setSelectedFactorId,
    role,
    storeId,
    aal,
    refreshAuthState,
    handleLogin,
    handleSendResetEmail,
    handleLogout,
    handleRecoveryPassword,
    handleUpdateEmail,
    handleUpdatePassword,
    handleEnrollMfa,
    handleVerifyNewFactor,
    handleVerifyExistingFactor,
    handleRemoveFactor,
    startMfaSetup: () => setAuthStage('mfa-setup'),
  }
}
