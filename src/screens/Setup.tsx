import { useEffect, useMemo, useState } from 'react'
import { Action, QuietAction } from '@/components/Action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Screen } from '@/components/Screen'
import { SeatRow } from '@/components/SeatRow'
import { ROLES } from '@/domain/roles'
import {
  MAX_SELECTED,
  MIN_SELECTED,
  distributionFor,
  isPlayableCount,
} from '@/domain/distribution'
import { newId } from '@/domain/engine'
import type { Person } from '@/domain/types'
import { useStore } from '@/hooks/useStore'
import { cn } from '@/lib/utils'

type Step = 'who' | 'host'

/** Mono glyphs rather than icons: the roll call is already a typed list. */
function RowButton({
  label,
  glyph,
  disabled,
  tone = 'muted',
  onClick,
}: {
  label: string
  glyph: string
  disabled?: boolean
  tone?: 'muted' | 'stamp'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-md font-mono text-sm',
        'transition-colors active:bg-accent',
        tone === 'stamp' ? 'text-stamp-bright' : 'text-muted-foreground',
        disabled && 'pointer-events-none opacity-25',
      )}
    >
      {glyph}
    </button>
  )
}

/**
 * A roster line in edit mode. The name is a draft until it is committed, so
 * clearing the field to retype does not trip the reducer's empty-name guard.
 */
