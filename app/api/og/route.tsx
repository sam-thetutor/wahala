import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1f2937',
          backgroundImage: 'linear-gradient(to bottom right, #1f2937, #374151)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            🎯
          </div>
        </div>
        
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '10px',
          }}
        >
          Snarkels
        </div>
        
        <div
          style={{
            fontSize: '24px',
            color: '#d1d5db',
            textAlign: 'center',
            maxWidth: '600px',
            lineHeight: '1.4',
          }}
        >
          Create and participate in quiz sessions with crypto rewards
        </div>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '30px',
            fontSize: '18px',
            color: '#9ca3af',
          }}
        >
          <span>🎁</span>
          <span>Rewards</span>
          <span>•</span>
          <span>📊</span>
          <span>Quizzes</span>
          <span>•</span>
          <span>💎</span>
          <span>Celo</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
} 