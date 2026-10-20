'use client';

import { useState } from 'react';

/** Mostra o link de convite (exibido uma única vez) com botão de copiar. */
export function InviteLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="stack">
      <p className="code">{link}</p>
      <div className="row">
        <button
          type="button"
          className="button secondary"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          }}
        >
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
        <span className="muted">Vale por 7 dias e só pode ser usado uma vez.</span>
      </div>
    </div>
  );
}
