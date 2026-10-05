import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Portfolio from './components/Portfolio'
import Services from './components/Services'
import About from './components/About'
import Process from './components/Process'
import CTA from './components/CTA'
import Footer from './components/Footer'
import VideoModal from './components/VideoModal'
import PaperTexture from './components/PaperTexture'
import CustomCursor from './components/CustomCursor'

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null)

  return (
    <>
      <PaperTexture />
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <Portfolio onSelect={setSelectedProject} />
        <Services />
        <About />
        <Process />
        <CTA />
      </main>
      <Footer />
      {selectedProject && <VideoModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  )
}
