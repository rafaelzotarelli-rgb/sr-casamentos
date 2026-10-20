import type { Metadata } from 'next';
import { LegalMarkdown, readLegalDoc } from '@/lib/legal-doc';

export const metadata: Metadata = { title: 'Política de Privacidade' };

export default async function PrivacyPage() {
  return (
    <main className="page stack" style={{ maxWidth: 760 }}>
      <LegalMarkdown source={await readLegalDoc('privacidade')} />
    </main>
  );
}
