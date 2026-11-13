import { MandateDetailView } from '../../../components/MandateDetailView';

export const metadata = { title: 'Mandate detail' };

export default async function MandateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MandateDetailView id={id} />;
}
