import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField,
  SMAA,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  generateFPoints,
  generateTPoints,
  generateUPoints,
  generateRPoints,
  generateOPoints,
  generateVPoints,
  generateAPoints,
  pointsOuter,
  generateResponsiveOuterPoints,
  calculateColor,
} from "./utils";

const ParticleRing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
  });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      });
    };

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // Initial size check
    handleResize();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Responsive camera settings
  const getCameraConfig = () => {
    if (screenSize.isMobile) {
      return {
        position: [0, 0, 180],
        fov: 65,
      };
    } else if (screenSize.isTablet) {
      return {
        position: [0, 0, 150],
        fov: 55,
      };
    } else {
      return {
        position: [0, 0, 120],
        fov: 50,
      };
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Scan lines overlay - adjusted for mobile */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/3 to-transparent animate-pulse delay-1000"></div>
      </div>
      
      <Canvas
        camera={getCameraConfig()}
        style={{ 
          height: "100vh",
          width: "100vw",
          touchAction: screenSize.isMobile ? "none" : "auto"
        }}
        className="bg-black"
        gl={{ 
          antialias: !screenSize.isMobile, // Disable antialiasing on mobile for performance
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: screenSize.isMobile ? "default" : "high-performance",
          precision: screenSize.isMobile ? "mediump" : "highp",
        }}
        dpr={screenSize.isMobile ? [1, 1.5] : [1, 2]} // Limit pixel ratio on mobile
      >
        <fog attach="fog" args={['#000011', screenSize.isMobile ? 80 : 60, screenSize.isMobile ? 350 : 250]} />
        
        {/* Responsive Lighting System */}
        <ambientLight intensity={0.04} color="#1a0d4d" />
        <directionalLight 
          position={[20, 20, 10]} 
          intensity={screenSize.isMobile ? 0.4 : 0.6} 
          color="#00D4FF" 
          castShadow={!screenSize.isMobile}
        />
        <directionalLight 
          position={[-20, -20, -10]} 
          intensity={screenSize.isMobile ? 0.2 : 0.4} 
          color="#FF0080" 
        />
        <pointLight position={[-40, 0, -40]} intensity={screenSize.isMobile ? 4 : 8} color="#FF0080" distance={120} />
        <pointLight position={[40, 30, 40]} intensity={screenSize.isMobile ? 3 : 6} color="#00FF88" distance={100} />
        <pointLight position={[0, -50, 0]} intensity={screenSize.isMobile ? 2.5 : 5} color="#8000FF" distance={90} />
          <>
            <spotLight
              position={[0, 80, 0]}
              angle={0.4}
              penumbra={1}
              intensity={6}
              color="#00D4FF"
              castShadow
            />
            <spotLight
              position={[0, -80, 0]}
              angle={0.3}
              penumbra={0.8}
              intensity={4}
              color="#FF0080"
              target-position={[0, 0, 0]}
            />
          </>

        {/* Background Elements - Responsive */}
        <Stars 
          radius={screenSize.isMobile ? 200 : 400} 
          depth={screenSize.isMobile ? 40 : 80} 
          count={screenSize.isMobile ? 8000 : 12000} 
          factor={screenSize.isMobile ? 4 : 8} 
          saturation={1} 
          fade={true}
          speed={0.4}
        />
        
        <Environment preset="night" />

        <OrbitControls 
          maxDistance={screenSize.isMobile ? 250 : 100} 
          minDistance={screenSize.isMobile ? 50 : 10} 
          enablePan={false}
          enableZoom={!screenSize.isMobile} // Disable zoom on mobile to prevent conflicts
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
          touches={{
            ONE: screenSize.isMobile ? THREE.TOUCH.ROTATE : THREE.TOUCH.ROTATE,
            TWO: screenSize.isMobile ? THREE.TOUCH.DOLLY_PAN : THREE.TOUCH.DOLLY_PAN
          }}
        />

        <PointCircle mousePosition={mousePosition} screenSize={screenSize} />
        <FloatingParticles screenSize={screenSize} />
        <QuantumField screenSize={screenSize} />

        {/* Responsive Post-processing Effects */}
        <EffectComposer enabled={true}> {/* Disable heavy effects on mobile */}
          <SMAA />
          <Bloom
            intensity={screenSize.isMobile ? 1 : screenSize.isTablet ? 1.4 : 1.8}
            kernelSize={3}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.6}
            blendFunction={BlendFunction.SCREEN}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.002, 0.002]}
          />
          {!screenSize.isTablet && !screenSize.isMobile && (
            <DepthOfField
              focusDistance={0.015}
              focalLength={0.08}
              bokehScale={8}
            />
          )}
          <Vignette
            eskil={false}
            offset={0.05}
            darkness={1.2}
          />
          <Noise
            premultiply
            blendFunction={BlendFunction.OVERLAY}
            opacity={0.3}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

