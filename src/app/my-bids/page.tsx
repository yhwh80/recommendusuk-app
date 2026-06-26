'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'

type Bid = {
  _id: Id<'bids'>
  amount: number
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  job: { _id: Id<'jobs'>; title: string } | null
}

function BidRow({ bid }: { bid: Bid }) {
  const updateBid = useMutation(api.bids.update)
  const withdrawBid = useMutation(api.bids.withdraw)
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(bid.amount / 100))
  const [msg, setMsg] = useState(bid.message)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      await updateBid({
        bidId: bid._id,
        amount: Math.round(parseFloat(amount) * 100),
        message: msg,
      })
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async () => {
    if (!window.confirm('Withdraw this proposal? This cannot be undone.')) return
    setBusy(true)
    try {
      await withdrawBid({ bidId: bid._id })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-green-100 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href={bid.job ? `/jobs/${bid.job._id}` : '#'} className="font-semibold text-gray-900 hover:text-green-600">
            {bid.job?.title || 'Job removed'}
          </Link>
          {!editing && (
            <>
              <p className="text-gray-600 text-sm mt-1">
                Your bid: <span className="font-medium text-green-600">£{(bid.amount / 100).toLocaleString()}</span>
              </p>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{bid.message}</p>
            </>
          )}
        </div>
        <span className={`ml-4 inline-flex px-3 py-1 rounded-full text-xs font-medium ${
          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {bid.status}
        </span>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bid Amount (£)</label>
            <input
              type="number" min="1" step="0.01" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <textarea
            value={msg} onChange={(e) => setMsg(e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-gray-600 text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Actions for pending bids */}
      {bid.status === 'pending' && !editing && (
        <div className="mt-3 flex gap-3 pt-3 border-t border-gray-100">
          <button onClick={() => setEditing(true)} className="text-sm text-green-600 font-medium hover:underline">
            ✏️ Edit
          </button>
          <button onClick={withdraw} disabled={busy} className="text-sm text-red-600 font-medium hover:underline disabled:opacity-50">
            🗑 Withdraw
          </button>
        </div>
      )}
    </div>
  )
}

export default function MyBidsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const myBids = useQuery(api.bids.listMine)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  if (isLoading || myBids === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Link href="/jobs" className="text-gray-600 hover:text-green-600 font-medium">Browse Jobs</Link>
              <Link href="/dashboard/freelancer" className="text-gray-600 hover:text-green-600 font-medium">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Proposals</h1>
          <p className="text-gray-600">Track, edit or withdraw the proposals you&apos;ve submitted</p>
        </div>

        {myBids.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-6">Browse open jobs and submit your first proposal.</p>
            <Link href="/jobs" className="inline-flex items-center px-6 py-3 bg-green-400 text-white font-medium rounded-lg hover:bg-green-500 transition-colors">
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myBids.map((bid) => (
              <BidRow key={bid._id} bid={bid as Bid} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
