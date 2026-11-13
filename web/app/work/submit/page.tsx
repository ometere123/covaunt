import { WorkSubmissionView } from '../../../components/WorkSubmissionView';

export const metadata = { title: 'Submit completion evidence' };

export default async function WorkSubmitPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const params = await searchParams;
  return <WorkSubmissionView initialTaskId={params.task || ''} />;
}