function EditRow({
  person,
  index,
  first,
  last,
  duplicate,
  onRemove,
}: {
  person: Person
  index: number
  first: boolean
  last: boolean
  duplicate: boolean
  onRemove: () => void
}) {
  const { dispatch } = useStore()
  const [draft, setDraft] = useState(person.name)

  // Reordering rebinds this row to a different person.
  useEffect(() => setDraft(person.name), [person.name])

  const commit = () => {
    const name = draft.trim()
    if (!name) return setDraft(person.name)
    if (name !== person.name) dispatch({ type: 'RENAME_PERSON', id: person.id, name })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 rounded-md border border-border bg-card/45 py-1.5 pr-1 pl-4">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {String(index).padStart(2, '0')}
        </span>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Rename ${person.name}`}
          autoComplete="off"
          enterKeyHint="done"
          className="h-10 min-w-0 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
        />
        <RowButton
          label={`Move ${person.name} up`}
          glyph="↑"
          disabled={first}
          onClick={() => dispatch({ type: 'MOVE_PERSON', id: person.id, delta: -1 })}
        />
        <RowButton
          label={`Move ${person.name} down`}
          glyph="↓"
          disabled={last}
          onClick={() => dispatch({ type: 'MOVE_PERSON', id: person.id, delta: 1 })}
        />
        <RowButton
          label={`Remove ${person.name}`}
          glyph="✕"
          tone="stamp"
          onClick={onRemove}
        />
      </div>
      {/* The host calls people by name all night; two Sams is a real problem. */}
      {duplicate && (
        <span className="eyebrow px-4 text-stamp-bright">Same name as someone else</span>
      )}
    </div>
  )
}

export function Setup({ onCancel }: { onCancel: () => void }) {
  const { store, dispatch } = useStore()
  const [step, setStep] = useState<Step>('who')
  // The same group plays most nights, so start with everyone in and let the
  // host untap whoever did not show up.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(store.roster.map((p) => p.id)),
  )
  const [hostId, setHostId] = useState<string | null>(null)
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState(true)
  const [draftName, setDraftName] = useState('')
  const [editing, setEditing] = useState(false)

  const chosen = useMemo(
    () => store.roster.filter((p) => selected.has(p.id)),
    [store.roster, selected],
  )
  const playing = Math.max(0, chosen.length - 1)
  const countOk = chosen.length >= MIN_SELECTED && chosen.length <= MAX_SELECTED

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
      if (hostId === id) setHostId(null)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  // Someone you just typed in is here by definition — selecting them is not a
  // second decision the user should have to make.
  const addPerson = () => {
    const name = draftName.trim()
    if (!name) return
    const id = newId()
    dispatch({ type: 'ADD_PERSON', id, name })
    setSelected(new Set(selected).add(id))
    setDraftName('')
  }

  const allSelected = store.roster.length > 0 && chosen.length === store.roster.length

  const duplicateNames = useMemo(() => {
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const p of store.roster) {
      const key = p.name.trim().toLowerCase()
      if (seen.has(key)) dupes.add(key)
      seen.add(key)
    }
    return dupes
  }, [store.roster])

  const removePerson = (id: string) => {
    dispatch({ type: 'REMOVE_PERSON', id })
    const next = new Set(selected)
    next.delete(id)
    setSelected(next)
    if (hostId === id) setHostId(null)
  }

  if (step === 'who') {
    return (
      <Screen
        ground="night"
        eyebrow={chosen.length ? `${chosen.length} here` : 'Who is here'}
        aside={
          store.roster.length > 0 && (
            <span className="flex items-center gap-4">
              {!editing && (
                <button
                  type="button"
                  className="eyebrow text-muted-foreground"
                  onClick={() =>
                    setSelected(
                      allSelected ? new Set() : new Set(store.roster.map((p) => p.id)),
                    )
                  }
                >
                  {allSelected ? 'Clear' : 'All'}
                </button>
              )}
              <button
                type="button"
                className="eyebrow text-muted-foreground"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Done' : 'Edit'}
              </button>
            </span>
          )
        }
        footer={
          <>
            <Action
              disabled={!countOk}
              marker={countOk ? '\u2192' : null}
              onClick={() => setStep('host')}
            >
              {countOk
                ? 'Next — pick a host'
                : chosen.length > MAX_SELECTED
                  ? `Too many — remove ${chosen.length - MAX_SELECTED}`
                  : store.roster.length < MIN_SELECTED
                    ? `Add ${MIN_SELECTED - store.roster.length} more names`
                    : `Tap ${MIN_SELECTED - chosen.length} more who are here`}
            </Action>
            <QuietAction onClick={onCancel}>Back</QuietAction>
          </>
        }
      >
        <div className="flex flex-col gap-2 pb-6">
          <h1 className="display-lg">Who is here</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {editing
              ? 'Fix a spelling, put the roll call in seating order, or drop someone who has stopped coming.'
              : store.roster.length > 0
                ? 'Everyone is in. Untap whoever did not turn up. One of them hosts and sits out, so six is the minimum.'
                : 'Add everyone playing tonight. One of them hosts and sits out, so six is the minimum.'}
          </p>
        </div>

        <form
          className="flex gap-2 pb-5"
          onSubmit={(e) => {
            e.preventDefault()
            addPerson()
          }}
        >
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Add a name"
            autoComplete="off"
            enterKeyHint="done"
            className="h-12 flex-1"
          />
          <Button type="submit" variant="secondary" className="h-12 px-5">
            Add
          </Button>
        </form>

        <div className="flex flex-col gap-2 pb-4">
          {store.roster.map((person, i) =>
            editing ? (
              <EditRow
                key={person.id}
                person={person}
                index={i + 1}
                first={i === 0}
                last={i === store.roster.length - 1}
                duplicate={duplicateNames.has(person.name.trim().toLowerCase())}
                onRemove={() => removePerson(person.id)}
              />
            ) : (
              <SeatRow
                key={person.id}
                index={i + 1}
                name={person.name}
                selected={selected.has(person.id)}
                tag={selected.has(person.id) ? 'Here' : undefined}
                tagTone="plain"
                onClick={() => toggle(person.id)}
              />
            ),
          )}
          {store.roster.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add everyone playing tonight. They stay saved for next time.
            </p>
          )}
        </div>
      </Screen>
    )
  }

  const spread = isPlayableCount(playing) ? distributionFor(playing) : []

  return (
    <Screen
      ground="night"
      eyebrow="Who is hosting"
      footer={
        <>
          <Action
            disabled={!hostId || !isPlayableCount(playing)}
            marker={hostId ? '\u2192' : null}
            onClick={() =>
              hostId &&
              dispatch({
                type: 'START_GAME',
                personIds: chosen.map((p) => p.id),
                hostId,
                revealRoleOnDeath,
                now: Date.now(),
              })
            }
          >
            {hostId ? `Deal ${playing} cards` : 'Pick a host'}
          </Action>
          <QuietAction onClick={() => setStep('who')}>Back</QuietAction>
        </>
      }
    >
      <div className="flex flex-col gap-2 pb-5">
        <h1 className="display-lg">The host</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          They run the night and hold the phone. They are not dealt a card.
        </p>
      </div>

      {spread.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 rounded-md border border-border bg-card/45 px-4 py-4">
          <span className="eyebrow text-muted-foreground">
            {playing} playing · tonight’s deal
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {spread
              .filter((d) => d.count > 0)
              .map((d) => (
                <span key={d.roleId} className="flex items-baseline gap-2">
                  <span className="font-mono text-sm tabular-nums">{d.count}</span>
                  <span
                    className={cn(
                      'text-sm',
                      ROLES[d.roleId].alignment === 'mafia'
                        ? 'text-stamp-bright'
                        : 'text-muted-foreground',
                    )}
                  >
                    {ROLES[d.roleId].name}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}

      <label className="mb-5 flex items-center justify-between gap-4 rounded-md border border-border bg-card/45 px-4 py-4">
        <span className="flex flex-col gap-1">
          <span className="text-sm font-medium">Reveal roles on death</span>
          <span className="text-xs leading-relaxed text-muted-foreground">
            Announce what someone was when they die.
          </span>
        </span>
        <Switch checked={revealRoleOnDeath} onCheckedChange={setRevealRoleOnDeath} />
      </label>

      <span className="eyebrow pb-3 text-muted-foreground">Who sits out and hosts</span>
      <div className="flex flex-col gap-2 pb-4">
        {chosen.map((person, i) => (
          <SeatRow
            key={person.id}
            index={i + 1}
            name={person.name}
            selected={hostId === person.id}
            tag={hostId === person.id ? 'Host' : undefined}
            tagTone="plain"
            onClick={() => setHostId(person.id)}
          />
        ))}
      </div>
    </Screen>
  )
}
