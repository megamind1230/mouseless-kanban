export type CounterStyle = 'pending' | 'pending-total' | 'done-total' | 'total'

interface CounterBadgeProps {
  style: CounterStyle
  pending: number
  total: number
}

export default function CounterBadge({ style, pending, total }: CounterBadgeProps) {
  const done = total - pending
  const pendingClass = pending === 0 ? 'count--done' : 'count--pending'

  switch (style) {
    case 'pending-total':
      return (
        <>
          <span className={pendingClass}>{pending}</span>
          <span className="count--sep">/</span>
          <span className="count--total">{total}</span>
        </>
      )
    case 'done-total':
      return (
        <>
          <span className="count--done">{done}</span>
          <span className="count--sep">/</span>
          <span className="count--total">{total}</span>
        </>
      )
    case 'total':
      return <span className="count--total">{total}</span>
    default:
      return <span className={pendingClass}>{pending}</span>
  }
}
