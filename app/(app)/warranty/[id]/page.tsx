// Server component — exports generateStaticParams for static export
import WarrantyDetailClient from './client'

export function generateStaticParams() {
  // real IDs (placeholder) + all 8 demo IDs
  return [
    ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
    ...['wa-1', 'wa-2', 'wa-3', 'wa-4', 'wa-5', 'wa-6', 'wa-7', 'wa-8'],
  ].map(id => ({ id }))
}

export default function WarrantyDetailPage({ params }: { params: { id: string } }) {
  return <WarrantyDetailClient id={params.id} />
}
