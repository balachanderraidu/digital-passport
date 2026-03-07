// Server component — exports generateStaticParams for static export
import VaultCategoryClient from './client'

export function generateStaticParams() {
  return ['ownership', 'maintenance', 'interior', 'tax', 'manuals', 'warranties'].map(category => ({ category }))
}

export default function VaultCategoryPage({ params }: { params: { category: string } }) {
  return <VaultCategoryClient category={params.category} />
}
