import { Coins, Gauge, Pause } from 'lucide-react'

export type HudData = { score: number; kmh: number; coins: number; nitro: number; boosting: boolean }

export function Hud({ data, onPause }: { data: HudData; onPause: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <p className="text-[10px] font-medium uppercase tracking-widest text-cyan-300/80">Score</p>
          <p className="font-display text-xl font-bold tabular-nums text-white">{data.score.toLocaleString()}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-end rounded-lg bg-black/50 px-3 py-1.5 backdrop-blur-sm">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-cyan-300/80">
              <Gauge className="size-3" aria-hidden="true" /> km/h
            </p>
            <p className="font-display text-xl font-bold tabular-nums text-white">{data.kmh}</p>
          </div>
          <button
            type="button"
            onClick={onPause}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <Pause className="size-4" aria-hidden="true" />
            <span className="sr-only">Pause game</span>
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 text-sm font-semibold text-yellow-300 backdrop-blur-sm">
          <Coins className="size-4" aria-hidden="true" />
          <span className="tabular-nums">{data.coins}</span>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-black/50 px-2.5 py-1.5 backdrop-blur-sm">
          <span className="font-display text-[10px] font-bold tracking-widest text-cyan-300">NITRO</span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Nitro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(data.nitro)}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-100 ${data.boosting ? 'bg-pink-500' : 'bg-cyan-400'}`}
              style={{ width: `${data.nitro}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
