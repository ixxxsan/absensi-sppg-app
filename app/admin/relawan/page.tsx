import ClientRelawan from './ClientRelawan';
import { getRelawans } from '@/app/actions/relawan';

export const dynamic = 'force-dynamic';

export default async function RelawanPage() {
  const relawans = await getRelawans();
  
  return <ClientRelawan initialData={relawans} />;
}
