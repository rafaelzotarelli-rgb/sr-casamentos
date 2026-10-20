import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPanelContext } from '@/lib/agency';
import { EditWeddingForm } from './edit-wedding-form';

export const metadata: Metadata = { title: 'Editar casamento' };

export default async function EditWedding({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, agency } = await getPanelContext(`/painel/casamentos/${id}/editar`);
  if (!agency) return null;

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', id)
    .eq('agency_id', agency.id)
    .maybeSingle();
  if (!wedding) notFound();

  return (
    <div className="stack">
      <p>
        <Link href={`/painel/casamentos/${id}`}>← Voltar aos detalhes</Link>
      </p>
      <h1>
        Editar: {wedding.partner1_name} e {wedding.partner2_name}
      </h1>
      <div className="card">
        <EditWeddingForm wedding={wedding} />
      </div>
    </div>
  );
}
