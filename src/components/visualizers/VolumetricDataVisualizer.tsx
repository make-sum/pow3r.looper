import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, View } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../../src/store/appStore';

export interface VolumetricDataVisualizerProps {
  isActive: boolean;
  intensity?: number;
  trackId?: string;
}

const vertexShader = (isPoints: boolean) => `
  uniform float uTime;
  uniform float uBpm;
  uniform float uIntensity;
  uniform float uIsActive;
  
  attribute float trackType;
  attribute float layerSeed;
  attribute float amplitude;
  
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    vColor = color;
    vec3 pos = position;
    vOpacity = 0.3;
    
    if (uIsActive > 0.5) {
        float freq = max(60.0, uBpm) / 60.0;
        float beatBase = sin(uTime * 3.14159 * freq);
        float beatVal = pow(abs(beatBase), 4.0);
        
        float timeOffset = uTime * 2.0;
        float wave = sin(pos.x * 2.0 - timeOffset * 3.0 + layerSeed) * amplitude * 0.5;
        
        if (trackType < 0.5) { // 0 = audio
           pos.y += wave * 2.0 * uIntensity;
           float noise = sin(pos.x * 20.0 - timeOffset * 10.0 + layerSeed) * 0.2;
           pos.y += noise * amplitude * uIntensity;
        } else if (trackType < 1.5) { // 1 = spark
           pos.y += sin(pos.x * 5.0 - timeOffset + layerSeed) * amplitude * uIntensity;
           pos.z += cos(pos.x * 3.0 + timeOffset) * amplitude * uIntensity;
        } else if (trackType < 2.5) { // 2 = voice
           float voicePulse = pow(abs(sin(pos.x * 4.0 - timeOffset * 5.0 + layerSeed)), 6.0);
           pos.y += voicePulse * amplitude * 4.0 * uIntensity * max(0.2, beatVal);
        } else if (trackType < 3.5) { // 3 = dmx
           pos.y += wave * 0.5 * uIntensity + beatVal * 0.5 * uIntensity * amplitude;
           pos.y *= 1.0 + (beatVal * uIntensity * 1.5);
        } else if (trackType < 4.5) { // 4 = holo/ar
           pos.y += cos(pos.x * 6.0 + uTime * 4.0 + layerSeed) * amplitude * uIntensity * 0.5;
           pos.z *= 1.0 + wave * uIntensity;
        } else if (trackType < 5.5) { // 5 = motion
           pos.x += wave * 0.8 * uIntensity;
           pos.y += wave * 1.5 * uIntensity;
        } else if (trackType < 6.5) { // 6 = midi
           float quantWave = floor(sin(pos.x * 8.0 - timeOffset + layerSeed) * 4.0) / 4.0;
           pos.y += quantWave * amplitude * 3.0 * uIntensity;
        }
        
        pos.y *= 1.0 + (beatVal * 0.1 * uIntensity);
        vOpacity = 0.9;
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    ${isPoints ? `gl_PointSize = (12.0 * uIntensity) * (1.0 / -mvPosition.z) * min(1.5, max(0.5, amplitude + 0.5));` : ''}
  }
`;

const pointsFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.1, d);
    if (alpha < 0.05) discard;
    gl_FragColor = vec4(vColor, alpha * vOpacity);
  }
`;

const linesFragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  
  void main() {
    gl_FragColor = vec4(vColor, vOpacity * 0.3);
  }
`;

