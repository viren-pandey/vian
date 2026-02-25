import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VIAN — AI App Generator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: 180,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              background: '#3b82f6',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            ◆
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-2px' }}>
            VIAN
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: '#888', marginBottom: 12, textAlign: 'center', maxWidth: 700 }}>
          AI-powered app builder
        </div>
        <div style={{ fontSize: 20, color: '#555', textAlign: 'center' }}>
          Made with VIAN by Viren Pandeyy
        </div>
      </div>
    ),
    { ...size }
  )
}
