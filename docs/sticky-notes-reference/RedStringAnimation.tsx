import React from 'react';

interface RedStringAnimationProps {
  connections: Array<{
    id: string;
    point1: [number, number];
    point2: [number, number];
  }>;
  animated?: boolean;
}

const RedStringAnimation: React.FC<RedStringAnimationProps> = ({ 
  connections,
  animated = false
}) => {
  return (
    <>
      {connections.map(conn => {
        const [x1, y1] = conn.point1;
        const [x2, y2] = conn.point2;
        
        // Calculate length and angle for the line
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        
        const uniqueId = `string-${conn.id}`;

        return (
          <React.Fragment key={conn.id}>
            {/* Red string line with shadow */}
            <svg
              width={length}
              height="5"
              viewBox={`0 0 ${length} 5`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                left: `${x1}px`,
                top: `${y1}px`,
                transformOrigin: '0 0',
                transform: `rotate(${angle}deg)`,
                pointerEvents: 'none',
                zIndex: 1
              }}
            >
              <defs>
                <filter 
                  id={`shadow-${uniqueId}`}
                  x="0" 
                  y="0" 
                  width={length} 
                  height="5" 
                  filterUnits="userSpaceOnUse" 
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="4"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
              </defs>
              <g style={{ mixBlendMode: 'darken' }} filter={`url(#shadow-${uniqueId})`}>
                <path 
                  d={`M0 0C0 0.333333 0 0.666667 0 1C${length/6} 1 ${length/3} 1 ${length/2} 1C${length*2/3} 1 ${length*5/6} 1 ${length} 1C${length} 0.666667 ${length} 0.333333 ${length} 0C${length*5/6} 0 ${length*2/3} 0 ${length/2} 0C${length/3} 0 ${length/6} 0 0 0Z`}
                  fill="#FF0000"
                  style={{
                    animation: animated ? 'stringPulse 2s ease-in-out infinite' : 'none'
                  }}
                />
              </g>
            </svg>
            
            {/* Thumbtack knot at start */}
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                left: `${x1 - 5}px`,
                top: `${y1 - 4}px`,
                pointerEvents: 'none',
                zIndex: 2
              }}
            >
              <path 
                d="M5 0.5C7.59516 0.5 9.5 2.16535 9.5 4C9.5 5.83465 7.59516 7.5 5 7.5C2.40484 7.5 0.5 5.83465 0.5 4C0.5 2.16535 2.40484 0.5 5 0.5Z" 
                stroke="#FF0000"
              />
            </svg>
            
            {/* Thumbtack knot at end */}
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                left: `${x2 - 5}px`,
                top: `${y2 - 4}px`,
                pointerEvents: 'none',
                zIndex: 2
              }}
            >
              <path 
                d="M5 0.5C7.59516 0.5 9.5 2.16535 9.5 4C9.5 5.83465 7.59516 7.5 5 7.5C2.40484 7.5 0.5 5.83465 0.5 4C0.5 2.16535 2.40484 0.5 5 0.5Z" 
                stroke="#FF0000"
              />
            </svg>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default RedStringAnimation;
