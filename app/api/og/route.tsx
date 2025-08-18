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
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
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
              width: '100px',
              height: '100px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px',
              fontWeight: 'bold',
              color: 'white',
              boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)',
            }}
          >
            🎯
          </div>
        </div>
        
        <div
          style={{
            fontSize: '64px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textAlign: 'center',
            marginBottom: '15px',
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          Snarkels
        </div>
        
        <div
          style={{
            fontSize: '28px',
            color: '#ffffff',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: '1.5',
            marginBottom: '25px',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          On-chain Snarkels rewards users in interactive sessions with ERC20 tokens
        </div>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '35px',
            fontSize: '20px',
            color: '#ffffff',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
          }}
        >
          <span>🔗</span>
          <span>On-Chain</span>
          <span>•</span>
          <span>🎯</span>
          <span>Interactive</span>
          <span>•</span>
          <span>🪙</span>
          <span>ERC20</span>
        </div>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '25px',
            fontSize: '18px',
            color: '#e5e7eb',
            fontWeight: '500',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span>⚡</span>
          <span>Base Network</span>
          <span>•</span>
          <span>🎮</span>
          <span>Real-time</span>
          <span>•</span>
          <span>🏆</span>
          <span>Rewards</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
} 