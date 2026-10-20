// Tradução dos códigos de erro das RPCs (docs/decisoes.md, D19) para o usuário.

export const ERROR_MESSAGES: Record<string, string> = {
  nao_autenticado: 'Sua sessão expirou. Entre novamente.',
  sem_permissao: 'Você não tem permissão para fazer isso.',
  limite_requisicoes: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.',
  limite_eventos_ativos:
    'Você atingiu o limite de eventos ativos do seu plano. Os casamentos existentes continuam disponíveis; para cadastrar novos, faça upgrade.',
  limite_equipe: 'Seu plano não permite mais logins de equipe.',
  casamento_completo: 'Este casamento já tem as duas contas de noivos.',
  convite_invalido: 'Este convite não é válido ou já foi usado.',
  convite_expirado: 'Este convite expirou. Peça um novo link.',
  ja_e_membro: 'Você já faz parte deste casamento ou equipe.',
  ja_tem_assessoria: 'Você já é dono de uma assessoria.',
  membro_nao_pertence_a_assessoria: 'Essa pessoa não faz parte da sua equipe.',
};

const FALLBACK = 'Algo deu errado. Tente novamente.';

/** Mensagem amigável para um erro do Supabase/PostgREST ou um código conhecido. */
export function errorMessage(error: unknown): string {
  const code =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';
  return ERROR_MESSAGES[code] ?? FALLBACK;
}
