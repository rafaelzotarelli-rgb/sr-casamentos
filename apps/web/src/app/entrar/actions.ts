'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { safeNext } from '@/lib/safe-next';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.email(),
  password: z.string().min(12).max(200),
  next: z.string().optional(),
});

export type PasswordState = { error: string | null };

/** Login por e-mail e senha: só contas demo/admin criadas pelo administrador (D08). */
export async function signInWithPassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'E-mail ou senha inválidos.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: 'E-mail ou senha inválidos.' };

  redirect(safeNext(parsed.data.next));
}
