'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const otherId = params.userId as Id<'users'>

  const { isLoading, isAuthenticated } = useConvexAuth()
  const thread = useQuery(api.messages.thread, { otherId })
  const send = useMutation(api.messages.send)
  const markRead = useMutation(api.messages.markThreadRead)

  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth')
  }, [isLoading, isAuthenticated, router])

  // Mark the thread read whenever it loads / new messages arrive.
  useEffect(() => {
    if (thread && thread.messages.length > 0) {
      markRead({ otherId }).catch(() => {})
    }
  }, [thread, otherId, markRead])

  // Auto-scroll to newest.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await send({ recipientId: otherId, body })
      setBody('')
    } catch {
      // ignore — stays in the box to retry
    } finally {
      setSending(false)
    }
  }

  if (isLoading || thread === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }
  if (thread === null) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-2xl w-full mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/messages" className="text-gray-500 hover:text-green-600 text-xl">←</Link>
          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-green-200 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">{thread.otherName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{thread.otherName}</div>
          </div>
          <Link href={`/profile/${otherId}`} className="text-sm text-green-600 hover:underline">
            View profile
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {thread.messages.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No messages yet — say hello 👋
            </p>
          ) : (
            thread.messages.map((m) => (
              <div key={m._id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    m.fromMe
                      ? 'bg-green-500 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="bg-white border-t">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
