import { useEffect, useRef } from 'react'
import { Play } from 'lucide-react'

export default function CustomCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const moveCursor = (event) => {
      const cursor = cursorRef.current
      if (!cursor) return
      cursor.style.left = `${event.clientX}px`
      cursor.style.top = `${event.clientY}px`
      cursor.classList.toggle('is-visible', Boolean(document.elementFromPoint(event.clientX, event.clientY)?.closest('.project-card')))
    }

    window.addEventListener('pointermove', moveCursor)
    return () => window.removeEventListener('pointermove', moveCursor)
  }, [])

  return <div ref={cursorRef} className="custom-cursor" aria-hidden="true"><Play size={12} fill="currentColor" /><span>PLAY</span></div>
}
