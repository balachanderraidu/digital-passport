// Server component — exports generateStaticParams for static export
import WarrantyDetailClient from './client'

export function generateStaticParams() {
  return ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map(id => ({ id }))
}

export default function WarrantyDetailPage({ params }: { params: { id: string } }) {
  return <WarrantyDetailClient id={params.id} />
}
