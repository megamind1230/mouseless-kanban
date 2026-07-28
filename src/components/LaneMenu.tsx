import { useBoardDispatch } from '../store'

interface LaneMenuProps {
  laneId: string
  onClose: () => void
  onRename: () => void
}

export default function LaneMenu({ laneId, onClose, onRename }: LaneMenuProps) {
  const dispatch = useBoardDispatch()

  function act(fn: () => void) {
    return () => { fn(); onClose() }
  }

  return (
    <div className="lane-menu">
      <button className="lane-menu-item" onClick={act(onRename)}>Rename</button>
      <button className="lane-menu-item" onClick={act(() => dispatch({ type: 'MOVE_LANE', laneId, direction: 'left' }))}>Move Left</button>
      <button className="lane-menu-item" onClick={act(() => dispatch({ type: 'MOVE_LANE', laneId, direction: 'right' }))}>Move Right</button>
      <button className="lane-menu-item lane-menu-item--danger" onClick={act(() => dispatch({ type: 'DELETE_LANE', laneId }))}>Delete</button>
    </div>
  )
}
