import { useEffect, useState } from 'react'

export default function CrimeThreads({ boardRef, projectKey }) {
  const [threads, setThreads] = useState({ width: 0, height: 0, paths: [] })

  useEffect(() => {
    const board = boardRef.current
    if (!board) return undefined

    const measure = () => {
      const bounds = board.getBoundingClientRect()
      const cards = [...board.querySelectorAll('[data-project-card]')]
      const centers = cards.map((card) => {
        const rect = card.getBoundingClientRect()
        return {
          x: rect.left - bounds.left + board.scrollLeft + rect.width / 2,
          y: rect.top - bounds.top + board.scrollTop + rect.height / 2,
          width: rect.width,
          height: rect.height,
        }
      })

      let seed = 2166136261
      for (const character of projectKey) {
        seed = Math.imul(seed ^ character.charCodeAt(0), 16777619)
      }
      const random = () => {
        seed += 0x6D2B79F5
        let value = seed
        value = Math.imul(value ^ (value >>> 15), value | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
      }
      if (centers.length < 2) {
        setThreads({ width: board.scrollWidth, height: board.scrollHeight, paths: [] })
        return
      }

      const edges = []
      const edgeKeys = new Set()
      const degrees = new Array(centers.length).fill(0)
      const addEdge = (left, right) => {
        const key = left < right ? `${left}-${right}` : `${right}-${left}`
        if (left !== right && !edgeKeys.has(key) && degrees[left] < 2 && degrees[right] < 2) {
          edgeKeys.add(key)
          edges.push([left, right])
          degrees[left] += 1
          degrees[right] += 1
        }
      }

      const maxDistance = Math.max(...centers.map((card) => card.width)) * 1.7
      const candidates = []
      for (let left = 0; left < centers.length; left += 1) {
        for (let right = left + 1; right < centers.length; right += 1) {
          if (Math.hypot(centers[right].x - centers[left].x, centers[right].y - centers[left].y) <= maxDistance) {
            candidates.push([left, right])
          }
        }
      }
      for (let index = candidates.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1))
        const current = candidates[index]
        candidates[index] = candidates[swapIndex]
        candidates[swapIndex] = current
      }
      const targetEdges = Math.min(Math.ceil(centers.length * 0.4), 16)
      for (const [left, right] of candidates) {
        if (edges.length >= targetEdges) break
        addEdge(left, right)
      }

      const anchor = (from, to) => {
        const dx = to.x - from.x
        const dy = to.y - from.y
        const scale = Math.min(
          (from.width * 0.48) / Math.max(Math.abs(dx), 1),
          (from.height * 0.48) / Math.max(Math.abs(dy), 1),
        )
        const baseX = from.x + dx * scale
        const baseY = from.y + dy * scale
        const tangentOffset = (random() - 0.5) * Math.min(from.width, from.height) * 0.24
        return Math.abs(dx) > Math.abs(dy)
          ? { x: baseX, y: Math.max(from.y - from.height * 0.42, Math.min(from.y + from.height * 0.42, baseY + tangentOffset)) }
          : { x: Math.max(from.x - from.width * 0.42, Math.min(from.x + from.width * 0.42, baseX + tangentOffset)), y: baseY }
      }

      const paths = edges.map(([fromIndex, toIndex]) => {
        const from = centers[fromIndex]
        const to = centers[toIndex]
        const start = anchor(from, to)
        const end = anchor(to, from)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const distance = Math.max(Math.hypot(dx, dy), 1)
        const bend = (random() - 0.5) * Math.min(72, distance * 0.28)
        const controlX = (start.x + end.x) / 2 - (dy / distance) * bend
        const controlY = (start.y + end.y) / 2 + (dx / distance) * bend
        return {
          d: `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`,
          x1: start.x,
          y1: start.y,
          x2: end.x,
          y2: end.y,
        }
      })

      setThreads({ width: board.scrollWidth, height: board.scrollHeight, paths })
    }

    const observer = new ResizeObserver(measure)
    observer.observe(board)
    board.querySelectorAll('[data-project-card]').forEach((card) => observer.observe(card))
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [boardRef, projectKey])

  if (!threads.paths.length) return null

  return (
    <svg className="crime-threads" width={threads.width} height={threads.height} viewBox={`0 0 ${threads.width} ${threads.height}`} aria-hidden="true">
      {threads.paths.map((thread, index) => (
        <g key={`${projectKey}-${index}`}>
          <path className="thread-shadow" d={thread.d} />
          <path className="thread-core" d={thread.d} />
          <path className="thread-line" d={thread.d} />
          <circle className="thread-pin-shadow" cx={thread.x1} cy={thread.y1} r="6" />
          <circle className="thread-pin-shadow" cx={thread.x2} cy={thread.y2} r="6" />
          <circle className="thread-pin" cx={thread.x1} cy={thread.y1} r="4.5" />
          <circle className="thread-pin" cx={thread.x2} cy={thread.y2} r="4.5" />
        </g>
      ))}
    </svg>
  )
}
