import { Button } from '@/components/ui/button'

type Props = {
  question: string
  confirmLabel: string
  /** `secondary` for reversible things, `destructive` for the rest. */
  tone?: 'secondary' | 'destructive'
  onCancel: () => void
  onConfirm: () => void
}

/**
 * The app's one confirmation idiom. Inline rather than a nested dialog: the
 * host is mid-game with the table watching, and a modal over a modal is a
 * worse place to be asked a question than the screen you were already on.
 */
export function ConfirmRow({
  question,
  confirmLabel,
  tone = 'destructive',
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-stamp/40 bg-card px-3 py-2.5">
      <span className="min-w-0 flex-1 text-sm">{question}</span>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" variant={tone} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  )
}
