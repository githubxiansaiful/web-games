import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0891b2 100%)',
          borderRadius: '40px',
          border: '4px solid #6366f1',
        }}
      >
        <div style={{ fontSize: '72px', marginBottom: '4px' }}>🏃‍♂️</div>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: '#38bdf8',
            fontFamily: 'sans-serif',
          }}
        >
          RUNNER
        </div>
      </div>
    ),
    { ...size }
  );
}
