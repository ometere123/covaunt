import { CovenantDetailView } from '../../../components/CovenantDetailView';

export const metadata = { title: 'Covenant detail' };

export default async function CovenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CovenantDetailView id={id} />;
}
