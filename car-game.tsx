'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { HEIGHT, WIDTH, createState, draw, getKmh, getScore, update, type Input } from './engine'
import { Hud, type HudData } from './hud'
import { Overlay, type Phase } from './overlay'
import { TouchControls } from './touch-controls'

const KEY_MAP: Record<string, keyof Input> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'boost',
  KeyW: 'boost',
  Space: 'boost',
}

export function CarGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(createState())
  const inputRef = useRef<Input>({ left: false, right: false, boost: false })
  const phaseRef = useRef<Phase>('menu')

  const [phase, setPhaseState] = useState<Phase>('menu')
  const [hud, setHud] = useState<HudData>({ score: 0, kmh: 0, coins: 0, nitro: 60, boosting: false })
  const [best, setBest] = useState(0)

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }, [])

  const start = useCallback(() => {
    stateRef.current = createState()
    inputRef.current = { left: false, right: false, boost: false }
    setPhase('playing')
  }, [setPhase])

  const pause = useCallback(() => {
    if (phaseRef.current === 'playing' && !stateRef.current.crashed) {
      inputRef.current = { left: false, right: false, boost: false }
      setPhase('paused')
    }
  }, [setPhase])

  const resume = useCallback(() => setPhase('playing'), [setPhase])

  const setInput = useCallback((key: keyof Input, value: boolean) => {
    inputRef.current[key] = value
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (phaseRef.current === 'playing') pause()
        else if (phaseRef.current === 'paused') resume()
        return
      }
      const key = KEY_MAP[e.code]
      if (key && phaseRef.current === 'playing') {
        e.preventDefault()
        inputRef.current[key] = true
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = KEY_MAP[e.code]
      if (key) inputRef.current[key] = false
    }
    const onBlur = () => pause()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [pause, resume])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = WIDTH * dpr
    canvas.height = HEIGHT * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    let raf = 0
    let last = performance.now()
    let hudTimer = 0
    let overTimeout: ReturnType<typeof setTimeout> | undefined

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stateRef.current
      const current = phaseRef.current

      if (current === 'playing') {
        const events = update(s, inputRef.current, dt)
        if (events.crashed) {
          const finalScore = getScore(s)
          setBest((b) => Math.max(b, finalScore))
          overTimeout = setTimeout(() => {
            if (phaseRef.current === 'playing') setPhase('over')
          }, 1100)
        }
        hudTimer -= dt
        if (hudTimer <= 0 || events.coin || events.nitro || events.crashed) {
          hudTimer = 0.08
          setHud({ score: getScore(s), kmh: getKmh(s), coins: s.coins, nitro: s.nitro, boosting: s.boosting })
        }
      } else if (current === 'menu') {
        s.roadOffset = (s.roadOffset + 180 * dt) % 80
        s.time += dt * 0.02
      } else if (current === 'over') {
        update(s, inputRef.current, dt)
      }

      draw(ctx, s)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      if (overTimeout) clearTimeout(overTimeout)
    }
  }, [setPhase])

  return (
    <div className="relative aspect-[4/7] h-[min(100dvh,calc(100vw*7/4))] sm:h-[min(calc(100dvh-3rem),900px)] overflow-hidden rounded-none border-white/10 shadow-[0_0_60px_rgba(255,46,136,0.25)] sm:rounded-2xl sm:border">
      <canvas
        ref={canvasRef}
        className="block size-full"
        role="img"
        aria-label="Night Rush racing game: a neon highway with traffic"
      />
      {phase === 'playing' && (
        <>
          <Hud data={hud} onPause={pause} />
          <TouchControls setInput={setInput} />
        </>
      )}
      {phase !== 'playing' && (
        <Overlay
          phase={phase}
          score={hud.score}
          best={best}
          coins={hud.coins}
          onStart={start}
          onResume={resume}
        />
      )}
    </div>
  )
}
