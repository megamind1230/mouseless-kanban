import { useBoardState } from '../store'
import Lane from './Lane'

interface BoardViewProps {
  counterStyle?: 'pending' | 'pending-total' | 'total'
}

export default function BoardView({ counterStyle }: BoardViewProps) {
  const { board, activeLane } = useBoardState()
  if (!board) return null

  return (
    <div className="board">
      {board.lanes.map((lane, i) => (
        <Lane key={lane.id} lane={lane} isActive={i === activeLane} counterStyle={counterStyle} />
      ))}
    </div>
  )
}
