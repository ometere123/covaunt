import { WorkTaskDetail } from '../../../../components/WorkTaskDetail';

export const metadata = { title: 'Task detail' };

export default async function WorkTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkTaskDetail id={id} />;
}
