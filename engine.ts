export const WIDTH = 400
export const HEIGHT = 700

const ROAD_X = 40
const ROAD_W = 320
const LANES = 4
const LANE_W = ROAD_W / LANES
const CAR_W = 50
const CAR_H = 86

const TRAFFIC_COLORS = ['#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#e2e8f0']

type Car = { x: number; y: number; w: number; h: number; speed: number; color: string; lane: number }
type Pickup = { x: number; y: number; kind: 'coin' | 'nitro'; t: number }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

export type Input = { left: boolean; right: boolean; boost: boolean }

export type GameState = {
  player: { x: number; y: number; w: number; h: number; vx: number }
  baseSpeed: number
  speed: number
  distance: number
  coins: number
  nitro: number
  boosting: boolean
  traffic: Car[]
  pickups: Pickup[]
  particles: Particle[]
  roadOffset: number
  spawnTimer: number
  pickupTimer: number
  time: number
  shake: number
  crashed: boolean
}

export type GameEvents = { crashed?: boolean; coin?: boolean; nitro?: boolean }

export function createState(): GameState {
  return {
    player: { x: WIDTH / 2 - CAR_W / 2, y: HEIGHT - CAR_H - 70, w: CAR_W, h: CAR_H, vx: 0 },
    baseSpeed: 320,
    speed: 320,
    distance: 0,
    coins: 0,
    nitro: 60,
    boosting: false,
    traffic: [],
    pickups: [],
    particles: [],
    roadOffset: 0,
    spawnTimer: 0.6,
    pickupTimer: 1.5,
    time: 0,
    shake: 0,
    crashed: false,
  }
}

export function getScore(s: GameState) {
  return Math.floor(s.distance / 10) + s.coins * 50
}

export function getKmh(s: GameState) {
  return Math.round(s.speed / 3.2)
}

const laneX = (lane: number, w: number) => ROAD_X + lane * LANE_W + (LANE_W - w) / 2

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  inset = 3,
) {
  return (
    a.x + inset < b.x + b.w - inset &&
    a.x + a.w - inset > b.x + inset &&
    a.y + inset < b.y + b.h - inset &&
    a.y + a.h - inset > b.y + inset
  )
}

function burst(s: GameState, x: number, y: number, colors: string[], count: number, power: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const v = Math.random() * power
    const max = 0.4 + Math.random() * 0.6
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: max,
      max,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
    })
  }
}

