import ClientRelawan from './ClientRelawan';
import { getRelawans } from '@/app/actions/relawan';

export default async function RelawanPage() {
  const relawans = await getRelawans();
  
  return <ClientRelawan initialData={relawans} />;
}
