import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, View, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uIsActive;
  uniform float uIsStructured;
  
  attribute float rSeed;
  
  varying float vAlpha;
  
  void main() {
    vec3 pos = position;
    
    // Add noise based on time and structure
    float noise = sin(uTime * (uIsActive > 0.5 ? 2.0 : 1.0) + pos.x + rSeed * 10.0) * 0.2;
    if (uIsStructured > 0.5 && uIsActive < 0.5) {
       noise *= (rSeed > 0.8 ? 1.0 : 0.0) * 0.5; // active status jitter
    }
    
    pos.y += noise * (uIsActive > 0.5 ? 1.5 : 1.0);
    
    // Scale pulse
    float scale = uIsActive > 0.5 ? 1.5 : (uIsStructured > 0.5 ? 0.8 : 0.5);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = (15.0 * scale) * (1.0 / -mvPosition.z);
    
    vAlpha = smoothstep(0.0, 1.0, 1.0 - (abs(pos.y) / 5.0));
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    // Soft circle
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d) * 0.6 * vAlpha;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const PointCloud = ({ isActive, cloudData }: { isActive: boolean; cloudData: string | null }) => {
  const count = 4096; // Increased count since GPU is much faster
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, uniforms } = useMemo(() => {
    const isStructured = !!cloudData;
    const positions = new Float32Array(count * 3);
    const rSeeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
       if (isStructured) {
         const u = Math.random();
         const v = Math.random();
         const x = (u - 0.5) * 6;
         const z = (v - 0.5) * 6;
         const y = Math.sin(x*2) * 0.5 + Math.cos(z*2) * 0.5 + (Math.random() - 0.5) * 0.5;
         
         positions[i * 3] = x;
         positions[i * 3 + 1] = y;
         positions[i * 3 + 2] = z;
       } else {
         const theta = Math.random() * Math.PI * 2;
         const phi = Math.acos(Math.random() * 2 - 1);
         const radius = 2 + Math.random() * 3;
         
         const x = radius * Math.sin(phi) * Math.cos(theta);
         const y = radius * Math.sin(phi) * Math.sin(theta);
         const z = radius * Math.cos(phi);
         
         positions[i * 3] = x + (Math.random() - 0.5);
         positions[i * 3 + 1] = y + (Math.random() - 0.5) * 2;
         positions[i * 3 + 2] = z + (Math.random() - 0.5);
       }
       
       rSeeds[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('rSeed', new THREE.BufferAttribute(rSeeds, 1));
    
    const baseColor = isStructured ? new THREE.Color("#10b981") : new THREE.Color("#34d399");

    const unifs = {
        uTime: { value: 0 },
        uIsActive: { value: isActive ? 1.0 : 0.0 },
        uIsStructured: { value: isStructured ? 1.0 : 0.0 },
        uColor: { value: baseColor }
    };
    
    return { geometry: geo, uniforms: unifs };
  }, [count, cloudData, isActive]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time;
        materialRef.current.uniforms.uIsActive.value = isActive ? 1.0 : 0.0;
    }
    if (pointsRef.current) {
        pointsRef.current.rotation.y = time * (isActive ? 0.3 : 0.05);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const PointCloudCanvas = ({ isActive, cloudData }: { isActive: boolean; cloudData?: string | null }) => {
  if (!isActive) return <div className="absolute inset-0 w-full h-full pointer-events-none bg-transparent" />;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
        <OrbitControls enableZoom={true} autoRotate={isActive} autoRotateSpeed={2} />
        <PointCloud isActive={isActive} cloudData={cloudData || null} />
      </Canvas>
    </div>
  );
};
