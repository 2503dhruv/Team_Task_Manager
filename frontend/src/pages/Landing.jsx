import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-white">
      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center backdrop-blur-md bg-slate-900/60 border-b border-slate-800">
        <div className="text-2xl font-bold tracking-tight text-indigo-400">TeamTask<span className="text-white">.io</span></div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 font-medium text-white border border-indigo-500/30 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition backdrop-blur-sm">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-4">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black text-center tracking-tighter"
        >
          Organize work, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
            brilliantly.
          </span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-6 text-xl md:text-2xl text-slate-300 max-w-2xl text-center font-light leading-relaxed"
        >
          A next-generation management platform for modern teams to assign tasks, track progress, and ship faster.
        </motion.p>
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.8, duration: 0.5 }}
           className="mt-12 pointer-events-auto"
        >
          <Link to="/login" className="group relative px-8 py-4 font-bold text-white bg-indigo-600 rounded-2xl overflow-hidden hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] flex items-center gap-2">
            <span>Get Started for Free</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </div>

      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} color="#a5b4fc" />
          <directionalLight position={[-10, -10, -5]} intensity={1} color="#f472b6" />
          
          <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
            <Sphere args={[1.5, 64, 64]}>
              <MeshDistortMaterial
                color="#4f46e5"
                attach="material"
                distort={0.5}
                speed={1.5}
                roughness={0.2}
                metalness={0.8}
              />
            </Sphere>
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      </div>
    </div>
  );
}