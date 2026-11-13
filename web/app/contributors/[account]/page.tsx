import { ContributorProfileView } from '../../../components/ContributorProfileView';

export const metadata = { title: 'Contributor record' };

export default async function ContributorPage({ params }: { params: Promise<{ account: string }> }) {
  const { account } = await params;
  return <ContributorProfileView account={decodeURIComponent(account)} />;
}
