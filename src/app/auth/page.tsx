'use client'

import { Suspense, useState, useEffect } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth } from 'convex/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function AuthPageInner() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'client' | 'freelancer'>('client')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<
    'credentials' | 'verify' | 'reset-request' | 'reset-code'
  >('credentials')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  const { signIn } = useAuthActions()
  const { isAuthenticated } = useConvexAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Navigate ONLY once the login is actually confirmed client-side — avoids the
  // race where we'd redirect before auth settled (blank screen / retry needed).
  useEffect(() => {
    if (isAuthenticated && redirectTo) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router])

  useEffect(() => {
    if (searchParams.get('signup')) {
      setIsLogin(false)
    }
    const roleParam = searchParams.get('type')
    if (roleParam === 'client' || roleParam === 'freelancer') {
      setRole(roleParam)
      setIsLogin(false)
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        await signIn('password', { email, password, flow: 'signIn' })
        setRedirectTo('/dashboard') // navigate once auth confirms (see effect)
      } else {
        // Sign up — Convex Auth emails a verification code and does NOT sign in
        // yet. We move to the "enter code" step. profile() sets name/role/credits.
        await signIn('password', { email, password, name, role, flow: 'signUp' })
        setStep('verify')
        setMessage('We emailed you a 6-digit code — enter it below to finish.')
      }
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'An error occurred. Check your email and password (min 8 characters).',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      // 1) Confirm the email with the code, then 2) sign in with the password
      // they just set, so they land straight in their dashboard (no re-login).
      await signIn('password', { email, code, flow: 'email-verification' })
      await signIn('password', { email, password, flow: 'signIn' })
      setRedirectTo(role === 'client' ? '/dashboard/client' : '/dashboard/freelancer')
    } catch {
      setMessage('That code was wrong or expired. Check your email and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend the signup verification code (re-triggers the signUp flow).
  const handleResendVerify = async () => {
    setLoading(true)
    setMessage('')
    try {
      await signIn('password', { email, password, name, role, flow: 'signUp' })
      setMessage('New code emailed — check your inbox (and spam).')
    } catch {
      setMessage('Could not resend right now. Wait a minute and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Resend the password-reset code.
  const handleResendReset = async () => {
    setLoading(true)
    setMessage('')
    try {
      await signIn('password', { email, flow: 'reset' })
      setMessage('New reset code emailed — check your inbox (and spam).')
    } catch {
      setMessage('Could not resend right now. Wait a minute and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password — step 1: email the reset code.
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await signIn('password', { email, flow: 'reset' })
      setStep('reset-code')
      setMessage('We emailed you a reset code — enter it with a new password.')
    } catch {
      setMessage('Could not send a reset code. Check the email address and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password — step 2: verify the code + set the new password.
  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await signIn('password', { email, code, newPassword, flow: 'reset-verification' })
      // Belt-and-suspenders: sign in with the new password so they land straight in.
      await signIn('password', { email, password: newPassword, flow: 'signIn' })
      setRedirectTo('/dashboard')
    } catch {
      setMessage('That code was wrong/expired, or the password is too short (8+ chars).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-xl font-bold text-gray-800">RecommendUsUK</span>
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome back' : 'Join the marketplace'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account and get started'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter the 6-digit code we emailed to <strong>{email}</strong>.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.includes('wrong') || message.includes('expired')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || redirectTo !== null}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify & continue'}
              </button>
              <button
                type="button"
                onClick={handleResendVerify}
                disabled={loading || redirectTo !== null}
                className="w-full text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                Didn&apos;t get it? Resend code
              </button>
              <button
                type="button"
                onClick={() => { setStep('credentials'); setMessage('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                ← Use a different email
              </button>
            </form>
          ) : step === 'reset-request' ? (
            <form onSubmit={handleResetRequest} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter your account email and we&apos;ll send a reset code.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="you@example.com"
                />
              </div>
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.includes('emailed')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>{message}</div>
              )}
              <button type="submit" disabled={loading || redirectTo !== null}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Sending…' : 'Send reset code'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setMessage('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700">← Back to sign in</button>
            </form>
          ) : step === 'reset-code' ? (
            <form onSubmit={handleResetVerify} className="space-y-4">
              <p className="text-gray-600 text-sm">
                Enter the code we emailed to <strong>{email}</strong> and choose a new password.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset code</label>
                <input
                  value={code} onChange={(e) => setCode(e.target.value)} required inputMode="numeric" maxLength={6}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-green-600">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.includes('emailed')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>{message}</div>
              )}
              <button type="submit" disabled={loading || redirectTo !== null}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                {loading ? 'Resetting…' : 'Reset password & sign in'}
              </button>
              <button type="button" onClick={handleResendReset} disabled={loading || redirectTo !== null}
                className="w-full text-sm text-green-600 hover:text-green-700 disabled:opacity-50">Didn&apos;t get it? Resend code</button>
              <button type="button" onClick={() => { setStep('credentials'); setMessage('') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700">← Back to sign in</button>
            </form>
          ) : (
          <>
          {/* Continue with Google */}
          <button
            type="button"
            onClick={() => signIn('google', { redirectTo: '/onboarding' })}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
            </svg>
            Continue with Google
          </button>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-sm"><span className="bg-white px-3 text-gray-400">or</span></div>
          </div>
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">I want to:</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    role === 'client'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-semibold">Hire</div>
                  <div className="text-sm text-gray-600">25 credits</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    role === 'freelancer'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-semibold">Work</div>
                  <div className="text-sm text-gray-600">10 credits</div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-green-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {!isLogin && (
                <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('success')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || redirectTo !== null}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {isLogin && (
            <div className="mt-3 text-center">
              <button
                onClick={() => { setStep('reset-request'); setMessage('') }}
                className="text-sm text-gray-500 hover:text-green-600"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
              }}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to homepage
            </Link>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  )
}
