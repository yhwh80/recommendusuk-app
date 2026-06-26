'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCurrentUser } from '@/lib/useCurrentUser'

export default function MyProfilePage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useCurrentUser()
  const updateProfile = useMutation(api.users.updateProfile)
  const generateUploadUrl = useMutation(api.users.generateUploadUrl)
  const setProfileImage = useMutation(api.users.setProfileImage)
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId } = await res.json()
      await setProfileImage({ storageId })
    } finally {
      setUploading(false)
    }
  }

  const [form, setForm] = useState({
    name: '',
    bio: '',
    skills: '',
    hourlyRate: '',
    location: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  // Populate the form once the user's profile arrives.
  useEffect(() => {
    if (user && !hydrated) {
      setForm({
        name: user.name ?? '',
        bio: user.bio ?? '',
        skills: (user.skills ?? []).join(', '),
        hourlyRate: user.hourlyRate != null ? String(user.hourlyRate) : '',
        location: user.location ?? '',
      })
      setHydrated(true)
    }
  }, [user, hydrated])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateProfile({
        name: form.name,
        bio: form.bio,
        location: form.location,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      setMessage('Profile saved!')
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-200 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-lg font-bold text-gray-800">RecommendUsUK</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href={`/profile/${user._id}`}
                className="text-gray-600 hover:text-green-500 font-medium"
              >
                View public profile
              </Link>
              <Link
                href={`/dashboard/${user.role === 'client' ? 'client' : 'freelancer'}`}
                className="text-gray-600 hover:text-green-500 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Tell clients about yourself and showcase your skills</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-green-100 p-8 space-y-6">
          {/* Profile photo */}
          <div className="flex items-center gap-5">
            {user.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePictureUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            )}
            <div>
              <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg cursor-pointer hover:bg-gray-200">
                {uploading ? 'Uploading…' : 'Change photo'}
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} className="hidden" />
              </label>
              <p className="text-xs text-gray-500 mt-1">JPG or PNG. Saves instantly.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Describe your experience, specialisms and what makes you a great hire..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <input
              type="text"
              name="skills"
              value={form.skills}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="React, Plumbing, Logo Design (comma-separated)"
            />
            <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (£)</label>
              <input
                type="number"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                min="0"
                step="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="London, UK"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('saved')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-green-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
