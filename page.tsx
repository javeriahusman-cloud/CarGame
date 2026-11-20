import { CarGame } from '@/components/game/car-game'

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,#1a1030_0%,#070a14_60%)] sm:py-6">
      <CarGame />
    </main>
  )
}
