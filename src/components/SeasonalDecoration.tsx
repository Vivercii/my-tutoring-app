'use client'

import { useEffect, useState } from 'react'

interface SeasonalDecorationProps {
  inline?: boolean
  size?: number
}

export default function SeasonalDecoration({ inline = false, size = 24 }: SeasonalDecorationProps) {
  const [isAnimating, setIsAnimating] = useState(true)
  const [currentSeason, setCurrentSeason] = useState<'fall' | 'winter' | 'spring' | 'summer'>('fall')

  useEffect(() => {
    // Determine current season based on month
    const month = new Date().getMonth() + 1 // 1-12
    
    if (month >= 3 && month <= 5) {
      setCurrentSeason('spring')
    } else if (month >= 6 && month <= 8) {
      setCurrentSeason('summer')
    } else if (month >= 9 && month <= 11) {
      setCurrentSeason('fall')
    } else {
      setCurrentSeason('winter')
    }

    // Stop animation after 5 seconds
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (currentSeason === 'fall') {
    if (inline) {
      return (
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          className="inline-block ml-2 opacity-70"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large detailed fall leaves for inline display */}
          <path
            d="M 6 4 Q 12 2 18 6 Q 24 10 26 16 Q 24 22 18 24 Q 12 22 8 18 Q 4 12 6 4 Z"
            fill="url(#orangeGradient)"
            className={isAnimating ? 'animate-[seasonal-gentle-sway_3s_ease-in-out_infinite]' : ''}
          />
          {/* Leaf vein */}
          <path
            d="M 8 6 Q 14 8 18 12 Q 20 16 22 20"
            stroke="#B8860B"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M 18 8 Q 20 4 26 6 Q 30 10 28 16 Q 26 20 20 22 Q 16 20 14 16 Q 16 12 18 8 Z"
            fill="url(#redGradient)"
            className={isAnimating ? 'animate-[seasonal-gentle-sway-delayed_3s_ease-in-out_infinite_0.5s]' : ''}
          />
          {/* Leaf vein */}
          <path
            d="M 18 10 Q 22 12 24 16 Q 26 18 26 20"
            stroke="#8B0000"
            strokeWidth="0.5"
            fill="none"
          />
          {/* Acorn */}
          <ellipse cx="8" cy="26" rx="3" ry="4" fill="#8B4513" opacity="0.8"
            className={isAnimating ? 'animate-[seasonal-pulse_2s_ease-in-out_infinite]' : ''} />
          <ellipse cx="8" cy="23" rx="2.5" ry="2" fill="#A0522D" opacity="0.8" />
          
          <defs>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF6347" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC143C" />
              <stop offset="100%" stopColor="#8B0000" />
            </linearGradient>
          </defs>
        </svg>
      )
    }
    
    return (
      <div className="absolute top-8 right-8 pointer-events-none z-10 w-48 h-48">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full opacity-70"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Leaves hanging from top */}
          <g className="leaves-pile">
            {/* Leaf 1 - Orange - hanging from top right */}
            <path
              d="M 90 20 Q 95 15 100 18 Q 105 22 100 25 Q 95 28 90 25 Q 85 22 90 20"
              fill="url(#orangeGradient)"
              className={isAnimating ? 'animate-gentle-sway' : ''}
              style={{ transformOrigin: '25px 102px' }}
            />
            {/* Leaf 2 - Red */}
            <path
              d="M 75 25 Q 80 20 85 23 Q 90 27 85 30 Q 80 33 75 30 Q 70 27 75 25"
              fill="url(#redGradient)"
              className={isAnimating ? 'animate-gentle-sway-delayed' : ''}
              style={{ transformOrigin: '40px 107px' }}
            />
            {/* Leaf 3 - Yellow */}
            <path
              d="M 85 35 Q 90 30 95 33 Q 100 37 95 40 Q 90 43 85 40 Q 80 37 85 35"
              fill="url(#yellowGradient)"
            />
            {/* Falling leaf - only during animation */}
            {isAnimating && (
              <path
                d="M 70 5 Q 75 0 80 3 Q 85 7 80 10 Q 75 13 70 10 Q 65 7 70 5"
                fill="url(#redGradient)"
                className="animate-fall-and-sway"
                style={{ transformOrigin: '65px -7px' }}
              />
            )}
            {/* Small acorn */}
            <ellipse cx="95" cy="42" rx="4" ry="5" fill="#8B4513" opacity="0.7" />
            <ellipse cx="95" cy="39" rx="3" ry="2" fill="#A0522D" opacity="0.7" />
          </g>
          
          {/* Gradients */}
          <defs>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFA500" />
              <stop offset="100%" stopColor="#FF6347" />
            </linearGradient>
            <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC143C" />
              <stop offset="100%" stopColor="#8B0000" />
            </linearGradient>
            <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#FFA500" />
            </linearGradient>
          </defs>
        </svg>
        
        <style jsx>{`
          @keyframes gentle-sway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(3deg); }
          }
          
          @keyframes gentle-sway-delayed {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-2deg); }
          }
          
          @keyframes fall-and-sway {
            0% { 
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            100% { 
              transform: translateY(120px) translateX(10px) rotate(360deg);
              opacity: 0.6;
            }
          }
          
          .animate-gentle-sway {
            animation: gentle-sway 3s ease-in-out;
          }
          
          .animate-gentle-sway-delayed {
            animation: gentle-sway-delayed 3s ease-in-out 0.5s;
          }
          
          .animate-fall-and-sway {
            animation: fall-and-sway 4s ease-in-out forwards;
          }
        `}</style>
      </div>
    )
  }

  if (currentSeason === 'winter') {
    if (inline) {
      return (
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          className="inline-block ml-2 opacity-60"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large detailed snowflakes for inline display */}
          {/* Main snowflake */}
          <g className={isAnimating ? 'animate-[seasonal-sparkle_2s_ease-in-out_infinite]' : ''}>
            <path
              d="M 16 4 L 16 28 M 6 16 L 26 16 M 10 10 L 22 22 M 22 10 L 10 22"
              stroke="url(#frostGradient)"
              strokeWidth="2"
              fill="none"
            />
            {/* Snowflake branches */}
            <path
              d="M 12 4 L 16 8 L 20 4 M 12 28 L 16 24 L 20 28 M 4 12 L 8 16 L 4 20 M 28 12 L 24 16 L 28 20"
              stroke="url(#frostGradient)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Center crystal */}
            <circle cx="16" cy="16" r="2" fill="white" opacity="0.9" />
          </g>
          
          {/* Smaller snowflakes */}
          <g className={isAnimating ? 'animate-[seasonal-float_3s_ease-in-out_infinite]' : ''}>
            <circle cx="8" cy="8" r="2" fill="white" opacity="0.7" />
            <path d="M 8 6 L 8 10 M 6 8 L 10 8" stroke="#7DD3FC" strokeWidth="1" />
          </g>
          
          <g className={isAnimating ? 'animate-[seasonal-pulse_2.5s_ease-in-out_infinite_0.5s]' : ''}>
            <circle cx="24" cy="24" r="1.5" fill="white" opacity="0.8" />
            <path d="M 24 22.5 L 24 25.5 M 22.5 24 L 25.5 24" stroke="#7DD3FC" strokeWidth="1" />
          </g>
          
          <defs>
            <linearGradient id="frostGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
        </svg>
      )
    }
    
    return (
      <div className="absolute top-8 right-8 pointer-events-none z-10 w-48 h-48">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full opacity-60"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Frost crystals */}
          <g className="frost">
            {/* Main frost pattern - hanging from top right */}
            <path
              d="M 115 0 L 110 10 L 115 15 L 105 20 L 110 25 L 100 30 L 105 35"
              stroke="url(#frostGradient)"
              strokeWidth="2"
              fill="none"
              className={isAnimating ? 'animate-frost-sparkle' : ''}
            />
            <path
              d="M 105 0 L 100 5 L 95 10 L 100 15 L 90 20"
              stroke="url(#frostGradient)"
              strokeWidth="1.5"
              fill="none"
              className={isAnimating ? 'animate-frost-sparkle-delayed' : ''}
            />
            {/* Small icicles hanging */}
            <path d="M 100 0 L 98 8 L 100 8 L 102 0" fill="white" opacity="0.6" />
            <path d="M 90 0 L 89 5 L 90 5 L 91 0" fill="white" opacity="0.5" />
            
            {/* Falling snowflakes - only during animation */}
            {isAnimating && (
              <>
                <circle cx="30" cy="-5" r="2" fill="white" className="animate-snow-fall" />
                <circle cx="50" cy="-5" r="1.5" fill="white" className="animate-snow-fall-delayed" />
                <circle cx="40" cy="-5" r="1" fill="white" className="animate-snow-fall-delayed-2" />
              </>
            )}
          </g>
          
          <defs>
            <linearGradient id="frostGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
        </svg>
        
        <style jsx>{`
          @keyframes frost-sparkle {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.9; }
          }
          
          @keyframes frost-sparkle-delayed {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          
          @keyframes snow-fall {
            0% { 
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            10% { opacity: 1; }
            100% { 
              transform: translateY(120px) translateX(5px);
              opacity: 0;
            }
          }
          
          @keyframes snow-fall-delayed {
            0% { 
              transform: translateY(0) translateX(0);
              opacity: 0;
            }
            10% { opacity: 1; }
            100% { 
              transform: translateY(120px) translateX(-5px);
              opacity: 0;
            }
          }
          
          .animate-frost-sparkle {
            animation: frost-sparkle 2s ease-in-out;
          }
          
          .animate-frost-sparkle-delayed {
            animation: frost-sparkle-delayed 2s ease-in-out 0.5s;
          }
          
          .animate-snow-fall {
            animation: snow-fall 3s ease-in-out forwards;
          }
          
          .animate-snow-fall-delayed {
            animation: snow-fall-delayed 3s ease-in-out 0.5s forwards;
          }
          
          .animate-snow-fall-delayed-2 {
            animation: snow-fall 3s ease-in-out 1s forwards;
          }
        `}</style>
      </div>
    )
  }

  if (currentSeason === 'spring') {
    if (inline) {
      return (
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          className="inline-block ml-2 opacity-70"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large detailed spring flowers for inline display */}
          {/* Main flower stem */}
          <line x1="16" y1="12" x2="16" y2="28" stroke="#228B22" strokeWidth="3" />
          
          {/* Large tulip flower */}
          <g className={isAnimating ? 'animate-[seasonal-bloom_2s_ease-out_forwards]' : ''}>
            <ellipse cx="16" cy="8" rx="8" ry="10" fill="url(#pinkGradient)" />
            <ellipse cx="16" cy="9" rx="6" ry="8" fill="url(#pinkInnerGradient)" />
            {/* Flower center */}
            <circle cx="16" cy="8" r="2" fill="#FFD700" opacity="0.8" />
          </g>
          
          {/* Large leaves */}
          <ellipse cx="10" cy="18" rx="6" ry="4" fill="#90EE90" transform="rotate(-20 10 18)"
            className={isAnimating ? 'animate-[seasonal-gentle-sway_3s_ease-in-out_infinite]' : ''} />
          <ellipse cx="22" cy="18" rx="6" ry="4" fill="#90EE90" transform="rotate(20 22 18)"
            className={isAnimating ? 'animate-[seasonal-gentle-sway-delayed_3s_ease-in-out_infinite_0.5s]' : ''} />
          
          {/* Small cherry blossom */}
          <g className={isAnimating ? 'animate-[seasonal-pulse_2.5s_ease-in-out_infinite_0.8s]' : ''}>
            <circle cx="26" cy="6" r="4" fill="#FFB6C1" opacity="0.8" />
            <circle cx="26" cy="6" r="2" fill="white" opacity="0.9" />
          </g>
          
          <defs>
            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB6C1" />
              <stop offset="100%" stopColor="#FF69B4" />
            </linearGradient>
            <linearGradient id="pinkInnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFC0CB" />
              <stop offset="100%" stopColor="#FFB6C1" />
            </linearGradient>
          </defs>
        </svg>
      )
    }
    
    return (
      <div className="absolute top-8 right-8 pointer-events-none z-10 w-48 h-48">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full opacity-70"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Spring flowers */}
          <g className="flowers">
            {/* Stems hanging from top */}
            <line x1="85" y1="0" x2="85" y2="20" stroke="#228B22" strokeWidth="2" />
            <line x1="95" y1="0" x2="95" y2="25" stroke="#228B22" strokeWidth="2" />
            <line x1="75" y1="0" x2="75" y2="15" stroke="#228B22" strokeWidth="1.5" />
            
            {/* Flowers */}
            {/* Tulip 1 */}
            <ellipse cx="85" cy="20" rx="8" ry="10" fill="url(#pinkGradient)" 
              className={isAnimating ? 'animate-flower-bloom' : ''} />
            {/* Tulip 2 */}
            <ellipse cx="95" cy="25" rx="7" ry="9" fill="url(#yellowSpringGradient)" 
              className={isAnimating ? 'animate-flower-bloom-delayed' : ''} />
            {/* Small flower */}
            <circle cx="75" cy="15" r="5" fill="#FFB6C1" 
              className={isAnimating ? 'animate-flower-bloom-delayed-2' : ''} />
            
            {/* Leaves */}
            <ellipse cx="80" cy="10" rx="5" ry="3" fill="#90EE90" transform="rotate(-30 80 10)" />
            <ellipse cx="100" cy="15" rx="5" ry="3" fill="#90EE90" transform="rotate(30 100 15)" />
            
            {/* Floating petal - only during animation */}
            {isAnimating && (
              <ellipse cx="60" cy="-5" rx="3" ry="4" fill="#FFB6C1" opacity="0.7"
                className="animate-petal-float" />
            )}
          </g>
          
          <defs>
            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB6C1" />
              <stop offset="100%" stopColor="#FF69B4" />
            </linearGradient>
            <linearGradient id="yellowSpringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFEB3B" />
              <stop offset="100%" stopColor="#FFC107" />
            </linearGradient>
          </defs>
        </svg>
        
        <style jsx>{`
          @keyframes flower-bloom {
            0% { 
              transform: scale(0);
              opacity: 0;
            }
            100% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes flower-bloom-delayed {
            0% { 
              transform: scale(0);
              opacity: 0;
            }
            100% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          @keyframes petal-float {
            0% { 
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            10% { opacity: 0.7; }
            100% { 
              transform: translateY(110px) translateX(15px) rotate(180deg);
              opacity: 0;
            }
          }
          
          .animate-flower-bloom {
            animation: flower-bloom 2s ease-out forwards;
          }
          
          .animate-flower-bloom-delayed {
            animation: flower-bloom-delayed 2s ease-out 0.5s forwards;
            opacity: 0;
          }
          
          .animate-flower-bloom-delayed-2 {
            animation: flower-bloom-delayed 2s ease-out 1s forwards;
            opacity: 0;
          }
          
          .animate-petal-float {
            animation: petal-float 4s ease-in-out forwards;
          }
        `}</style>
      </div>
    )
  }

  // Summer
  if (inline) {
    return (
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="inline-block ml-2 opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Large detailed summer sun for inline display */}
        {/* Sun rays */}
        <g className={isAnimating ? 'animate-[seasonal-gentle-sway_3s_ease-in-out_infinite]' : ''} style={{ transformOrigin: '16px 16px' }}>
          <line x1="16" y1="16" x2="16" y2="4" stroke="#FFD700" strokeWidth="2" />
          <line x1="16" y1="16" x2="28" y2="16" stroke="#FFD700" strokeWidth="2" />
          <line x1="16" y1="16" x2="4" y2="16" stroke="#FFD700" strokeWidth="2" />
          <line x1="16" y1="16" x2="16" y2="28" stroke="#FFD700" strokeWidth="2" />
          <line x1="16" y1="16" x2="26" y2="6" stroke="#FFD700" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="6" y2="6" stroke="#FFD700" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="26" y2="26" stroke="#FFD700" strokeWidth="1.5" />
          <line x1="16" y1="16" x2="6" y2="26" stroke="#FFD700" strokeWidth="1.5" />
        </g>
        
        {/* Large sun with gradient */}
        <circle cx="16" cy="16" r="8" fill="url(#sunGradient)" 
          className={isAnimating ? 'animate-[seasonal-pulse_2s_ease-in-out_infinite]' : ''} />
        <circle cx="16" cy="16" r="6" fill="url(#sunInnerGradient)" opacity="0.8" />
        
        {/* Sun face */}
        <circle cx="13" cy="13" r="1" fill="#FF8C00" />
        <circle cx="19" cy="13" r="1" fill="#FF8C00" />
        <path d="M 12 19 Q 16 22 20 19" stroke="#FF8C00" strokeWidth="1.5" fill="none" />
        
        <defs>
          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
          <linearGradient id="sunInnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFF99" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
  
  return (
    <div className="absolute top-8 right-8 pointer-events-none z-10 w-48 h-48">
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Summer sun */}
        <g className="sun">
          {/* Sun rays */}
          <g className={isAnimating ? 'animate-sun-rays' : ''} style={{ transformOrigin: '90px 30px' }}>
            <line x1="90" y1="30" x2="90" y2="15" stroke="#FFD700" strokeWidth="2" />
            <line x1="90" y1="30" x2="105" y2="30" stroke="#FFD700" strokeWidth="2" />
            <line x1="90" y1="30" x2="75" y2="30" stroke="#FFD700" strokeWidth="2" />
            <line x1="90" y1="30" x2="100" y2="20" stroke="#FFD700" strokeWidth="1.5" />
            <line x1="90" y1="30" x2="80" y2="20" stroke="#FFD700" strokeWidth="1.5" />
            <line x1="90" y1="30" x2="100" y2="40" stroke="#FFD700" strokeWidth="1.5" />
            <line x1="90" y1="30" x2="80" y2="40" stroke="#FFD700" strokeWidth="1.5" />
          </g>
          
          {/* Sun circle */}
          <circle cx="90" cy="30" r="10" fill="url(#sunGradient)" 
            className={isAnimating ? 'animate-sun-pulse' : ''} />
          
          {/* Small sunglasses */}
          <g transform="translate(70, 45)">
            <ellipse cx="0" cy="0" rx="5" ry="4" fill="#333" opacity="0.6" />
            <ellipse cx="12" cy="0" rx="5" ry="4" fill="#333" opacity="0.6" />
            <line x1="5" y1="0" x2="7" y2="0" stroke="#333" strokeWidth="1.5" opacity="0.6" />
          </g>
        </g>
        
        <defs>
          <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
      </svg>
      
      <style jsx>{`
        @keyframes sun-rays {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(15deg); }
        }
        
        @keyframes sun-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .animate-sun-rays {
          animation: sun-rays 3s ease-in-out;
        }
        
        .animate-sun-pulse {
          animation: sun-pulse 2s ease-in-out;
        }
      `}</style>
    </div>
  )
}