const FloatingParticles = ({ screenSize }) => {
  const meshRef = useRef();
  
  // Responsive particle count
  const particleCount = screenSize.isMobile ? 700 : screenSize.isTablet ? 1000 : 2000;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    
    const tempColor = new THREE.Color();
    const maxRadius = screenSize.isMobile ? 200 : 200;
    const minRadius = screenSize.isMobile ? 25 : 50;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a large sphere
      const radius = Math.random() * maxRadius + minRadius;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random colors with elegant violet palette
      const colorChoices = ['#8B5CF6', '#A855F7', '#6D28D9', '#7C3AED', '#9333EA'];
      tempColor.set(colorChoices[Math.floor(Math.random() * colorChoices.length)]);
      
      colors[i3] = tempColor.r;
      colors[i3 + 1] = tempColor.g;
      colors[i3 + 2] = tempColor.b;
      
      scales[i] = Math.random() * 2 + 0.5;
    }
    
    return { positions, colors, scales };
  }, [particleCount, screenSize]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Slow, gentle rotation only
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.005;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.003) * 0.02;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={particleCount}
          array={particles.scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={screenSize.isMobile ? 1.0 : 1.5}
        vertexColors={true}
        transparent={true}
        opacity={0.3}
        sizeAttenuation={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

const PointCircle = React.memo(({ mousePosition, screenSize }) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Responsive text scaling
  const textScale = 1.0;

  // Memoize all points calculation and geometry creation
  const { positions, colors, scales } = useMemo(() => {
    // Letter widths based on their generator functions
    const letterWidths = {
      F: 7,  // F_WIDTH
      U1: 7,  // U_WIDTH  
      T: 2,  // T_WIDTH
      U2: 20,  // U_WIDTH  
      R: -5,  // R_WIDTH
      O: 12,  // O_WIDTH
      V: 2,  // V_WIDTH
      A: 10   // A_WIDTH
    };
    
    const padding = 2; // Space between letters
    const letters = ['F', 'U1', 'T', 'U2', 'R', 'O', 'V', 'A'];
    
    // Calculate total width of all letters plus padding
    const totalWidth = letters.reduce((sum, letter) => sum + letterWidths[letter], 0) + (letters.length - 1) * padding;
    
    // Calculate starting position to center the word
    let currentX = -totalWidth / 2 + 3;
    
    // Calculate positions for each letter
    const letterPositions = [];
    letters.forEach((letter, index) => {
      letterPositions.push(currentX + letterWidths[letter] / 2);
      currentX += letterWidths[letter] + padding;
    });

    // Helper function to offset and scale letter points
    const offsetPoints = (points, offsetX) => {
      const scale = 1.2; // Increased scale for better visibility
      return points.map(point => ({
        ...point,
        position: [
          (point.position[0] + offsetX) * scale, 
          point.position[1] * scale, 
          point.position[2] * scale
        ]
      }));
    };

    // Collect all points (letters without colors)
    const letterPoints = [
      ...offsetPoints(generateFPoints(), letterPositions[0]),
      ...offsetPoints(generateUPoints(), letterPositions[1]),
      ...offsetPoints(generateTPoints(), letterPositions[2]),
      ...offsetPoints(generateUPoints(), letterPositions[3]),
      ...offsetPoints(generateRPoints(), letterPositions[4]),
      ...offsetPoints(generateOPoints(), letterPositions[5]),
      ...offsetPoints(generateVPoints(), letterPositions[6]),
      ...offsetPoints(generateAPoints(), letterPositions[7]),
    ];

    // Calculate the bounds of all letter points to determine gradient range
    let minX = Infinity;
    let maxX = -Infinity;
    letterPoints.forEach(point => {
      if (point.position[0] < minX) minX = point.position[0];
      if (point.position[0] > maxX) maxX = point.position[0];
    });

    // Calculate colors for letter points based on their global x position
    const letterPointsWithColors = letterPoints.map(point => ({
      ...point,
      color: calculateColor(point.position[0], false, minX, maxX)
    }));

    // Use responsive outer points generation
    const outerPoints = generateResponsiveOuterPoints(screenSize.isMobile);
    const allPoints = [
      ...letterPointsWithColors,
      ...outerPoints
    ];

    // Create Float32Arrays for positions, colors, and scales
    const positionsArray = new Float32Array(allPoints.length * 3);
    const colorsArray = new Float32Array(allPoints.length * 3);
    const scalesArray = new Float32Array(allPoints.length);
    
    const tempColor = new THREE.Color();
    
    allPoints.forEach((point, i) => {
      const i3 = i * 3;
      // Set positions
      positionsArray[i3] = point.position[0];
      positionsArray[i3 + 1] = point.position[1];
      positionsArray[i3 + 2] = point.position[2];
      
      // Set colors
      tempColor.set(point.color);
      colorsArray[i3] = tempColor.r;
      colorsArray[i3 + 1] = tempColor.g;
      colorsArray[i3 + 2] = tempColor.b;
      
      // Set random scales for more organic look
      scalesArray[i] = Math.random() * 2 + 0.5;
    });

    return { positions: positionsArray, colors: colorsArray, scales: scalesArray };
  }, [screenSize]);

  useFrame(({ clock, mouse }) => {
    if (pointsRef.current) {
      const time = clock.getElapsedTime();
      
      // Keep text centered - no mouse movement
      pointsRef.current.position.x = 0;
      pointsRef.current.position.y = Math.sin(time * 0.5) * 1.5;
      pointsRef.current.position.z = 0;
      
      // Gentle rotation only - slower on mobile
      const rotationSpeed = screenSize.isMobile ? 0.01 : 0.02;
      pointsRef.current.rotation.y = time * rotationSpeed;
      pointsRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
      pointsRef.current.rotation.z = Math.sin(time * 0.2) * 0.02;
      
      // Smoother breathing effect
      const breathe = Math.sin(time * 0.6) * 0.04 + textScale;
      pointsRef.current.scale.setScalar(breathe);
      
      // Reduced glitch effect - less frequent on mobile
      const glitchProbability = screenSize.isMobile ? 0.001 : 0.002;
      if (Math.random() < glitchProbability) {
        pointsRef.current.position.x += (Math.random() - 0.5) * 2;
        pointsRef.current.position.z += (Math.random() - 0.5) * 2;
      }
    }

    if (materialRef.current) {
      // Smoother pulsing
      materialRef.current.opacity = 0.95 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
      const baseSize = screenSize.isMobile ? 6 : 8;
      materialRef.current.size = baseSize + Math.sin(clock.getElapsedTime() * 1.2) * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={scales.length}
          array={scales}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial 
        ref={materialRef}
        size={screenSize.isMobile ? 6 : 8}
        vertexColors={true}
        transparent={true}
        opacity={1.0}
        sizeAttenuation={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
});

const QuantumField = ({ screenSize }) => {
  const fieldRef = useRef();
  
  // Responsive particle count
  const particleCount = screenSize.isMobile ? 800 : screenSize.isTablet ? 1500 : 3000;

  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    const tempColor = new THREE.Color();
    const fieldSize = screenSize.isMobile ? 200 : 400;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in a cube
      positions[i3] = (Math.random() - 0.5) * fieldSize;
      positions[i3 + 1] = (Math.random() - 0.5) * fieldSize;
      positions[i3 + 2] = (Math.random() - 0.5) * fieldSize;
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      
      // Elegant violet colors
      const colorChoices = ['#8B5CF6', '#A855F7', '#6D28D9', '#7C3AED', '#9333EA'];
      tempColor.set(colorChoices[Math.floor(Math.random() * colorChoices.length)]);
      
      colors[i3] = tempColor.r;
      colors[i3 + 1] = tempColor.g;
      colors[i3 + 2] = tempColor.b;
    }
    
    return { positions, colors, velocities };
  }, [particleCount, screenSize]);

  useFrame(({ clock }) => {
    if (fieldRef.current) {
      const time = clock.getElapsedTime();
      const positions = fieldRef.current.geometry.attributes.position.array;
      const boundary = screenSize.isMobile ? 100 : 200;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Much gentler quantum field movement
        positions[i3] += Math.sin(time * 0.1 + i * 0.001) * 0.005;
        positions[i3 + 1] += Math.cos(time * 0.05 + i * 0.002) * 0.005;
        positions[i3 + 2] += Math.sin(time * 0.08 + i * 0.0015) * 0.005;
        
        // Boundary conditions
        if (Math.abs(positions[i3]) > boundary) positions[i3] *= -0.1;
        if (Math.abs(positions[i3 + 1]) > boundary) positions[i3 + 1] *= -0.1;
        if (Math.abs(positions[i3 + 2]) > boundary) positions[i3 + 2] *= -0.1;
      }
      
      fieldRef.current.geometry.attributes.position.needsUpdate = true;
      // Very slow rotation
      fieldRef.current.rotation.y = time * 0.002;
    }
  });

  return (
    <points ref={fieldRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={screenSize.isMobile ? 0.6 : 0.8}
        vertexColors={true}
        transparent={true}
        opacity={0.15}
        sizeAttenuation={true}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

export default ParticleRing;
