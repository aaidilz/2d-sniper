import React, { useCallback } from 'react';
import ParallaxCanvas from './ParallaxCanvas';
import { useSniperAudio } from './useSniperAudio';

const SniperMain: React.FC = () => {
  const width = 800; // Set canvas width
  const height = 600; // Set canvas height
  const { state, fire } = useSniperAudio({ reloadDelayAfterShot: 500 });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // left click
      fire();
    }
  }, [fire]);

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }} onMouseDown={handleClick}>
      <ParallaxCanvas width={width} height={height} showScope scopeScale={3} reticleSize={50} />
      <div style={{ position: 'absolute', top: 8, left: 8, color: 'white', fontFamily: 'monospace', fontSize: 12, background: 'rgba(0,0,0,0.4)', padding: '4px 6px', borderRadius: 4 }}>
        STATE: {state}
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: 8, color: '#bbb', fontSize: 11 }}>Klik kiri untuk menembak</div>
    </div>
  );
};

export default SniperMain;