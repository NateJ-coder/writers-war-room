import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface RopeSegment {
  position: THREE.Vector3;
  oldPosition: THREE.Vector3;
  fixed: boolean;
}

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
  const ropesRef = useRef<Map<string, { segments: RopeSegment[]; mesh: THREE.Mesh }>>(new Map());
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

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.left = 0;
      camera.right = newWidth;
      camera.top = 0;
      camera.bottom = newHeight;
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
        scene.remove(rope.mesh);
        ropes.delete(id);
      }
    });

    // Create or update ropes
    connections.forEach(conn => {
      const existingRope = ropes.get(conn.id);
      
      if (!existingRope) {
        // Create new rope with physics segments
        const segments = createRopeSegments(conn.x1, conn.y1, conn.x2, conn.y2);
        const mesh = createRopeMesh(segments);
        scene.add(mesh);
        ropes.set(conn.id, { segments, mesh });
      } else {
        // Update fixed points
        existingRope.segments[0].position.set(conn.x1, conn.y1, 0);
        existingRope.segments[0].oldPosition.copy(existingRope.segments[0].position);
        
        const lastIdx = existingRope.segments.length - 1;
        existingRope.segments[lastIdx].position.set(conn.x2, conn.y2, 0);
        existingRope.segments[lastIdx].oldPosition.copy(existingRope.segments[lastIdx].position);
      }
    });

    // Start animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Physics simulation for all ropes
      ropes.forEach(rope => {
        simulateRope(rope.segments);
        updateRopeMesh(rope.mesh, rope.segments);
      });

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

  const createRopeSegments = (x1: number, y1: number, x2: number, y2: number): RopeSegment[] => {
    const numSegments = 10; // Fewer segments for better stability
    const segments: RopeSegment[] = [];
    const totalDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const segmentLength = totalDistance / numSegments;

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      
      // Initialize with slight sag for natural look
      const midPoint = numSegments / 2;
      const sagAmount = i === 0 || i === numSegments ? 0 : Math.sin((i / numSegments) * Math.PI) * 8;
      
      segments.push({
        position: new THREE.Vector3(x, y + sagAmount, 0),
        oldPosition: new THREE.Vector3(x, y + sagAmount, 0),
        fixed: i === 0 || i === numSegments
      });
    }
    
    // Store segment length for constraints
    (segments as any).restLength = segmentLength;

    return segments;
  };

  const createRopeMesh = (segments: RopeSegment[]): THREE.Mesh => {
    // Create curve from segments
    const points = segments.map(s => s.position);
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Create tube geometry for realistic rope
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      segments.length * 2, // segments
      1.2, // radius (thin string)
      8, // radial segments
      false // closed
    );

    // Rope material with texture
    const material = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(tubeGeometry, material);
    return mesh;
  };

  const simulateRope = (segments: RopeSegment[]) => {
    const gravity = new THREE.Vector3(0, 0.02, 0); // Very subtle gravity
    const damping = 0.95; // More damping for stability

    // Verlet integration
    segments.forEach(segment => {
      if (!segment.fixed) {
        const velocity = segment.position.clone().sub(segment.oldPosition);
        segment.oldPosition.copy(segment.position);
        segment.position.add(velocity.multiplyScalar(damping)).add(gravity);
      }
    });

    // Constraint iterations for string stiffness
    const iterations = 8; // More iterations for tighter rope
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i];
        const seg2 = segments[i + 1];
        
        const delta = seg2.position.clone().sub(seg1.position);
        const distance = delta.length();
        const restLength = (segments as any).restLength || 10;
        const diff = distance > 0.01 ? (distance - restLength) / distance : 0;
        
        if (!seg1.fixed && !seg2.fixed) {
          seg1.position.add(delta.multiplyScalar(diff * 0.5));
          seg2.position.sub(delta.multiplyScalar(diff * 0.5));
        } else if (!seg1.fixed) {
          seg1.position.add(delta.multiplyScalar(diff));
        } else if (!seg2.fixed) {
          seg2.position.sub(delta.multiplyScalar(diff));
        }
      }
    }
  };

  const updateRopeMesh = (mesh: THREE.Mesh, segments: RopeSegment[]) => {
    const points = segments.map(s => s.position);
    const curve = new THREE.CatmullRomCurve3(points);
    
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      segments.length * 2,
      1.2,
      8,
      false
    );

    mesh.geometry.dispose();
    mesh.geometry = tubeGeometry;
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
