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
import { useSiteContent } from './context/SiteContentContext'

export default function App() {
  const [selectedProject, setSelectedProject] = useState(null)
  const { siteContent } = useSiteContent()
  const sections = {
    hero: <Hero />,
    work: <Portfolio onSelect={setSelectedProject} />,
    services: <Services />,
    about: <About />,
    process: <Process />,
    contact: <CTA />,
  }

  return (
    <>
      <PaperTexture />
      <CustomCursor />
      <Navbar />
      <main>
        {siteContent.sectionOrder.map((section) => <div className="site-section-slot" key={section}>{sections[section]}</div>)}
      </main>
      <Footer />
      {selectedProject && <VideoModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </>
  )
}
