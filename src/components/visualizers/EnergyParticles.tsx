import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { View, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const energyVertexShader = `
  uniform float uTime;
  uniform float uIsActive;
  uniform float uIntensity;
  
  attribute float rSeed;
  attribute float lifeOffset;
  attribute float velocityX;
  attribute float velocityY;
  
  varying float vAlpha;
  
  void main() {
    // Determine particle life
    float localTime = uTime * (uIsActive > 0.5 ? 2.0 : 0.5) + lifeOffset;
    float life = fract(localTime * 0.5); // 0 to 1
    
    vec3 pos = position;
    
    // Start from bottom, move up
    pos.y = -5.0 + (life * 15.0 * max(0.5, velocityY)) * (uIntensity / 50.0);
    pos.x += velocityX * life * 8.0;
    
    // Noise
    pos.x += sin(life * 10.0 + rSeed) * 0.5 * (uIsActive > 0.5 ? 2.0 : 0.5);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (30.0 * (uIntensity / 50.0)) * (1.0 / -mvPosition.z) * (1.0 - life);
    
    vAlpha = (1.0 - life) * (uIsActive > 0.5 ? 1.0 : 0.2);
  }
`;

const energyFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

const EnergyPoints = ({ 
  isActive, 
  colorStr,
  intensity,
  scatter,
  layers
}: { 
  isActive: boolean;
  colorStr: string;
  intensity: number;
  scatter: number;
  layers: number;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const count = 1500 * Math.max(1, layers / 2.0);
  
  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const rSeeds = new Float32Array(count);
    const lifeOffsets = new Float32Array(count);
    const velocityXs = new Float32Array(count);
    const velocityYs = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        
        rSeeds[i] = Math.random() * 100.0;
        lifeOffsets[i] = Math.random() * 10.0;
        velocityXs[i] = (Math.random() - 0.5) * scatter * 0.1;
        velocityYs[i] = Math.random() * 0.5 + 0.5;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('rSeed', new THREE.BufferAttribute(rSeeds, 1));
    geo.setAttribute('lifeOffset', new THREE.BufferAttribute(lifeOffsets, 1));
    geo.setAttribute('velocityX', new THREE.BufferAttribute(velocityXs, 1));
    geo.setAttribute('velocityY', new THREE.BufferAttribute(velocityYs, 1));
    
    const cArr = colorStr.split(',').map(n => parseInt(n.trim()) / 255);
    const baseColor = new THREE.Color(cArr[0] || 0.06, cArr[1] || 0.72, cArr[2] || 0.5);

    const unifs = {
        uTime: { value: 0 },
        uIsActive: { value: isActive ? 1.0 : 0.0 },
        uIntensity: { value: intensity },
        uColor: { value: baseColor }
    };
    
    return { geometry: geo, uniforms: unifs };
  }, [count, colorStr, intensity, scatter]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time;
        materialRef.current.uniforms.uIsActive.value = isActive ? 1.0 : 0.0;
        materialRef.current.uniforms.uIntensity.value = intensity;
    }
    if (pointsRef.current) {
        pointsRef.current.rotation.y = time * 0.1;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={energyVertexShader}
        fragmentShader={energyFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const EnergyParticles = ({ 
  isActive, 
  color = '16, 185, 129', // rgb values e.g., emerald-500
  intensity = 50,
  scatter = 15,
  layers = 3
}: { 
  isActive: boolean;
  color?: string;
  intensity?: number;
  scatter?: number;
  layers?: number;
}) => {
  if (!isActive) return <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden mix-blend-screen opacity-80 z-0 bg-transparent" />;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden mix-blend-screen opacity-80 z-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
            <EnergyPoints 
                isActive={isActive} 
                colorStr={color} 
                intensity={intensity} 
                scatter={scatter} 
                layers={layers} 
            />
        </Canvas>
    </div>
  );
};
