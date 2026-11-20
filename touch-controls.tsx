'use client'

import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import type { Input } from './engine'

type Key = keyof Input

export function TouchControls({ setInput }: { setInput: (key: Key, value: boolean) => void }) {
  const bind = (key: Key) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setInput(key, true)
    },
    onPointerUp: () => setInput(key, false),
    onPointerCancel: () => setInput(key, false),
    onLostPointerCapture: () => setInput(key, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const base =
    'flex select-none touch-none items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white backdrop-blur-sm active:bg-white/20'

  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:hidden">
      <div className="flex gap-3">
        <button type="button" className={`${base} size-16`} {...bind('left')}>
          <ChevronLeft className="size-8" aria-hidden="true" />
          <span className="sr-only">Steer left</span>
        </button>
        <button type="button" className={`${base} size-16`} {...bind('right')}>
          <ChevronRight className="size-8" aria-hidden="true" />
          <span className="sr-only">Steer right</span>
        </button>
      </div>
      <button type="button" className={`${base} size-16 border-pink-500/50 text-pink-400`} {...bind('boost')}>
        <Zap className="size-7" aria-hidden="true" />
        <span className="sr-only">Nitro boost</span>
      </button>
    </div>
  )
}
