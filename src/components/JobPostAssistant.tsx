'use client'

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'

export type JobDraft = {
  title: string
  description: string
  budgetMinPounds: number
  budgetMaxPounds: number
  budgetNote: string
}

type Stage =
  | { name: 'idle' }
  | { name: 'loading'; label: string }
  | { name: 'questions'; questions: string[]; answers: string[] }
  | { name: 'draft'; draft: JobDraft }
  | { name: 'applied' }
  | { name: 'unavailable' }

// Optional helper on the post-job form. It only ever PROPOSES: nothing reaches
// the form until the customer presses "Use this draft", and the form stays
// fully editable afterwards. Any failure hides the helper and the customer
// posts as normal.
export function JobPostAssistant({
  title,
  description,
  location,
  onApply,
  onUnavailable,
}: {
  title: string
  description: string
  location: string
  onApply: (draft: JobDraft) => void
  onUnavailable: () => void
}) {
  const askQuestions = useAction(api.jobPostAssistant.askQuestions)
  const proposeDraft = useAction(api.jobPostAssistant.proposeDraft)
  const [stage, setStage] = useState<Stage>({ name: 'idle' })

  const fail = () => {
    setStage({ name: 'unavailable' })
    onUnavailable()
  }

  const draft = async (answers: { question: string; answer: string }[]) => {
    setStage({ name: 'loading', label: 'Writing a suggested draft…' })
    try {
      const result = await proposeDraft({ title, description, location, answers })
      if (result.ok) setStage({ name: 'draft', draft: result.draft })
      else fail()
    } catch {
      fail()
    }
  }

  const start = async () => {
    setStage({ name: 'loading', label: 'Reading your post…' })
    try {
      const result = await askQuestions({ title, description, location })
      if (!result.ok) return fail()
      if (result.questions.length === 0) return draft([])
      setStage({
        name: 'questions',
        questions: result.questions,
        answers: result.questions.map(() => ''),
      })
    } catch {
      fail()
    }
  }

  if (stage.name === 'unavailable') {
    return (
      <p className="text-sm text-gray-500">
        The posting helper isn&apos;t available right now. You can post your job as it is.
      </p>
    )
  }

  if (stage.name === 'applied') {
    return (
      <p className="text-sm text-green-700">
        Suggested draft added below. Check it and change anything that isn&apos;t right before posting.
      </p>
    )
  }

  const ready = title.trim() !== '' && description.trim() !== ''

  return (
    <div className="border border-green-200 bg-green-50/50 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">Want help making your post clearer?</p>
          <p className="text-sm text-gray-600">
            Optional. Our AI helper asks a few quick questions, then suggests a clearer post and a
            typical price range. You choose whether to use it.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-green-800 bg-green-100 rounded px-2 py-0.5">
          AI suggestion
        </span>
      </div>

      {stage.name === 'idle' && (
        <button
          type="button"
          onClick={start}
          disabled={!ready}
          className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ready ? 'Help me improve my post' : 'Add a title and description first'}
        </button>
      )}

      {stage.name === 'loading' && (
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
          {stage.label}
        </p>
      )}

      {stage.name === 'questions' && (
        <div className="space-y-3">
          {stage.questions.map((q, i) => (
            <div key={q}>
              <label className="block text-sm text-gray-800 mb-1">{q}</label>
              <input
                type="text"
                value={stage.answers[i]}
                onChange={(e) => {
                  const answers = [...stage.answers]
                  answers[i] = e.target.value
                  setStage({ ...stage, answers })
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Leave blank to skip"
              />
            </div>
          ))}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                draft(stage.questions.map((question, i) => ({ question, answer: stage.answers[i] })))
              }
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2"
            >
              Suggest a draft
            </button>
            <button
              type="button"
              onClick={() => setStage({ name: 'idle' })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {stage.name === 'draft' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold text-gray-900">{stage.draft.title}</p>
            <p className="text-gray-700 whitespace-pre-line">{stage.draft.description}</p>
            <p className="text-gray-900">
              Typical price: <strong>£{stage.draft.budgetMinPounds} – £{stage.draft.budgetMaxPounds}</strong>
            </p>
            <p className="text-gray-500 text-xs">
              {stage.draft.budgetNote} This is an AI estimate, not a quote.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                onApply(stage.draft)
                setStage({ name: 'applied' })
              }}
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2"
            >
              Use this draft
            </button>
            <button
              type="button"
              onClick={() => setStage({ name: 'idle' })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Keep my own
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
