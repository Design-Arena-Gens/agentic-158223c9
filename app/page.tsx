"use client";

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Scene = dynamic(() => import('../components/Scene').then(m => m.Scene), { ssr: false });

export default function Page() {
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const startRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Focus start button for quick enter
    startRef.current?.focus();
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Scene started={started} muted={muted} />

      {!started && (
        <div className="overlay">
          <div className="overlay-card">
            <h1>Dawn of Independence</h1>
            <p>
              A cinematic tribute to Poland?s Independence Day ? heroic, nostalgic, hopeful.
            </p>
            <button ref={startRef} className="button" onClick={() => setStarted(true)}>
              Enter Scene
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        <button className="button" onClick={() => setMuted(m => !m)}>{muted ? 'Unmute' : 'Mute'}</button>
        <a className="button" href="https://en.wikipedia.org/wiki/National_Independence_Day_(Poland)" target="_blank" rel="noreferrer">About Nov 11</a>
      </div>

      <div className="badge">4K Cinematic ? Historical Drama ? Golden Hour</div>
    </div>
  );
}
