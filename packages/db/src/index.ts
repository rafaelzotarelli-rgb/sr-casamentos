// Tipos do banco gerados por `pnpm db:types` (não edite database.types.ts à mão).
import type { Database } from './database.types';

export type { Database };

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Wedding = Tables<'weddings'>;
export type Agency = Tables<'agencies'>;
export type Profile = Tables<'profiles'>;

/** Retorno de `accept_invite`. */
export type AcceptInviteResult =
  | {
      ok: true;
      kind: Enums<'invite_kind'>;
      wedding_id: string | null;
      agency_id: string | null;
    }
  | { ok: false; error: string };
