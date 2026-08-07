import { useEffect, useRef } from 'react'
import { useBoardState } from '../store'
import Lane from './Lane'

interface BoardViewProps {
  counterStyle?: 'pending' | 'pending-total' | 'done-total' | 'total'
}

export default function BoardView({ counterStyle }: BoardViewProps) {
  const { board, activeLane } = useBoardState()
  const boardRef = useRef<HTMLDivElement>(null)

  // Scroll active lane into view (horizontal) when switching lanes
  useEffect(() => {
    const container = boardRef.current
    const laneEl = container?.querySelector('.lane--active')
    if (!container || !laneEl) return
    const pad = 12
    const cr = container.getBoundingClientRect()
    const lr = (laneEl as HTMLElement).getBoundingClientRect()
    if (lr.left < cr.left + pad) {
      container.scrollLeft -= cr.left + pad - lr.left
    } else if (lr.right > cr.right - pad) {
      container.scrollLeft += lr.right - (cr.right - pad)
    }
  }, [activeLane])

  if (!board) return null

  return (
    <div className="board" ref={boardRef}>
      {board.lanes.map((lane, i) => (
        <Lane key={lane.id} lane={lane} isActive={i === activeLane} counterStyle={counterStyle} />
      ))}
    </div>
  )
}
