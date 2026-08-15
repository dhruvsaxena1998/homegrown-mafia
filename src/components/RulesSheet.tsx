import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NIGHT_ORDER, ROLES, ROLE_IDS } from '@/domain/roles'
import { MAX_PLAYING, MIN_PLAYING, mafiaTable } from '@/domain/distribution'
import { cn } from '@/lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="eyebrow border-b border-border pb-2 text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * Rendered from the role registry and the count table rather than written out,
 * so the rules a player reads are the rules the engine actually runs.
 */
export function RulesSheet() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="How to play"
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full border border-border',
            'font-mono text-xs text-muted-foreground transition-colors active:bg-accent',
          )}
        >
          ?
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <DialogTitle className="display-lg text-2xl">How to play</DialogTitle>
          <DialogDescription className="text-sm">
            {MIN_PLAYING} to {MAX_PLAYING} players, plus a host who sits out.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-7 overflow-y-auto px-6 pb-8">
          <Section title="The idea">
            <p className="text-sm leading-relaxed text-muted-foreground">
              A few people at the table are Mafia and know each other. Everyone
              else knows only their own card. The Mafia kill one person each
              night; the town votes one person out each day. Whichever side runs
              out of the other first wins.
            </p>
          </Section>

          <Section title="The roles">
            <div className="flex flex-col gap-4">
              {ROLE_IDS.map((id) => {
                const role = ROLES[id]
                return (
                  <div key={id} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          'font-display text-lg uppercase',
                          role.alignment === 'mafia' && 'text-stamp-bright',
                        )}
                      >
                        {role.name}
                      </span>
                      <span className="eyebrow text-muted-foreground">
                        {role.alignment === 'mafia' ? 'Mafia' : 'Town'}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-muted-foreground">
                      {role.cardText}
                    </p>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="The night">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Everyone shuts their eyes. The host wakes each role in turn, and
              only that role opens their eyes.
            </p>
            <ol className="flex flex-col gap-2.5">
              {NIGHT_ORDER.map((role, i) => (
                <li key={role.id} className="flex gap-3">
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 text-sm leading-snug">
                    <span
                      className={cn(
                        'font-medium',
                        role.alignment === 'mafia' && 'text-stamp-bright',
                      )}
                    >
                      {role.name}.{' '}
                    </span>
                    <span className="text-muted-foreground">{role.nightText}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If the Doctor saved whoever the Mafia chose, nobody dies. The host
              announces only that — never who was attacked or who was saved.
            </p>
          </Section>

          <Section title="The day">
            <p className="text-sm leading-relaxed text-muted-foreground">
              The town wakes, hears who died, and argues. When the table settles
              on a name, that player is voted out and the app records it. The
              table can also decide nobody hangs. Voting happens out loud, not on
              the phone.
            </p>
          </Section>

          <Section title="Winning">
            <div className="flex flex-col gap-2.5">
              <p className="text-sm leading-snug">
                <span className="font-medium">Town wins</span>
                <span className="text-muted-foreground">
                  {' '}
                  the moment the last Mafia is gone.
                </span>
              </p>
              <p className="text-sm leading-snug">
                <span className="font-medium text-stamp-bright">Mafia win</span>
                <span className="text-muted-foreground">
                  {' '}
                  as soon as they are as many as everyone else — at that point
                  they cannot be outvoted.
                </span>
              </p>
            </div>
          </Section>

          <Section title="How many Mafia">
            <div className="flex flex-col">
              {mafiaTable().map(({ range, mafia }) => (
                <div
                  key={range}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-0"
                >
                  <span className="font-mono text-sm tabular-nums">
                    {range} playing
                  </span>
                  <span className="eyebrow text-stamp-bright">
                    {mafia} mafia
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              One Detective and one Doctor at every size. Everyone else is a
              Civilian.
            </p>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
