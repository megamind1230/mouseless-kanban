import { useBoardState } from '../store'

interface StatusBarProps {
  filePath: string | null
  dirty: boolean
}

export default function StatusBar({ filePath, dirty }: StatusBarProps) {
  const { mode, activeLane, activeCard, board } = useBoardState()
  const fileName = filePath?.split('/').pop() || 'No file'
  const dirtyMarker = dirty ? ' *' : ''
  const laneCount = board?.lanes.length || 0

  return (
    <div className="status-bar">
      <span className="status-file">{fileName}{dirtyMarker}</span>
      <span className="status-info">
        {laneCount > 0 && `L:${activeLane + 1}/${laneCount} C:${activeCard + 1}`}
        <span className={`status-mode status-mode--${mode}`}>{mode.toUpperCase()}</span>
      </span>
    </div>
  )
}
