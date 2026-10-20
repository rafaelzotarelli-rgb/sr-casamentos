'use client';

import { formatPhone, whatsappLink } from '@sr/shared';
import { useState } from 'react';

/**
 * Link de convite (exibido uma única vez: o banco guarda só o hash) com
 * copiar e enviar pelo WhatsApp. O WhatsApp abre no aparelho de quem clica
 * com a mensagem pronta — não usa a API paga.
 */
export function InviteLink({
  link,
  whatsappMessage,
  phone,
}: {
  link: string;
  whatsappMessage?: string;
  /** "55" + DDD + número. Sem ele, o WhatsApp pede para escolher o contato. */
  phone?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const message = whatsappMessage ?? link;
  const whatsappHref = phone
    ? whatsappLink(phone, message)
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="stack">
      <p className="code">{link}</p>
      <div className="row">
        <a className="button" href={whatsappHref} target="_blank" rel="noopener noreferrer">
          {phone ? `Enviar pelo WhatsApp para ${formatPhone(phone)}` : 'Enviar pelo WhatsApp'}
        </a>
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
      </div>
      <span className="muted">Vale por 7 dias e só pode ser usado uma vez.</span>
    </div>
  );
}
