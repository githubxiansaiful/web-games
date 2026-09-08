import { ImageResponse } from 'next/og';

export const alt = 'Runner Royale - 2D Multiplayer Platformer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

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
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)',
          color: 'white',
          position: 'relative',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
            padding: '8px 24px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            border: '2px solid rgba(99, 102, 241, 0.5)',
            color: '#a5b4fc',
            fontSize: '24px',
            fontWeight: 700,
          }}
        >
          ✨ REAL-TIME MULTIPLAYER 2D PLATFORMER
        </div>

        <div
          style={{
            fontSize: '80px',
            fontWeight: 900,
            letterSpacing: '-2px',
            textAlign: 'center',
            color: '#ffffff',
            marginBottom: '20px',
          }}
        >
          RUNNER ROYALE
        </div>

        <div
          style={{
            fontSize: '30px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '860px',
            lineHeight: 1.4,
          }}
        >
          Create private rooms, race friends, double-jump across moving platforms, and conquer obstacle courses together!
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '36px',
            fontSize: '22px',
            color: '#38bdf8',
            fontWeight: 700,
          }}
        >
          <span>🎮 Solo & Multiplayer</span>
          <span>•</span>
          <span>📱 Mobile & PC Touch</span>
          <span>•</span>
          <span>🏆 Race Standings</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
