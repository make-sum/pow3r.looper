import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { View, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const vectorVertexShader = `
  uniform float uTime;
  uniform float uIsActive;
  uniform float uSpeed;
  uniform float uComplexity;
  uniform float uSeed;
  
  attribute vec2 gridPos;
  
  varying float vStrength;
  
  void main() {
    vec3 pos = position; // Base line segment
    
    // Simulate simplex/perlin noise for angle
    float timeScaled = uTime * uSpeed * 0.5;
    float localX = gridPos.x * 0.5 * uComplexity;
    float localY = gridPos.y * 0.5 * uComplexity;
    
    float angle = sin(timeScaled + localX + uSeed) + cos(timeScaled + localY - uSeed);
    
    float mag = 0.2;
    if (uIsActive > 0.5) {
        mag = sin(timeScaled * 2.0 + localX * 0.5 + localY * 0.5 + uSeed) * 0.5 + 0.5;
    }
    
    vStrength = mag;
    
    // Rotate and scale the line segment based on the vector field
    // pos.x is 0 at origin, 1 at tail
    float lineLen = pos.x * mag * 0.8;
    
    vec3 finalPos = vec3(
        gridPos.x + cos(angle) * lineLen,
        gridPos.y + sin(angle) * lineLen,
        0.0 // z
    );
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const vectorFragmentShader = `
  uniform vec3 uColor;
  varying float vStrength;
  
  void main() {
    gl_FragColor = vec4(uColor, vStrength + 0.2);
  }
`;

const VectorField = ({ 
  isActive, 
  colorStr,
  seed,
  complexity,
  speed
}: { 
  isActive: boolean;
  colorStr: string;
  seed: number;
  complexity: number;
  speed: number;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const { geometry, uniforms } = useMemo(() => {
    const cols = 30;
    const rows = 15;
    const totalVectors = cols * rows;
    
    // Each vector is a line segment with 2 points
    const positions = new Float32Array(totalVectors * 2 * 3);
    const gridPositions = new Float32Array(totalVectors * 2 * 2);
    const indices = [];
    
    let pIdx = 0;
    let gIdx = 0;
    
    for (let y = 0; y < rows; y++) {
       for (let x = 0; x < cols; x++) {
           const vecOriginX = (x / cols - 0.5) * 15.0;
           const vecOriginY = (y / rows - 0.5) * 7.5;
           
           // Point 0 (origin)
           positions[pIdx++] = 0.0;
           positions[pIdx++] = 0.0;
           positions[pIdx++] = 0.0;
           
           // Point 1 (tip)
           positions[pIdx++] = 1.0;
           positions[pIdx++] = 0.0;
           positions[pIdx++] = 0.0;
           
           gridPositions[gIdx++] = vecOriginX;
           gridPositions[gIdx++] = vecOriginY;
           
           gridPositions[gIdx++] = vecOriginX;
           gridPositions[gIdx++] = vecOriginY;
           
           const vIdx = (y * cols + x) * 2;
           indices.push(vIdx, vIdx + 1);
       }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('gridPos', new THREE.BufferAttribute(gridPositions, 2));
    geo.setIndex(indices);
    
    const cArr = colorStr.split(',').map(n => parseInt(n.trim()) / 255);
    const baseColor = new THREE.Color(cArr[0] || 0.54, cArr[1] || 0.36, cArr[2] || 0.96);

    const unifs = {
        uTime: { value: 0 },
        uIsActive: { value: isActive ? 1.0 : 0.0 },
        uSpeed: { value: speed },
        uComplexity: { value: complexity },
        uSeed: { value: seed },
        uColor: { value: baseColor }
    };
    
    return { geometry: geo, uniforms: unifs };
  }, [colorStr, seed, complexity, speed]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time;
        materialRef.current.uniforms.uIsActive.value = isActive ? 1.0 : 0.0;
    }
  });

  return (
    <lineSegments geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vectorVertexShader}
        fragmentShader={vectorFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export const VectorMatrix = ({ 
  isActive, 
  color = '139, 92, 246', // violet-500
  seed = 0,
  complexity = 1.0,
  speed = 1.0
}: { 
  isActive: boolean;
  color?: string;
  seed?: number;
  complexity?: number;
  speed?: number;
}) => {
  if (!isActive) return <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden bg-transparent z-0 mix-blend-screen opacity-90" />;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden z-0 mix-blend-screen opacity-90">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }} gl={{ alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={45} />
            <VectorField 
                isActive={isActive} 
                colorStr={color}
                seed={seed}
                complexity={complexity}
                speed={speed}
            />
        </Canvas>
    </div>
  );
};
