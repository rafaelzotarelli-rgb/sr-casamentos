'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env } from '@/lib/env';
import { safeNext } from '@/lib/safe-next';
import { createClient } from '@/lib/supabase/server';

export type EmailState = { error: string | null; email?: string; sent?: boolean };

const emailSchema = z.email().max(254).toLowerCase();

/**
 * Envia código + link de confirmação (D25). Na primeira vez cria a conta,
 * que só fica utilizável depois de confirmar o e-mail.
 */
export async function sendEmailCode(_prev: EmailState, formData: FormData): Promise<EmailState> {
  const email = emailSchema.safeParse(String(formData.get('email') ?? '').trim());
  if (!email.success) return { error: 'Digite um e-mail válido.' };
  const next = safeNext(String(formData.get('next') ?? ''));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return {
      error:
        error.status === 429
          ? 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente de novo.'
          : 'Não foi possível enviar o código. Tente novamente.',
      email: email.data,
    };
  }
  return { error: null, email: email.data, sent: true };
}

export async function verifyEmailCode(_prev: EmailState, formData: FormData): Promise<EmailState> {
  const email = emailSchema.safeParse(String(formData.get('email') ?? ''));
  const token = String(formData.get('code') ?? '').replace(/\D/g, '');
  if (!email.success) return { error: 'Digite um e-mail válido.' };
  if (token.length !== 6)
    return { error: 'O código tem 6 dígitos.', email: email.data, sent: true };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token, type: 'email' });
  if (error) {
    return { error: 'Código inválido ou expirado.', email: email.data, sent: true };
  }
  redirect(safeNext(String(formData.get('next') ?? '')));
}
