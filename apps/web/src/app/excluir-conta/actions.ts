'use server';

import { errorMessage } from '@sr/shared';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type DeletionState = { error: string | null };

export async function requestDeletion(_prev: DeletionState): Promise<DeletionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('request_account_deletion');
  if (error) return { error: errorMessage(error) };
  revalidatePath('/excluir-conta');
  return { error: null };
}

export async function cancelDeletion(_prev: DeletionState): Promise<DeletionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_account_deletion');
  if (error) return { error: errorMessage(error) };
  revalidatePath('/excluir-conta');
  return { error: null };
}
