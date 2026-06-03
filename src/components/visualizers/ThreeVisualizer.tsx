import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, View, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const InstancedSpectrogram = ({ isActive, analyser }: { isActive: boolean, analyser: AnalyserNode | null }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const gridSize = 32;
  const count = gridSize * gridSize;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dataArray = useMemo(() => analyser ? new Uint8Array(analyser.frequencyBinCount) : null, [analyser]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (analyser && dataArray && isActive) {
       analyser.getByteFrequencyData(dataArray);
    }
    
    const time = state.clock.getElapsedTime();
    let index = 0;
    
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        // Centered coordinates
        const px = x - gridSize / 2;
        const pz = z - gridSize / 2;
        
        // Procedural height based on time and distance from center
        const dist = Math.sqrt(px*px + pz*pz);
        
        let height = 0.5;
        if (analyser && dataArray && isActive) {
           // map grid to frequency array
           const freqIndex = Math.floor(Math.min(dataArray.length - 1, ((x + z) / (gridSize * 2)) * dataArray.length));
           const val = dataArray[freqIndex] / 255.0; // 0 to 1
           height += val * 6.0; 
           height += Math.max(0, Math.sin(dist * 0.5 - time * 5) * (val * 2)) * Math.exp(-dist * 0.1);
        } else {
           height += Math.sin(px * 0.5 + time) * 0.5 + Math.sin(pz * 0.5 + time) * 0.5;
        }

        dummy.position.set(px * 1.2, height / 2 - 2, pz * 1.2);
        dummy.scale.set(1, Math.max(0.1, height), 1);
        dummy.updateMatrix();
        
        meshRef.current.setMatrixAt(index++, dummy.matrix);
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Rotate the entire grid slightly
    meshRef.current.rotation.y = time * 0.1;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" emissive="#312e81" emissiveIntensity={isActive ? 1.5 : 0.5} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
};

export const ThreeVisualizer = ({ isActive }: { isActive: boolean }) => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
     if (!isActive) return;

     // Attempt to link Web Audio
     const initAudio = () => {
         const audioEl = document.getElementById("music-gen-audio") as HTMLAudioElement;
         if (!audioEl) return;
         
         // prevent multiple bindings
         if ((audioEl as any)._hasVisualizer) return;
         (audioEl as any)._hasVisualizer = true;

         try {
             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
             const ctx = new AudioContext();
             const source = ctx.createMediaElementSource(audioEl);
             const ana = ctx.createAnalyser();
             ana.fftSize = 256;
             source.connect(ana);
             ana.connect(ctx.destination);
             setAnalyser(ana);
         } catch (e) {
             console.warn("Could not bind audio for visualizer:", e);
         }
     };

     // check every little bit until audio is rendered
     const t = setInterval(() => {
        const audioEl = document.getElementById("music-gen-audio");
        if (audioEl) {
            initAudio();
            clearInterval(t);
        }
     }, 500);

     return () => clearInterval(t);
  }, [isActive]);

  return (
    <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden pointer-events-none">
      {isActive && (
        <Canvas camera={{ position: [0, 8, 15], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#f472b6" />
            <pointLight position={[-10, 10, -10]} intensity={1} color="#38bdf8" />
            
            <InstancedSpectrogram isActive={isActive} analyser={analyser} />
            
            {/* Adds realistic reflections */}
            <Environment preset="city" />
        </Canvas>
      )}
    </div>
  );
};
