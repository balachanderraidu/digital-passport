// Server component — exports generateStaticParams for static export
import SnagDetailClient from './client'

export function generateStaticParams() {
  return [
    ...['s1', 's2', 's3', 's4', 's5'],
    ...['sn-1', 'sn-2', 'sn-3', 'sn-4', 'sn-5'],
    // Active (construction) mode snags
    ...['sn-a1', 'sn-a2', 'sn-a3', 'sn-a4', 'sn-a5', 'sn-a6'],
    // Rental mode snags
    ...['sn-rental-1', 'sn-rental-2', 'sn-rental-3'],
    // Construction property snags
    ...['sn-c1', 'sn-c2', 'sn-c3', 'sn-c4', 'sn-c5', 'sn-c6'],
  ].map(id => ({ id }))
}

export default function SnagDetailPage({ params }: { params: { id: string } }) {
  return <SnagDetailClient id={params.id} />
}
