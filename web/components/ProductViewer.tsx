import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export default function ProductViewer({ url }: { url: string }) {
  return (
    <div style={{ width: '100%', height: 500 }}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <Model url={url} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  )
}
