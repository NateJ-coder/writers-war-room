import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeRopeProps {
  connections: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  onConnectionClick?: (id: string) => void;
}

const ThreeRope = ({ connections }: ThreeRopeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ropesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup orthographic camera for 2D overlay (match DOM coordinates)
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

    // Add ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(50, 50, 100);
    scene.add(directionalLight);

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
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const ropes = ropesRef.current;

    // Remove ropes that no longer exist
    const currentIds = new Set(connections.map(c => c.id));
    ropes.forEach((rope, id) => {
      if (!currentIds.has(id)) {
        scene.remove(rope);
        ropes.delete(id);
      }
    });

    // Create or update ropes
    connections.forEach(conn => {
      const existingRope = ropes.get(conn.id);
      
      if (!existingRope) {
        // Create new taut line with shadow
        const lineGroup = createLineWithShadow();
        scene.add(lineGroup);
        ropes.set(conn.id, lineGroup);
      }
      
      // Update line positions
      const lineGroup = ropes.get(conn.id);
      if (lineGroup) {
        updateLinePositions(
          lineGroup, 
          new THREE.Vector3(conn.x1, conn.y1, 0),
          new THREE.Vector3(conn.x2, conn.y2, 0)
        );
      }
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

  const createLineWithShadow = (): THREE.Group => {
    // Create a container group for the line and its shadow
    const group = new THREE.Group();

    // --- 1. Shadow Line (for depth) ---
    const shadowGeometry = new THREE.BufferGeometry();
    shadowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); 
    
    const shadowMaterial = new THREE.LineBasicMaterial({
      color: 0x000000, // Black shadow
      linewidth: 4,
      transparent: true,
      opacity: 0.3, // Subtle shadow effect
    });
    
    const shadowLine = new THREE.Line(shadowGeometry, shadowMaterial);
    // Offset shadow slightly down and right for depth
    shadowLine.position.set(2, 2, -0.5);
    group.add(shadowLine);

    // --- 2. Main Red Line ---
    const mainGeometry = new THREE.BufferGeometry();
    mainGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); 

    const mainMaterial = new THREE.LineBasicMaterial({
      color: 0xcc0000, // Deep red for classic detective board
      linewidth: 2.5, 
    });
    
    const mainLine = new THREE.Line(mainGeometry, mainMaterial);
    mainLine.position.set(0, 0, 0);
    group.add(mainLine);
    
    return group;
  };

  const updateLinePositions = (group: THREE.Group, point1: THREE.Vector3, point2: THREE.Vector3) => {
    // Update both shadow and main line
    const shadowLine = group.children[0] as THREE.Line;
    const mainLine = group.children[1] as THREE.Line;
    
    const updatePositions = (line: THREE.Line) => {
      const positions = line.geometry.attributes.position.array as Float32Array;
      positions[0] = point1.x; // x1
      positions[1] = point1.y; // y1
      positions[2] = point1.z; // z1

      positions[3] = point2.x; // x2
      positions[4] = point2.y; // y2
      positions[5] = point2.z; // z2
      
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

export default ThreeRope;
