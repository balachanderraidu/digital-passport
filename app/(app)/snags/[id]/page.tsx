// Server component — exports generateStaticParams for static export
import SnagDetailClient from './client'

export function generateStaticParams() {
  return ['s1', 's2', 's3', 's4', 's5'].map(id => ({ id }))
}

export default function SnagDetailPage({ params }: { params: { id: string } }) {
  return <SnagDetailClient id={params.id} />
}
