"use client";

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField, GodRays } from '@react-three/postprocessing';
import { Html, Billboard, useTexture, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useMemo, useRef, useState } from 'react';

export function Scene({ started, muted }: { started: boolean; muted: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.4, 6.5], fov: 43 }}
    >
      <color attach="background" args={[0.03, 0.03, 0.03]} />
      <fog attach="fog" args={[new THREE.Color('#0b0b0b'), 10, 26]} />

      <ambientLight intensity={0.25} />
      <Sun />
      <GoldenSky />

      <CitySilhouette />
      <FlagsField started={started} />
      <Crowd />
      <Rider />

      <CameraRig started={started} />
      <CinematicFX />

      <AudioController started={started} muted={muted} />
    </Canvas>
  );
}

function GoldenSky() {
  return (
    <Sky
      distance={450000}
      turbidity={6}
      rayleigh={1.2}
      mieCoefficient={0.006}
      mieDirectionalG={0.92}
      inclination={0.49}
      azimuth={0.2}
    />
  );
}

function Sun() {
  const sunRef = useRef<THREE.Mesh>(null);
  return (
    <group position={[10, 4.5, -12]}>
      <mesh ref={sunRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ffd27f" />
      </mesh>
      <directionalLight
        position={[ -6, 3, 6 ]}
        intensity={2.2}
        color={new THREE.Color('#ffcf88')}
        castShadow
      />
      <GodRays sun={sunRef as any} decay={0.96} exposure={0.35} samples={60} density={0.85} weight={0.55} />
    </group>
  );
}

function CitySilhouette() {
  const tex = useTexture('/skyline.svg');
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <Billboard position={[0, 0.1, -5]}>
      <mesh>
        <planeGeometry args={[18, 5]} />
        <meshBasicMaterial map={tex} transparent opacity={0.9} />
      </mesh>
    </Billboard>
  );
}

function Rider() {
  const tex = useTexture('/horse-rider.svg');
  tex.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[0, 1.25, 0]}>
      <Billboard follow lockX lockZ>
        <mesh>
          <planeGeometry args={[2.7, 2.0]} />
          <meshStandardMaterial map={tex} transparent roughness={0.9} metalness={0} />
        </mesh>
      </Billboard>
      {/* Warm key light for cinematic look */}
      <spotLight position={[1.6, 2.2, 2.4]} angle={0.6} penumbra={0.6} intensity={1.2} color="#ffd2a6" />
    </group>
  );
}

