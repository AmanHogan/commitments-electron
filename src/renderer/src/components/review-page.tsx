import { useEffect, useState, type FormEvent } from 'react'
import { Save, Check } from 'lucide-react'
import type { Review, ReviewType, ReviewCategory } from '@/types/types'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'

// ─── Commitment template content ─────────────────────────────────────────────

const TEMPLATES: Record<ReviewCategory, { title: string; body: string }> = {
  bcomm1: {
    title: 'Business Partner Impact Commitment #1',
    body: `As a TDP, you will deliver valuable, measurable business impact through your Business Partner assignment.

Goals / Measures:
• Share at least three accomplishments and clearly describe how each one added business value (improved outcomes, increased efficiency, reduced risk/cost, or enhanced customer/employee experience).

Validation / Completion Criteria:
• Identified and recorded at least three distinct accomplishments completed during Business Partner assignment.
• For each accomplishment: what you did, the problem/opportunity addressed, who benefited, why it mattered, the measurable impact, and which value category it supports.`,
  },
  bcomm2: {
    title: 'AT&T / TDP Program Impact Commitment #2',
    body: `As a TDP, you will build your personal brand by actively participating in TDP and AT&T opportunities in addition to your primary Business Partner assignment.

Goals / Measures:
• Provide at least three examples of how you have distinguished yourself and engaged within the TDP program to strengthen your brand.
• Attend and actively participate in TDP experience events throughout the year.

Validation / Completion Criteria:
• Documented at least three specific examples of how you distinguished yourself and engaged within the TDP program to strengthen your professional brand.
• Attended TDP experience events throughout the year and can list the events with dates and participation.`,
  },
  dcomm1: {
    title: 'TDP Development Commitment #1',
    body: `As a TDP, you will build track-aligned technical skills, strengthen your AI capabilities, deepen your business and industry knowledge, and enhance your leadership skills.

Areas of focus:
• Technical training aligned to TDP track
• AI-focused training to apply AI in work and improve overall value add and marketability (via Growth Hub)
• Leadership/soft skills training — presentation/speaking skills, emotional intelligence, communicating effectively
• Business/industry knowledge training to understand AT&T's goals and direction
• Advanced learning (Masters', Nanodegrees, Certifications…)

GrowthHub:
• Complete all required/assigned GrowthHub training.
• Make GrowthHub usage a priority; review progress in each 1x1 with your TDP AD.

Mandatory Training:
• Complete all compliance, EH&S, Ask Yourself, and other corporate-required courses.
• Corporate Success Pathways (CSP): Complete all Drips of CSP curriculum on-time.
• Network Engineers: Complete Network 101 Series in PLE and any additional NE-specific training.

Graduation Phase:
• Collaborate with your TDP AD to meet all grad-phase milestones on-time.

Validation / Completion Criteria:
• Track and discuss development progress (including GrowthHub) in monthly 1x1s with your TDP AD.
• Document courses/training completed for inclusion in 1x1s, mid-year reviews, progression submissions, and year-end reviews.`,
  },
  dcomm2: {
    title: 'TDP Development (Innovation) Commitment #2',
    body: `As a TDP, you will complete at least two TDP innovation events or hackathons to demonstrate initiative, collaboration, and the ability to apply new skills to deliver practical, business-relevant solutions.

Innovation Participation Requirement:
Participate in at least two (2) innovation events per year:
• One (1) between Jan–Jun
• One (1) between Jul–Dec

1H 2026 Options:
• Q2 TDP Hackathon (March–May)
• ATS Software Symposium (one of the four) (Mid-May)
• Intern Innovation Challenge Coach for an intern team (June–July)
• Local Lab Project Team Member + Satisfy requirements (Ongoing)

2H 2026 Options:
• Bounty Hunters (one of the four) (June)
• Q3 TDP Hackathon (Aug–Sept)
• Bounty Hunters (one of the four) (October)
• Face the Floor (Oct–Nov)
• Local Lab Project Team Member + Satisfy requirements (Ongoing)

Validation / Completion Criteria:
• Hackathons: End-to-end participation and presenting at final demos, confirmed by your AD.
• Local Lab projects: Approved by the National AD Leads for Innovation. Validated by live national demo, 1:1 live demo, or recorded demo.
• IIC Coach: Successful submission of a patent with your intern team.`,
  },
}

const RATING_LABELS = ['Not started', 'Behind', 'On track', 'Ahead', 'Complete']

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({
  category,
  reviewType,
  review,
  onSave,
}: {
  category: ReviewCategory
  reviewType: ReviewType
  review: Review | undefined
  onSave: (category: ReviewCategory, selfAssessment: string, rating: number) => Promise<void>
}) {
  const tpl = TEMPLATES[category]
  const [selfAssessment, setSelfAssessment] = useState(review?.selfAssessment ?? '')
  const [rating, setRating] = useState(review?.rating ?? 2)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setSelfAssessment(review?.selfAssessment ?? '')
    setRating(review?.rating ?? 2)
  }, [review])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(category, selfAssessment, rating)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const ratingColor = ['text-muted-foreground', 'text-destructive', 'text-yellow-600', 'text-blue-600', 'text-green-600'][rating] ?? 'text-muted-foreground'

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4">
        <div>
          <h3 className="font-semibold text-foreground">{tpl.title}</h3>
          <span className={`mt-0.5 text-xs font-medium ${ratingColor}`}>{RATING_LABELS[rating]}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="shrink-0 rounded px-2 py-1 text-xs text-primary underline-offset-2 hover:underline"
        >
          {open ? 'Hide template' : 'Show template'}
        </button>
      </div>

      {/* Template (expandable) */}
      {open && (
        <div className="border-t border-border bg-muted/30 px-5 py-3">
          <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-sans leading-relaxed">{tpl.body}</pre>
        </div>
      )}

      {/* Self-assessment form */}
      <form onSubmit={(e) => void handleSave(e)} className="flex flex-col gap-3 border-t border-border px-5 py-4">
        {/* Rating selector */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Progress rating</Label>
          <div className="flex flex-wrap gap-2">
            {RATING_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  rating === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">
            {reviewType === 'midyear' ? 'Mid-year self-assessment' : 'End-of-year self-assessment'}
          </Label>
          <Textarea
            rows={5}
            value={selfAssessment}
            onChange={(e) => setSelfAssessment(e.target.value)}
            placeholder="Summarize your progress, key accomplishments, challenges, and what you still need to complete..."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving}>
            {saved ? <><Check className="h-4 w-4" />Saved</> : <><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Main ReviewPage component ────────────────────────────────────────────────

const CATEGORIES: ReviewCategory[] = ['bcomm1', 'bcomm2', 'dcomm1', 'dcomm2']

interface Props {
  reviewType: ReviewType
  title: string
  subtitle: string
}

export default function ReviewPage({ reviewType, title, subtitle }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    void window.api.reviews.getAll().then((all) => {
      const filtered = (all as Review[]).filter((r) => r.type === reviewType)
      setReviews(filtered)
    })
  }, [reviewType])

  function getReview(category: ReviewCategory): Review | undefined {
    return reviews.find((r) => r.category === category)
  }

  async function handleSave(category: ReviewCategory, selfAssessment: string, rating: number) {
    const result = await window.api.reviews.upsert(reviewType, category, selfAssessment, rating) as Review
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r.category === category)
      if (idx >= 0) return prev.map((r, i) => (i === idx ? result : r))
      return [...prev, result]
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => (
          <ReviewCard
            key={cat}
            category={cat}
            reviewType={reviewType}
            review={getReview(cat)}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
