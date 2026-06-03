import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, View, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useWorkflowStore } from "../store/useWorkflowStore";

const BuilderNode3D = ({ position, status, name }: { position: [number, number, number], status: string, name: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const color = useMemo(() => {
    switch (status) {
      case "open":
      case "not-started":
        return "#f97316";
      case "in-progress":
        return "#3b82f6";
      case "blocked":
        return "#ef4444";
      case "complete":
        return "#10b981";
      default:
        return "#71717a";
    }
  }, [status]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
      meshRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
      <mesh>
        <octahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color={color} transparent opacity={0.2} />
      </mesh>
      <Text
        position={[0, -2, 0]}
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
};

const StandardNode3D = ({ position, color }: { position: [number, number, number], color: string }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const GraphLinks = ({ nodes, edges }: { nodes: any[], edges: any[] }) => {
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    edges.filter(edge => !edge.data?.isBuilderEdge).forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        // Map 2d coords to 3d
        positions.push(
          sourceNode.position.x * 0.05, -sourceNode.position.y * 0.05, 0,
          targetNode.position.x * 0.05, -targetNode.position.y * 0.05, 0
        );
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [nodes, edges]);

  const builderLineGeometry = useMemo(() => {
    const positions: number[] = [];
    edges.filter(edge => !!edge.data?.isBuilderEdge).forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        positions.push(
          sourceNode.position.x * 0.05, -sourceNode.position.y * 0.05, 0,
          targetNode.position.x * 0.05, -targetNode.position.y * 0.05, 0
        );
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [nodes, edges]);

  return (
    <>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={0x444444} linewidth={1} transparent opacity={0.5} />
      </lineSegments>
      <lineSegments geometry={builderLineGeometry}>
        <lineBasicMaterial color={0xf472b6} linewidth={3} transparent opacity={0.8} />
      </lineSegments>
    </>
  );
};

const RotatingGraph = ({ nodes, edges }: { nodes: any[], edges: any[] }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map(n => {
        const p: [number, number, number] = [n.position.x * 0.05, -n.position.y * 0.05, 0];
        if (n.type === "ui.builder") {
          return <BuilderNode3D key={n.id} position={p} status={n.data?.plan?.devStatus || n.data?.status} name={n.data?.name || "Builder"} />;
        }
        return <StandardNode3D key={n.id} position={p} color={n.type === "coreNode" ? "#6366f1" : "#52525b"} />;
      })}
      <GraphLinks nodes={nodes} edges={edges} />
    </group>
  );
};

export const VaultGraph3D = () => {
  const { nodes, edges } = useWorkflowStore();

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto bg-[#0a0a0a]">
      <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
        {/* React Three Fiber manages the generic background color internally generally via color attach, but with View we can just do div background. Let's do color attach just in case */}
        <color attach="background" args={['#0a0a0a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <group position={[-50, 20, 0]}>
          <RotatingGraph nodes={nodes} edges={edges} />
        </group>
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};