function Crowd() {
  const group = useRef<THREE.Group>(null);
  const people = useMemo(() => {
    const pts: { x: number; z: number; s: number; o: number }[] = [];
    for (let i = 0; i < 130; i++) {
      pts.push({ x: (Math.random() - 0.5) * 10, z: -0.6 - Math.random() * 2.2, s: 0.6 + Math.random() * 0.6, o: 0.6 + Math.random() * 0.35 });
    }
    return pts.sort((a, b) => a.z - b.z);
  }, []);
  return (
    <group ref={group} position={[0, 0, 0]}>
      {people.map((p, i) => (
        <Billboard key={i} position={[p.x, 0.55 * p.s, p.z]}>
          <mesh>
            <planeGeometry args={[0.22 * p.s, 1.1 * p.s]} />
            <meshBasicMaterial color="#0e0e10" transparent opacity={p.o} />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}

function FlagsField({ started }: { started: boolean }) {
  const count = 26;
  const data = useMemo(() => new Array(count).fill(0).map((_, i) => ({
    x: -6 + (i % 13) * 1.0 + (Math.random() - 0.5) * 0.2,
    z: -1.2 - Math.floor(i / 13) * 1.2 + (Math.random() - 0.5) * 0.2,
    h: 1.8 + Math.random() * 0.6,
    o: 0.75 + Math.random() * 0.25,
    p: Math.random() * Math.PI * 2
  })), [count]);

  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * (started ? 1 : 0.25);
  });

  return (
    <group>
      {data.map((f, i) => (
        <Flag key={i} base={[f.x, 0, f.z]} height={f.h} phase={f.p} opacity={f.o} timeRef={t} />
      ))}
    </group>
  );
}

function Flag({ base, height, phase, opacity, timeRef }: { base: [number, number, number]; height: number; phase: number; opacity: number; timeRef: React.MutableRefObject<number> }) {
  const poleColor = '#2b2b2b';
  const flagRef = useRef<THREE.Mesh>(null);
  const poleRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = timeRef.current;
    const m = flagRef.current as THREE.Mesh;
    if (!m) return;
    const geo = m.geometry as THREE.PlaneGeometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const wave = Math.sin((x + y * 0.5) * 3.2 + t * 2.0 + phase) * 0.06 + Math.sin((x + t * 1.2) * 5.5 + phase) * 0.03;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    if (poleRef.current) {
      poleRef.current.rotation.z = Math.sin(t * 0.6 + phase) * 0.03;
    }
  });

  // Two-color flag (white over red)
  const material = useMemo(() => {
    const cTop = new THREE.Color('#ffffff');
    const cBottom = new THREE.Color('#d32f2f');
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        top: { value: cTop },
        bottom: { value: cBottom },
        alpha: { value: opacity }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 top;
        uniform vec3 bottom;
        uniform float alpha;
        void main() {
          vec3 color = mix(top, bottom, step(0.5, vUv.y));
          gl_FragColor = vec4(color, alpha);
        }
      `
    });
    return mat;
  }, [opacity]);

  return (
    <group position={base}>
      <mesh ref={poleRef} position={[0, height * 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, height, 8]} />
        <meshStandardMaterial color={poleColor} roughness={0.9} />
      </mesh>
      <mesh ref={flagRef} position={[0.52, height * 0.9, 0]} rotation={[0, 0, 0.02]}>
        <planeGeometry args={[1.2, 0.7, 24, 8]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

function CameraRig({ started }: { started: boolean }) {
  const { camera } = useThree();
  const tRef = useRef(0);
  useFrame((_, dt) => {
    const t = tRef.current + dt * (started ? 0.12 : 0.02);
    tRef.current = Math.min(t, 1);

    // ease in-out
    const e = (p: number) => p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

    const pan = e(tRef.current);
    camera.position.lerp(new THREE.Vector3(0, 2.0, 5.2), 0.02);
    camera.lookAt(0, 1.25 + pan * 0.35, 0);
  });
  return null;
}

function CinematicFX() {
  const { viewport } = useThree();
  return (
    <EffectComposer multisampling={2}>
      <Bloom intensity={0.5} luminanceThreshold={0.25} mipmapBlur height={256} />
      <DepthOfField focusDistance={0.02} focalLength={0.028} bokehScale={2.4} />
      <Noise premultiply blendFunction={THREE.AdditiveBlending as any} opacity={0.08} />
      <Vignette eskil offset={0.22} darkness={0.8} />
    </EffectComposer>
  );
}

function AudioController({ started, muted }: { started: boolean; muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const src = useMemo(() => {
    // Public domain performance by USAF Band (government work)
    return 'https://upload.wikimedia.org/wikipedia/commons/4/44/Chopin_Polonaise_in_A_major%2C_Op._40%2C_No._1_%28USAF_Band%29.ogg';
  }, []);

  return (
    <Html position={[0, 0, 0]} center zIndexRange={[1, 0]}>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        controls={false}
        autoPlay={false}
        loop
        muted={muted}
        onCanPlay={() => setReady(true)}
      />
      <AutoPlay audioRef={audioRef} started={started} ready={ready} muted={muted} />
    </Html>
  );
}

function AutoPlay({ audioRef, started, ready, muted }: { audioRef: React.MutableRefObject<HTMLAudioElement | null>; started: boolean; ready: boolean; muted: boolean }) {
  const tried = useRef(false);
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
  }, [muted, audioRef]);
  useEffect(() => {
    const play = async () => {
      if (!audioRef.current || !started || !ready || tried.current) return;
      tried.current = true;
      try { await audioRef.current.play(); } catch {}
    };
    play();
  }, [started, ready, audioRef]);
  return null;
}
