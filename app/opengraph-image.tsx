import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'iRacing Season Planner'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #040816 0%, #0e1230 40%, #040816 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Teal glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            left: '-40px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,232,224,0.12) 0%, transparent 70%)',
          }}
        />
        {/* Rose glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '-60px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,45,138,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Season badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 20px',
            borderRadius: '999px',
            border: '1px solid rgba(255,45,138,0.4)',
            background: 'rgba(255,45,138,0.1)',
            color: '#ff2d8a',
            fontSize: '16px',
            letterSpacing: '0.08em',
            marginBottom: '32px',
          }}
        >
          2025 SEASON 2
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            iRacing
          </span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.1,
              background: 'linear-gradient(90deg, #ff2d8a, #c060ff, #00e8e0)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Season Planner
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: '24px',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: '600px',
            textAlign: 'center',
          }}
        >
          Plan your season. Save money. Race more.
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            right: '40px',
            fontSize: '18px',
            color: '#00e8e0',
            letterSpacing: '0.05em',
          }}
        >
          irsp.app
        </div>
      </div>
    ),
    { ...size },
  )
}
