
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, PerspectiveCamera, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Persona } from '../types';

// Augment the global JSX namespace to include Three.js elements.
// This fix addresses the "Property 'div' does not exist on type 'JSX.IntrinsicElements'" errors 
// by properly extending the global JSX namespace which React uses, while avoiding module resolution issues.
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

interface Avatar3DProps {
  persona: Persona;
  isSpeaking: boolean;
}

const HumanoidAvatar: React.FC<Avatar3DProps> = ({ persona, isSpeaking }) => {
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  // Smooth out transitions
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.4) * 0.1;
      headRef.current.rotation.x = Math.cos(time * 0.3) * 0.05;
      headRef.current.position.y = 0.3 + Math.sin(time * 0.8) * 0.03;
    }

    if (mouthRef.current) {
      if (isSpeaking) {
        const talkSpeed = 14;
        const mouthScale = 0.5 + Math.abs(Math.sin(time * talkSpeed)) * 1.5;
        mouthRef.current.scale.set(1.1, mouthScale, 1);
      } else {
        mouthRef.current.scale.set(1, 0.15, 1);
      }
    }

    // Blinking
    const blink = Math.sin(time * 1.2) > 0.96 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink;
  });

  return (
    <group position={[0, -0.6, 0]}>
      {/* Upper Body / Suit */}
      <mesh position={[0, -0.85, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.75, 1.1, 64]} />
        <meshPhysicalMaterial 
          color="#0a0a1a" 
          roughness={0.4} 
          metalness={0.2}
          reflectivity={0.5}
          clearcoat={0.3}
        />
      </mesh>

      {/* Shirt & Tie Detail */}
      <mesh position={[0, -0.32, 0.25]}>
        <boxGeometry args={[0.1, 0.4, 0.02]} />
        <meshStandardMaterial color={persona.color} emissive={persona.color} emissiveIntensity={0.2} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 0.3, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.45, 64, 64]} />
          <meshPhysicalMaterial 
            color="#f5ccab" 
            roughness={0.6} 
            metalness={0.05}
            reflectivity={0.2}
          />
        </mesh>

        {/* Glossy Hair */}
        <mesh position={[0, 0.18, -0.05]}>
          <sphereGeometry args={[0.48, 64, 32, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshPhysicalMaterial color="#2a1a10" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Eyes with reflections */}
        <group>
          <mesh ref={leftEyeRef} position={[-0.16, 0.08, 0.38]}>
            <sphereGeometry args={[0.045, 32, 32]} />
            <meshStandardMaterial color="#050505" roughness={0} />
            <mesh position={[0.015, 0.015, 0.035]}>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </mesh>
          <mesh ref={rightEyeRef} position={[0.16, 0.08, 0.38]}>
            <sphereGeometry args={[0.045, 32, 32]} />
            <meshStandardMaterial color="#050505" roughness={0} />
            <mesh position={[0.015, 0.015, 0.035]}>
              <sphereGeometry args={[0.01, 8, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </mesh>
        </group>

        {/* Premium Frames (Glasses) */}
        <group position={[0, 0.08, 0.35]}>
          <mesh position={[-0.16, 0, 0.05]}>
            <torusGeometry args={[0.085, 0.007, 16, 64]} />
            <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.16, 0, 0.05]}>
            <torusGeometry args={[0.085, 0.007, 16, 64]} />
            <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.1, 0.01, 0.01]} />
            <meshStandardMaterial color="#000" metalness={0.9} />
          </mesh>
        </group>

        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.22, 0.42]}>
          <capsuleGeometry args={[0.05, 0.02, 8, 16]} />
          <meshStandardMaterial color="#9c4a4a" roughness={0.4} />
        </mesh>
      </group>

      {/* Dynamic Ambient Glow */}
      <mesh position={[0, 0.2, -0.5]} scale={1.5}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={persona.color}
          transparent
          opacity={0.05}
          speed={2}
          distort={0.4}
        />
      </mesh>
    </group>
  );
};

const Avatar3D: React.FC<Avatar3DProps> = ({ persona, isSpeaking }) => {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing bg-[#030303]">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0.1, 2.2]} fov={32} />
        <ambientLight intensity={0.4} />
        
        {/* Main Dramatic Light */}
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        
        {/* Rim Light for Beauty */}
        <pointLight position={[-4, 2, -4]} intensity={2} color={persona.color} />
        <pointLight position={[4, 2, -4]} intensity={1} color="#ffffff" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={1} />

        <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
          <HumanoidAvatar persona={persona} isSpeaking={isSpeaking} />
        </Float>

        <ContactShadows position={[0, -1.1, 0]} opacity={0.4} scale={5} blur={2.4} far={1.2} />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
          rotateSpeed={0.4}
        />
      </Canvas>
    </div>
  );
};

export default Avatar3D;
