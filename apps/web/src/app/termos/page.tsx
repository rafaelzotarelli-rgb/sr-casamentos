import type { Metadata } from 'next';
import { LegalMarkdown, readLegalDoc } from '@/lib/legal-doc';

export const metadata: Metadata = { title: 'Termos de Uso' };

export default async function TermsPage() {
  return (
    <main className="page stack" style={{ maxWidth: 760 }}>
      <LegalMarkdown source={await readLegalDoc('termos')} />
    </main>
  );
}
