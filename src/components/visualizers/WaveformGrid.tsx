import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { View, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const waveVertexShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIsActive;
  uniform float uComplexity;
  uniform float uMirrored;
  
  varying float vAlpha;
  
  void main() {
    float xNorm = uv.x;
    
    vec3 pos = position;
    
    float yOffset = 0.0;
    
    if (uIsActive > 0.5) {
        for (float i = 1.0; i <= 5.0; i++) {
            if (i > uComplexity) break;
            yOffset += sin(xNorm * 3.14159 * 4.0 * i + (uTime * i * 3.0)) * (0.8 / i);
        }
    } else {
        yOffset = sin(xNorm * 3.14159 * 2.0 + uTime) * 0.1;
    }
    
    // Hanning window
    float windowFunc = sin(xNorm * 3.14159);
    yOffset *= windowFunc;
    
    // Optional mirror effect
    if (uMirrored > 0.5) {
        // We use the sign of the original Y coordinate to mirror it top/bottom
        pos.y += yOffset * sign(pos.y + 0.001); 
    } else {
        pos.y += yOffset;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    vAlpha = smoothstep(1.0, 0.0, abs(yOffset)) * 0.5 + 0.5;
  }
`;

const waveFragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    gl_FragColor = vec4(uColor, vAlpha);
  }
`;

const WaveLines = ({ 
  isActive, 
  colorStr,
  complexity,
  mirrored
}: { 
  isActive: boolean;
  colorStr: string;
  complexity: number;
  mirrored: boolean;
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const { geometry, uniforms } = useMemo(() => {
    // Generate horizontal line segments
    const pointsCount = 200;
    const positions = new Float32Array(pointsCount * 3 * 3); // 3 lines
    const uvs = new Float32Array(pointsCount * 2 * 3);
    
    let idx = 0;
    let uvIdx = 0;
    
    for (let l = 0; l < (mirrored ? 2 : 1); l++) {
      // Main Line, Fast Line, Slow Line
      for (let j = 0; j < 3; j++) {
         for (let i = 0; i < pointsCount; i++) {
            const xNorm = i / (pointsCount - 1);
            positions[idx++] = (xNorm - 0.5) * 10.0;
            positions[idx++] = mirrored ? (l == 0 ? 0.5 : -0.5) : (j - 1) * 0.2;
            positions[idx++] = 0.0;
            
            uvs[uvIdx++] = xNorm;
            uvs[uvIdx++] = j / 2.0;
         }
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    
    // Create line indices
    const indices = [];
    const totalLines = mirrored ? 6 : 3;
    for (let l = 0; l < totalLines; l++) {
        for (let i = 0; i < pointsCount - 1; i++) {
           indices.push(l * pointsCount + i, l * pointsCount + i + 1);
        }
    }
    geo.setIndex(indices);
    
    const cArr = colorStr.split(',').map(n => parseInt(n.trim()) / 255);
    const baseColor = new THREE.Color(cArr[0] || 0.06, cArr[1] || 0.72, cArr[2] || 0.5);

    const unifs = {
        uTime: { value: 0 },
        uIsActive: { value: isActive ? 1.0 : 0.0 },
        uComplexity: { value: complexity },
        uMirrored: { value: mirrored ? 1.0 : 0.0 },
        uColor: { value: baseColor }
    };
    
    return { geometry: geo, uniforms: unifs };
  }, [colorStr, complexity, mirrored]);

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
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export const WaveformGrid = ({ 
  isActive, 
  color = '16, 185, 129', // emerald
  complexity = 2,
  mirrored = false,
  type = 'waveform'
}: { 
  isActive: boolean;
  color?: string;
  complexity?: number;
  mirrored?: boolean;
  type?: 'waveform' | 'spectrogram';
}) => {
  if (!isActive) return <div className="absolute inset-0 w-full h-full mix-blend-screen rounded-lg overflow-hidden z-0 pointer-events-none bg-transparent" />;

  // If spectrogram, we can fall back to the old 2D canvas method, or just map it 
  // into a stylized 3D representation. For now we will use standard 3D WaveLines
  // as it provides a superior baseline visual suitable for the requested DAW style.
  return (
    <div className="absolute inset-0 w-full h-full mix-blend-screen rounded-lg overflow-hidden z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
            <WaveLines 
               isActive={isActive} 
               colorStr={color} 
               complexity={complexity} 
               mirrored={mirrored} 
            />
        </Canvas>
    </div>
  );
};
