import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LineConnectorProps {
  connections: Array<{
    id: string;
    point1: [number, number, number]; // [x, y, z] for thumbtack 1
    point2: [number, number, number]; // [x, y, z] for thumbtack 2
  }>;
}

const ThreeLineConnector = ({ connections }: LineConnectorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const linesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animationFrameRef = useRef<number>(0);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup orthographic camera (2D overlay matching DOM coordinates)
    const camera = new THREE.OrthographicCamera(
      0, width, height, 0, 0.1, 1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      premultipliedAlpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.left = 0;
      camera.right = newWidth;
      camera.top = newHeight;
      camera.bottom = 0;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update lines when connections change
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const lines = linesRef.current;

    // Remove lines that no longer exist
    const currentIds = new Set(connections.map(c => c.id));
    lines.forEach((lineGroup, id) => {
      if (!currentIds.has(id)) {
        scene.remove(lineGroup);
        lines.delete(id);
      }
    });

    // Create or update lines
    connections.forEach(conn => {
      let lineGroup = lines.get(conn.id);
      
      if (!lineGroup) {
        // Create new line group (shadow + main line)
        lineGroup = createTautLine();
        scene.add(lineGroup);
        lines.set(conn.id, lineGroup);
      }
      
      // Update line positions
      updateLinePositions(lineGroup, conn.point1, conn.point2);
    });

    // Start animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(scene, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connections]);

  const createTautLine = (): THREE.Group => {
    const group = new THREE.Group();

    // --- 1. Shadow Line (for 3D depth) ---
    const shadowGeometry = new THREE.BufferGeometry();
    shadowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); 
    
    const shadowMaterial = new THREE.LineBasicMaterial({
      color: 0x000000, // Black shadow
      linewidth: 5,
      transparent: true,
      opacity: 0.6, // Strong shadow for contrast on dark wood
      depthTest: false,
    });
    
    const shadowLine = new THREE.Line(shadowGeometry, shadowMaterial);
    // Offset: right 0.5, down 0.5, back 0.5 for 3D effect
    shadowLine.position.set(0.5, 0.5, -0.5);
    group.add(shadowLine);

    // --- 2. Main Neon Red/Pink Line ---
    const mainGeometry = new THREE.BufferGeometry();
    mainGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); 

    const mainMaterial = new THREE.LineBasicMaterial({
      color: 0xff006e, // Neon pink/red from vintage jazz theme
      linewidth: 3,
      depthTest: false,
    });
    
    const mainLine = new THREE.Line(mainGeometry, mainMaterial);
    mainLine.position.set(0, 0, 0);
    group.add(mainLine);
    
    return group;
  };

  const updateLinePositions = (
    group: THREE.Group, 
    point1: [number, number, number], 
    point2: [number, number, number]
  ) => {
    // Update both shadow and main line
    const shadowLine = group.children[0] as THREE.Line;
    const mainLine = group.children[1] as THREE.Line;
    
    const updatePositions = (line: THREE.Line) => {
      const positions = line.geometry.attributes.position.array as Float32Array;
      
      // Start point
      positions[0] = point1[0];
      positions[1] = point1[1];
      positions[2] = point1[2];

      // End point
      positions[3] = point2[0];
      positions[4] = point2[1];
      positions[5] = point2[2];
      
      line.geometry.attributes.position.needsUpdate = true;
    };

    updatePositions(shadowLine);
    updatePositions(mainLine);
  };

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

export default ThreeLineConnector;