const VolumetricShaderNodes = ({ isActive, intensity = 1.0, trackId = 'master' }: VolumetricDataVisualizerProps) => {
  const pointsMatRef = useRef<THREE.ShaderMaterial>(null);
  const linesMatRef = useRef<THREE.ShaderMaterial>(null);
  const sequenceBlocks = useAppStore(state => state.sequenceBlocks);
  const globalBpm = useAppStore(state => state.globalBpm);
  
  const relevantBlocks = useMemo(() => {
    if (trackId === 'master' || trackId === 'background') return sequenceBlocks;
    return sequenceBlocks.filter(b => b.id === trackId);
  }, [sequenceBlocks, trackId]);

  const { pointsGeo, linesGeo } = useMemo(() => {
    const pGeo = new THREE.BufferGeometry();
    const lGeo = new THREE.BufferGeometry();
    
    const timeSteps = 1000;
    const waveLayers = 16;
    const numTracks = Math.max(1, relevantBlocks.length);
    const totalVertices = timeSteps * waveLayers * numTracks;
    
    const positions = new Float32Array(totalVertices * 3);
    const colors = new Float32Array(totalVertices * 3);
    const trackTypes = new Float32Array(totalVertices);
    const layerSeeds = new Float32Array(totalVertices);
    const amplitudes = new Float32Array(totalVertices);
    const lineIndices = [];
    
    const cyan = new THREE.Color("#06b6d4");
    const rose = new THREE.Color("#f43f5e");
    const violet = new THREE.Color("#8b5cf6");
    const emerald = new THREE.Color("#10b981");
    const yellow = new THREE.Color("#eab308");

    let vertIndex = 0;
    
    for (let trackIdx = 0; trackIdx < numTracks; trackIdx++) {
       const block = relevantBlocks[trackIdx] || { volume: 50, fx: [], name: String(trackId), metadata: {} as any };
       const volume = (block.volume / 100.0) || 0.5;
       const fxIntensity = block.fx && block.fx.length > 0 ? (block.fx.length * 0.2) : 0.1;

       let nameHash = 0;
       const blockData = JSON.stringify(block).toLowerCase();
       for (let c = 0; c < blockData.length; c++) {
           nameHash = Math.imul(31, nameHash) + blockData.charCodeAt(c) | 0;
       }
       const trackSeed = (Math.abs(nameHash) % 1000) / 1000.0;

       let baseColor = cyan;
       let complexity = 1.0;
       let trackTypeFloat = 0.0; // audio
       
       if (blockData.includes('spark') || blockData.includes('fingerprint') || blockData.includes('hash')) {
           trackTypeFloat = 1.0;
           baseColor = emerald;
           complexity = 2.5;
       } else if (blockData.includes('voice') || blockData.includes('ssml') || blockData.includes('yaip') || blockData.includes('mic') || blockData.includes('narrat')) {
           trackTypeFloat = 2.0;
           baseColor = violet;
           if (blockData.includes('female')) baseColor = rose;
           if (blockData.includes('child')) baseColor = emerald;
           complexity = 1.8; 
       } else if (blockData.includes('dmx') || blockData.includes('light')) {
           trackTypeFloat = 3.0;
           baseColor = rose;
           complexity = 0.5;
       } else if (blockData.includes('holo') || blockData.includes('volume') || blockData.includes('emit')) {
           trackTypeFloat = 4.0;
           baseColor = cyan;
           complexity = 2.0;
       } else if (blockData.includes('ar_preset') || blockData.includes('profile')) {
           trackTypeFloat = 4.0;
           baseColor = rose;
           complexity = 3.0;
       } else if (blockData.includes('motion') || blockData.includes('dance')) {
           trackTypeFloat = 5.0;
           baseColor = emerald;
           complexity = 1.2;
       } else if (blockData.includes('midi')) {
           trackTypeFloat = 6.0;
           baseColor = yellow;
           complexity = 1.5;
       }

       const isMaster = trackId === 'master';
       const verticalBase = isMaster ? 0 : 0; 
       const depthBase = isMaster ? (trackIdx - numTracks / 2) * 0.5 : 0;

       for (let layer = 0; layer < waveLayers; layer++) {
           const layerNorm = layer / waveLayers;
           const zOffset = (layerNorm - 0.5) * (isMaster ? 2.0 : 1.0);
           const phaseShift = layerNorm * Math.PI * 2.0;
           
           for (let i = 0; i < timeSteps; i++) {
               const timeNorm = i / timeSteps;
               const xPos = (timeNorm - 0.5) * 20.0;
               const layerSeed = trackIdx * 10 + layer * 2 + trackSeed * 100;
               const envelope = Math.max(0.01, Math.sin(timeNorm * Math.PI));
               const amplitude = volume * (0.5 + fxIntensity);
               
               let yPos = verticalBase;
               let zPosBase = depthBase + zOffset;

               // Base geometry offsets for visual diversity (animated by shader over time)
               if (trackTypeFloat === 4.0) { // holo / ar
                   let scatter = 1.0;
                   if (block.metadata?.scatter) scatter = block.metadata.scatter / 15.0;
                   yPos = verticalBase + (Math.sin(layerSeed * i) * 10.0 * scatter * envelope * amplitude * 0.2);
               } else if (trackTypeFloat === 1.0) { // spark
                   let ringSize = 2.0 + (trackSeed * 1.5);
                   const angle = timeNorm * Math.PI * (40.0 + (layer * 2));
                   yPos = verticalBase + (Math.sin(angle) * ringSize * envelope * amplitude * 0.5);
                   zPosBase += (Math.cos(angle) * ringSize * amplitude * 0.5);
               } else if (trackTypeFloat === 3.0) { // dmx
                   const stepCount = 20 + Math.floor(trackSeed * 30);
                   const steppedTime = Math.floor(timeNorm * stepCount) / stepCount;
                   yPos += (Math.sin(steppedTime * Math.PI * (10 + trackSeed * 5) + layerSeed) * 2.0) * amplitude * envelope * 0.5;
               } else if (trackTypeFloat === 5.0) { // motion
                   yPos += Math.sin(timeNorm * Math.PI * (2.0 + trackSeed * 3.0) + layerSeed) * amplitude * 4.0 * envelope * 0.5;
               } else if (trackTypeFloat === 2.0) { // voice
                   const transient = Math.pow(Math.sin(timeNorm * Math.PI * (30.0 + trackSeed * 20.0) + layerSeed), 8.0);
                   yPos += (transient * amplitude * 5.0 - (amplitude * 1.5)) * envelope * complexity * 0.5;
               } else if (trackTypeFloat === 6.0) { // midi
                   const noteTime = Math.floor(timeNorm * (30 + trackSeed * 20));
                   yPos += (((noteTime % 5) * 0.5 - 1.0) * amplitude * 2.0) * envelope;
               } else { // standard audio
                   const lowFreq = Math.sin(timeNorm * Math.PI * (4.0 + (trackSeed * 10.0)) + phaseShift) * 0.8;
                   const midFreq = Math.sin(timeNorm * Math.PI * (15.0 + (trackSeed * 30.0)) - phaseShift * 2.0 + layerSeed) * 0.5;
                   yPos += (lowFreq + midFreq) * envelope * amplitude;
               }
               
               const idx = vertIndex++;
               positions[idx * 3] = xPos;
               positions[idx * 3 + 1] = yPos;
               positions[idx * 3 + 2] = zPosBase;

               trackTypes[idx] = trackTypeFloat;
               layerSeeds[idx] = layerSeed;
               amplitudes[idx] = amplitude * envelope;

               const colorIntensity = 0.4 + Math.abs(yPos - verticalBase) * 0.4;
               const pointColor = baseColor.clone().multiplyScalar(colorIntensity);
               
               if (Math.abs(yPos - verticalBase) > 1.2 * volume) {
                   pointColor.lerp(new THREE.Color(1, 1, 1), 0.6);
               }

               colors[idx * 3] = pointColor.r;
               colors[idx * 3 + 1] = pointColor.g;
               colors[idx * 3 + 2] = pointColor.b;

               if (i > 0) {
                   lineIndices.push(idx, idx - 1);
               }
           }
       }
    }
    
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pGeo.setAttribute('trackType', new THREE.BufferAttribute(trackTypes, 1));
    pGeo.setAttribute('layerSeed', new THREE.BufferAttribute(layerSeeds, 1));
    pGeo.setAttribute('amplitude', new THREE.BufferAttribute(amplitudes, 1));
    
    lGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    lGeo.setAttribute('trackType', new THREE.BufferAttribute(trackTypes, 1));
    lGeo.setAttribute('layerSeed', new THREE.BufferAttribute(layerSeeds, 1));
    lGeo.setAttribute('amplitude', new THREE.BufferAttribute(amplitudes, 1));
    lGeo.setIndex(lineIndices);
    
    return { pointsGeo: pGeo, linesGeo: lGeo };
  }, [relevantBlocks, trackId]);

  useFrame((state) => {
      const time = state.clock.elapsedTime;
      if (pointsMatRef.current) {
          pointsMatRef.current.uniforms.uTime.value = time;
          pointsMatRef.current.uniforms.uBpm.value = globalBpm;
          pointsMatRef.current.uniforms.uIntensity.value = intensity;
          pointsMatRef.current.uniforms.uIsActive.value = isActive ? 1.0 : 0.0;
      }
      if (linesMatRef.current) {
          linesMatRef.current.uniforms.uTime.value = time;
          linesMatRef.current.uniforms.uBpm.value = globalBpm;
          linesMatRef.current.uniforms.uIntensity.value = intensity;
          linesMatRef.current.uniforms.uIsActive.value = isActive ? 1.0 : 0.0;
      }
  });

  const uniforms = useMemo(() => ({
      uTime: { value: 0 },
      uBpm: { value: 120 },
      uIntensity: { value: 1.0 },
      uIsActive: { value: 0.0 }
  }), []);

  return (
    <group>
      <lineSegments geometry={linesGeo}>
        <shaderMaterial
            ref={linesMatRef}
            vertexShader={vertexShader(false)}
            fragmentShader={linesFragmentShader}
            uniforms={uniforms}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
      </lineSegments>
      
      <points geometry={pointsGeo}>
        <shaderMaterial
            ref={pointsMatRef}
            vertexShader={vertexShader(true)}
            fragmentShader={pointsFragmentShader}
            uniforms={uniforms}
            transparent={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
      </points>
    </group>
  );
};

export const VolumetricDataVisualizer = ({ isActive = true, intensity = 1.0, trackId = 'master' }: VolumetricDataVisualizerProps) => {
    if (!isActive) return <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden bg-transparent" />;
    
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none rounded-lg overflow-hidden">
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ alpha: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
                <VolumetricShaderNodes isActive={isActive} intensity={intensity} trackId={trackId} />
            </Canvas>
        </div>
    );
};