export function update(s: GameState, input: Input, dt: number): GameEvents {
  const events: GameEvents = {}
  s.time += dt
  s.shake = Math.max(0, s.shake - dt * 30)

  for (const p of s.particles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vx *= 0.96
    p.vy *= 0.96
    p.life -= dt
  }
  s.particles = s.particles.filter((p) => p.life > 0)

  if (s.crashed) {
    s.speed = Math.max(0, s.speed - 900 * dt)
    s.roadOffset = (s.roadOffset + s.speed * dt) % 80
    for (const c of s.traffic) c.y += (s.speed - c.speed * 0.3) * dt * 0.3
    return events
  }

  s.baseSpeed = Math.min(900, 320 + s.time * 9)
  s.boosting = input.boost && s.nitro > 0
  if (s.boosting) s.nitro = Math.max(0, s.nitro - 32 * dt)
  const target = s.baseSpeed * (s.boosting ? 1.6 : 1)
  s.speed += (target - s.speed) * Math.min(1, dt * 3)
  s.distance += s.speed * dt
  s.roadOffset = (s.roadOffset + s.speed * dt) % 80

  const p = s.player
  const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const maxVx = 340 + s.speed * 0.15
  if (steer !== 0) p.vx += steer * 2600 * dt
  else p.vx *= Math.pow(0.0005, dt)
  p.vx = Math.max(-maxVx, Math.min(maxVx, p.vx))
  p.x += p.vx * dt
  const minX = ROAD_X + 6
  const maxX = ROAD_X + ROAD_W - p.w - 6
  if (p.x < minX || p.x > maxX) {
    p.x = Math.max(minX, Math.min(maxX, p.x))
    p.vx *= -0.3
  }

  s.spawnTimer -= dt
  if (s.spawnTimer <= 0) {
    const lane = Math.floor(Math.random() * LANES)
    const blocked = s.traffic.filter((c) => c.y < 220).map((c) => c.lane)
    const uniqueBlocked = new Set(blocked)
    if (!uniqueBlocked.has(lane) && uniqueBlocked.size < LANES - 1) {
      const w = CAR_W + (Math.random() < 0.2 ? 4 : 0)
      const h = Math.random() < 0.2 ? 110 : CAR_H
      s.traffic.push({
        lane,
        x: laneX(lane, w),
        y: -h - 20,
        w,
        h,
        speed: 90 + Math.random() * 150,
        color: h > CAR_H ? '#94a3b8' : TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
      })
    }
    s.spawnTimer = Math.max(0.28, 0.95 - s.time * 0.012) * (0.7 + Math.random() * 0.6)
  }

  for (const c of s.traffic) {
    for (const o of s.traffic) {
      if (o !== c && o.lane === c.lane && o.y > c.y && o.y - (c.y + c.h) < 40) {
        c.speed = Math.max(c.speed, o.speed)
      }
    }
  }
  for (const c of s.traffic) c.y += (s.speed - c.speed) * dt
  s.traffic = s.traffic.filter((c) => c.y < HEIGHT + 40)

  s.pickupTimer -= dt
  if (s.pickupTimer <= 0) {
    const lane = Math.floor(Math.random() * LANES)
    const free = !s.traffic.some((c) => c.lane === lane && c.y < 160)
    if (free) {
      const kind = Math.random() < 0.22 ? 'nitro' : 'coin'
      const count = kind === 'coin' ? 3 + Math.floor(Math.random() * 3) : 1
      for (let i = 0; i < count; i++) {
        s.pickups.push({ kind, x: ROAD_X + lane * LANE_W + LANE_W / 2, y: -30 - i * 50, t: Math.random() * 6 })
      }
    }
    s.pickupTimer = 1 + Math.random() * 1.4
  }
  for (const k of s.pickups) {
    k.y += s.speed * dt
    k.t += dt
  }

  const kept: Pickup[] = []
  for (const k of s.pickups) {
    const box = { x: k.x - 14, y: k.y - 14, w: 28, h: 28 }
    if (overlaps(p, box, 2)) {
      if (k.kind === 'coin') {
        s.coins++
        events.coin = true
        burst(s, k.x, k.y, ['#facc15', '#fde68a'], 10, 160)
      } else {
        s.nitro = Math.min(100, s.nitro + 35)
        events.nitro = true
        burst(s, k.x, k.y, ['#22d3ee', '#a5f3fc'], 14, 200)
      }
      continue
    }
    if (k.y < HEIGHT + 30) kept.push(k)
  }
  s.pickups = kept

  if (s.boosting && Math.random() < 0.9) {
    s.particles.push({
      x: p.x + p.w / 2 + (Math.random() - 0.5) * 16,
      y: p.y + p.h,
      vx: (Math.random() - 0.5) * 40,
      vy: 200 + Math.random() * 120,
      life: 0.3,
      max: 0.3,
      color: Math.random() < 0.5 ? '#22d3ee' : '#ff2e88',
      size: 3 + Math.random() * 3,
    })
  }

  for (const c of s.traffic) {
    if (overlaps(p, c)) {
      s.crashed = true
      s.shake = 14
      events.crashed = true
      burst(s, p.x + p.w / 2, p.y + 10, ['#ff2e88', '#f97316', '#facc15', '#ffffff'], 60, 420)
      break
    }
  }

  return events
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  isPlayer: boolean,
  tilt = 0,
) {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate(tilt)
  const lx = -w / 2
  const ly = -h / 2

  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  roundRect(ctx, lx + 3, ly + 6, w, h, 10)
  ctx.fill()

  if (isPlayer) {
    ctx.shadowColor = color
    ctx.shadowBlur = 22
  }
  ctx.fillStyle = color
  roundRect(ctx, lx, ly, w, h, 10)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  roundRect(ctx, lx + 4, ly + 4, w - 8, h * 0.18, 6)
  ctx.fill()

  ctx.fillStyle = '#0f172a'
  roundRect(ctx, lx + 6, ly + h * 0.24, w - 12, h * 0.2, 5)
  ctx.fill()
  roundRect(ctx, lx + 7, ly + h * 0.66, w - 14, h * 0.14, 4)
  ctx.fill()

  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(lx + 6, ly + h * 0.46, w - 12, h * 0.18)

  if (isPlayer) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-2, ly + h * 0.46, 4, h * 0.18)
  }

  ctx.fillStyle = '#fef9c3'
  roundRect(ctx, lx + 4, ly + 1, 9, 5, 2)
  ctx.fill()
  roundRect(ctx, lx + w - 13, ly + 1, 9, 5, 2)
  ctx.fill()

  ctx.shadowColor = '#ef4444'
  ctx.shadowBlur = 10
  ctx.fillStyle = '#ef4444'
  roundRect(ctx, lx + 4, ly + h - 6, 10, 4, 2)
  ctx.fill()
  roundRect(ctx, lx + w - 14, ly + h - 6, 10, 4, 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.restore()
}

