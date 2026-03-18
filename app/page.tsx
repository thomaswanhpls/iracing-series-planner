import Link from 'next/link'
import { Trophy, BarChart3, MapPin, Zap } from 'lucide-react'

const features = [
  {
    icon: Trophy,
    title: 'Serieplanering',
    description: 'Välj serier och se direkt vilka banor du behöver för att nå 8/12-tröskeln.',
  },
  {
    icon: BarChart3,
    title: 'Kostnadsanalys',
    description: 'Optimerad inköpslista som maximerar värde med volymrabatter.',
  },
  {
    icon: MapPin,
    title: 'Banöversikt',
    description: 'Komplett banbibliotek med ägandestatus och korsreferenser mellan serier.',
  },
  {
    icon: Zap,
    title: 'Smart optimering',
    description: 'Greedy set cover-algoritm hittar minimala inköp för maximal deltagan.',
  },
]

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background — deep space with rose + teal bleed */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(255,45,138,0.1),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_60%,rgba(0,232,224,0.06),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(13,25,80,0.3),transparent)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        {/* Season badge */}
        <div className="mb-8 animate-fade-in rounded-full border border-[rgba(255,45,138,0.3)] bg-[rgba(255,45,138,0.07)] px-4 py-1.5 font-display text-xs tracking-wider text-[#ff2d8a] backdrop-blur-sm">
          2026 SEASON 2 — BETA
        </div>

        {/* Title */}
        <h1 className="animate-slide-up font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-b from-white to-[rgba(255,255,255,0.6)] bg-clip-text text-transparent">
            iRacing
          </span>
          <br />
          <span className="bg-gradient-to-r from-[#ff2d8a] via-[#c060ff] to-[#00e8e0] bg-clip-text text-transparent">
            Season Planner
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-lg animate-slide-up text-lg text-text-secondary [animation-delay:100ms]">
          Planera din säsong. Optimera dina inköp.
          <br />
          <span className="text-text-primary">Kör mer, betala mindre.</span>
        </p>

        {/* CTA */}
        <div className="mt-10 flex items-center gap-4 animate-slide-up [animation-delay:200ms]">
          <Link
            href="/api/auth/login"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-[#ff2d8a] px-8 py-3.5 font-display text-sm font-semibold text-white transition-all hover:shadow-[0_0_30px_rgba(255,45,138,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10">Kom igång</span>
            <Zap className="relative z-10 h-4 w-4 transition-transform group-hover:rotate-12" />
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Link>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-surface/50 px-6 py-3.5 font-display text-sm font-medium text-text-secondary backdrop-blur-sm transition-all hover:border-[rgba(0,232,224,0.3)] hover:text-text-primary hover:bg-bg-surface"
          >
            Dashboard
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-24 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border bg-bg-surface/50 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-[rgba(0,232,224,0.2)] hover:bg-bg-surface/80 hover:shadow-[0_0_40px_rgba(0,232,224,0.05)]"
            >
              <div className="mb-4 inline-flex rounded-lg bg-[rgba(0,232,224,0.08)] p-2.5 text-accent-cyan transition-colors group-hover:bg-[rgba(0,232,224,0.13)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-sm font-semibold text-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-xs text-text-muted animate-fade-in [animation-delay:500ms]">
          Byggd för iRacing-entusiaster som vill maximera sin tid på banan
        </div>
      </div>
    </main>
  )
}
