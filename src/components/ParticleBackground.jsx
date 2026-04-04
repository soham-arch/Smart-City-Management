import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

const ParticleBackground = () => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // ── Scene Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Particles ──
    const particleCount = 600;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = [];

    const neonGreen = new THREE.Color('#39ff8f');
    const neonBlue = new THREE.Color('#3d8fff');
    const neonPurple = new THREE.Color('#8b5cf6');
    const colorOptions = [neonGreen, neonBlue, neonPurple];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;

      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.01,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ── Connection Lines ──
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = 300;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // ── Mouse handler ──
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Resize handler ──
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ──
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      const posArr = particleGeometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3] += velocities[i].x;
        posArr[i * 3 + 1] += velocities[i].y;
        posArr[i * 3 + 2] += velocities[i].z;

        // Wrap around
        if (posArr[i * 3] > 50) posArr[i * 3] = -50;
        if (posArr[i * 3] < -50) posArr[i * 3] = 50;
        if (posArr[i * 3 + 1] > 50) posArr[i * 3 + 1] = -50;
        if (posArr[i * 3 + 1] < -50) posArr[i * 3 + 1] = 50;
        if (posArr[i * 3 + 2] > 25) posArr[i * 3 + 2] = -25;
        if (posArr[i * 3 + 2] < -25) posArr[i * 3 + 2] = 25;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Update connections
      let lineIdx = 0;
      const lPos = lineGeometry.attributes.position.array;
      const lCol = lineGeometry.attributes.color.array;
      const connectionDist = 12;

      for (let i = 0; i < particleCount && lineIdx < maxLines; i++) {
        for (let j = i + 1; j < particleCount && lineIdx < maxLines; j++) {
          const dx = posArr[i * 3] - posArr[j * 3];
          const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
          const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < connectionDist) {
            const alpha = 1 - dist / connectionDist;
            lPos[lineIdx * 6] = posArr[i * 3];
            lPos[lineIdx * 6 + 1] = posArr[i * 3 + 1];
            lPos[lineIdx * 6 + 2] = posArr[i * 3 + 2];
            lPos[lineIdx * 6 + 3] = posArr[j * 3];
            lPos[lineIdx * 6 + 4] = posArr[j * 3 + 1];
            lPos[lineIdx * 6 + 5] = posArr[j * 3 + 2];

            const c = alpha * 0.3;
            lCol[lineIdx * 6] = 0.22 * c;
            lCol[lineIdx * 6 + 1] = 1.0 * c;
            lCol[lineIdx * 6 + 2] = 0.56 * c;
            lCol[lineIdx * 6 + 3] = 0.22 * c;
            lCol[lineIdx * 6 + 4] = 1.0 * c;
            lCol[lineIdx * 6 + 5] = 0.56 * c;

            lineIdx++;
          }
        }
      }
      // Zero out remaining lines
      for (let i = lineIdx; i < maxLines; i++) {
        lPos[i * 6] = 0; lPos[i * 6 + 1] = 0; lPos[i * 6 + 2] = 0;
        lPos[i * 6 + 3] = 0; lPos[i * 6 + 4] = 0; lPos[i * 6 + 5] = 0;
      }
      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;

      // Mouse parallax
      camera.position.x += (mouseRef.current.x * 3 - camera.position.x) * 0.02;
      camera.position.y += (mouseRef.current.y * 3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default ParticleBackground;