export function draw(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.save()
  if (s.shake > 0) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake)

  ctx.fillStyle = '#070a14'
  ctx.fillRect(-20, -20, WIDTH + 40, HEIGHT + 40)

  const offset = s.roadOffset
  for (let y = -160 + ((offset * 1.75) % 160); y < HEIGHT; y += 160) {
    for (const side of [0, 1]) {
      const px = side === 0 ? 18 : WIDTH - 18
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(px - 2, y, 4, 34)
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#67e8f9'
      ctx.beginPath()
      ctx.arc(px, y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  ctx.fillStyle = '#161a26'
  ctx.fillRect(ROAD_X, 0, ROAD_W, HEIGHT)

  ctx.shadowColor = '#ff2e88'
  ctx.shadowBlur = 12
  ctx.fillStyle = '#ff2e88'
  ctx.fillRect(ROAD_X - 3, 0, 3, HEIGHT)
  ctx.fillRect(ROAD_X + ROAD_W, 0, 3, HEIGHT)
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(226,232,240,0.55)'
  for (let lane = 1; lane < LANES; lane++) {
    const x = ROAD_X + lane * LANE_W - 2
    for (let y = -80 + offset; y < HEIGHT; y += 80) ctx.fillRect(x, y, 4, 40)
  }

  if (s.boosting || s.speed > 700) {
    const intensity = s.boosting ? 0.35 : 0.12
    ctx.strokeStyle = `rgba(165,243,252,${intensity})`
    ctx.lineWidth = 1.5
    for (let i = 0; i < 14; i++) {
      const x = ROAD_X + ((i * 97 + s.time * 13) % ROAD_W)
      const y = (i * 131 + s.time * 1600) % HEIGHT
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + 60)
      ctx.stroke()
    }
  }

  for (const k of s.pickups) {
    const bob = Math.sin(k.t * 6) * 2
    if (k.kind === 'coin') {
      const squash = Math.abs(Math.cos(k.t * 4))
      ctx.shadowColor = '#facc15'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#facc15'
      ctx.beginPath()
      ctx.ellipse(k.x, k.y + bob, 11 * Math.max(0.25, squash), 11, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#fde68a'
      ctx.beginPath()
      ctx.ellipse(k.x, k.y + bob, 5 * Math.max(0.25, squash), 5, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 18
      ctx.fillStyle = '#22d3ee'
      roundRect(ctx, k.x - 10, k.y - 14 + bob, 20, 28, 6)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#083344'
      ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', k.x, k.y + 1 + bob)
    }
  }

  for (const c of s.traffic) drawCar(ctx, c.x, c.y, c.w, c.h, c.color, false)

  const p = s.player
  if (!s.crashed) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y - 180)
    g.addColorStop(0, 'rgba(254,249,195,0.28)')
    g.addColorStop(1, 'rgba(254,249,195,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(p.x + 6, p.y + 2)
    ctx.lineTo(p.x - 24, p.y - 180)
    ctx.lineTo(p.x + p.w + 24, p.y - 180)
    ctx.lineTo(p.x + p.w - 6, p.y + 2)
    ctx.closePath()
    ctx.fill()
  }
  drawCar(ctx, p.x, p.y, p.w, p.h, s.crashed ? '#7f1d1d' : '#ff2e88', true, p.vx * 0.00035)

  for (const part of s.particles) {
    ctx.globalAlpha = Math.max(0, part.life / part.max)
    ctx.fillStyle = part.color
    ctx.fillRect(part.x - part.size / 2, part.y - part.size / 2, part.size, part.size)
  }
  ctx.globalAlpha = 1

  const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.75)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.restore()
}
