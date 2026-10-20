import 'server-only';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@sr/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '../env';

/** Cliente Supabase no servidor, com a sessão do usuário vinda dos cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado de um Server Component: o proxy.ts já renova a sessão.
        }
      },
    },
  });
}

/** Usuário autenticado ou redireciona para o login, voltando para `next` depois. */
export async function requireUser(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}
