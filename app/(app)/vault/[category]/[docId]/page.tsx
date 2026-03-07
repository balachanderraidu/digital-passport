// Server component — exports generateStaticParams for static export
import VaultDocClient from './client'

export function generateStaticParams() {
  const categories = ['ownership', 'maintenance', 'interior', 'tax', 'manuals', 'warranties']
  const docIds = ['doc-001', 'doc-002', 'doc-003', 'doc-004', 'doc-005', 'doc-006']
  return categories.flatMap(category => docIds.map(docId => ({ category, docId })))
}

export default function VaultDocPage({ params }: { params: { category: string; docId: string } }) {
  return <VaultDocClient category={params.category} docId={params.docId} />
}
