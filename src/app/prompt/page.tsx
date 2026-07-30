import { COACH_INSTRUCTIONS } from '@/lib/ai-practice/coach-prompt'

export default function PromptPage() {
  return (
    <pre style={{
      maxWidth: 720,
      margin: '40px auto',
      padding: '32px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 15,
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      color: '#e7e9ee',
      background: '#0e0f13',
    }}>
{`${COACH_INSTRUCTIONS}

---

Browse the topic page the user linked to read the content before starting the exercises. Do not search the web — browse the exact URL provided in the user's message.
`}</pre>
  )
}
