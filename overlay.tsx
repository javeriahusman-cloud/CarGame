import { Play, RotateCcw } from 'lucide-react'

export type Phase = 'menu' | 'playing' | 'paused' | 'over'

type Props = {
  phase: Exclude<Phase, 'playing'>
  score: number
  best: number
  coins: number
  onStart: () => void
  onResume: () => void
}

function Controls() {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-left text-sm text-slate-300">
      <dt className="font-mono text-cyan-300">{'← → / A D'}</dt>
      <dd>Steer</dd>
      <dt className="font-mono text-pink-400">Space / ↑</dt>
      <dd>Nitro boost</dd>
      <dt className="font-mono text-slate-400">P / Esc</dt>
      <dd>Pause</dd>
    </dl>
  )
}

export function Overlay({ phase, score, best, coins, onStart, onResume }: Props) {
  const primary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-6 py-3 font-display text-sm font-bold tracking-widest text-white shadow-[0_0_24px_rgba(255,46,136,0.6)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300'

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#070a14]/70 p-6 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        {phase === 'menu' && (
          <>
            <div>
              <h1 className="font-display text-5xl font-black leading-none tracking-tight text-white drop-shadow-[0_0_18px_rgba(255,46,136,0.8)]">
                NIGHT
                <span className="block text-pink-500">RUSH</span>
              </h1>
              <p className="mt-3 text-sm text-slate-300">
                Weave through traffic. Grab coins. Burn nitro. Don&apos;t crash.
              </p>
            </div>
            <Controls />
            <button type="button" onClick={onStart} className={primary} autoFocus>
              <Play className="size-4" aria-hidden="true" /> START
            </button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <h2 className="font-display text-4xl font-black tracking-tight text-white">PAUSED</h2>
            <Controls />
            <button type="button" onClick={onResume} className={primary} autoFocus>
              <Play className="size-4" aria-hidden="true" /> RESUME
            </button>
          </>
        )}

        {phase === 'over' && (
          <>
            <div>
              <h2 className="font-display text-4xl font-black tracking-tight text-pink-500 drop-shadow-[0_0_14px_rgba(255,46,136,0.7)]">
                WRECKED
              </h2>
              {score >= best && score > 0 && (
                <p className="mt-2 font-display text-xs font-bold tracking-widest text-yellow-300">NEW BEST!</p>
              )}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              {[
                { label: 'Score', value: score.toLocaleString() },
                { label: 'Coins', value: coins },
                { label: 'Best', value: best.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-white/10 bg-black/40 px-2 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-cyan-300/80">{s.label}</p>
                  <p className="font-display text-lg font-bold tabular-nums text-white">{s.value}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={onStart} className={primary} autoFocus>
              <RotateCcw className="size-4" aria-hidden="true" /> RACE AGAIN
            </button>
          </>
        )}
      </div>
    </div>
  )
}
