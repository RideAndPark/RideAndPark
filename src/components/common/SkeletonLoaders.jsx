export function ParkingDetailSkeleton() {
  return (
    <article className="detail-card skeleton-card">
      <div className="skeleton skeleton-bar" style={{ width: '60%' }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-bar" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div className="skeleton skeleton-bar" />
        <div className="skeleton skeleton-bar" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    </article>
  )
}

export function ParkingListSkeleton() {
  return (
    <div className="list-panel">
      <h3>Trefferliste</h3>
      <div className="parking-list">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={`skeleton-${idx}`} className="skeleton-card skeleton" style={{ height: '80px', borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonBox({ width = '100%', height = '20px', style = {} }) {
  return (
    <span 
      className="skeleton" 
      style={{ 
        height, 
        width, 
        borderRadius: '4px', 
        display: 'inline-block',
        ...style
      }} 
    />
  )
}
