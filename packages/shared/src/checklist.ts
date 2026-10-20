// Checklist inicial por fase antes do casamento (briefing, 2.3).
import { todayInSaoPaulo } from './dates';

export const TASK_CATEGORIES = [
  'geral',
  'orcamento',
  'convidados',
  'local',
  'buffet',
  'bebidas',
  'decoracao',
  'foto_video',
  'musica',
  'vestido_traje',
  'convites',
  'lembrancinhas',
  'lua_de_mel',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  geral: 'Geral',
  orcamento: 'Orçamento',
  convidados: 'Convidados',
  local: 'Local',
  buffet: 'Buffet',
  bebidas: 'Bebidas',
  decoracao: 'Decoração',
  foto_video: 'Foto e vídeo',
  musica: 'Música',
  vestido_traje: 'Vestido e traje',
  convites: 'Convites',
  lembrancinhas: 'Lembrancinhas',
  lua_de_mel: 'Lua de mel',
};

export const TASK_PHASES = [
  { key: '12m', label: '12 meses ou mais antes', daysBefore: 365 },
  { key: '9m', label: '9 meses antes', daysBefore: 270 },
  { key: '6m', label: '6 meses antes', daysBefore: 180 },
  { key: '3m', label: '3 meses antes', daysBefore: 90 },
  { key: '1m', label: '1 mês antes', daysBefore: 30 },
  { key: 'semana', label: 'Última semana', daysBefore: 7 },
  { key: 'dia', label: 'Dia do casamento', daysBefore: 0 },
] as const;
export type TaskPhase = (typeof TASK_PHASES)[number]['key'];

export const TASK_ASSIGNEES = ['both', 'partner1', 'partner2', 'family', 'planner'] as const;
export type TaskAssignee = (typeof TASK_ASSIGNEES)[number];

const T = (phase: TaskPhase, category: TaskCategory, title: string) => ({ phase, category, title });

export const CHECKLIST_TEMPLATE = [
  T('12m', 'orcamento', 'Definir o orçamento total'),
  T('12m', 'geral', 'Escolher a data e o estilo do casamento'),
  T('12m', 'convidados', 'Fazer a primeira lista de convidados'),
  T('12m', 'local', 'Pesquisar e visitar locais'),
  T('12m', 'local', 'Reservar o local da cerimônia e da festa'),
  T('12m', 'geral', 'Decidir se vão contratar assessoria'),
  T('9m', 'buffet', 'Contratar o buffet'),
  T('9m', 'foto_video', 'Contratar fotografia e vídeo'),
  T('9m', 'musica', 'Contratar banda ou DJ'),
  T('9m', 'geral', 'Escolher o celebrante'),
  T('9m', 'vestido_traje', 'Começar a procurar vestido e traje'),
  T('9m', 'geral', 'Criar o site do casamento'),
  T('6m', 'decoracao', 'Contratar decoração e flores'),
  T('6m', 'convites', 'Enviar o "save the date"'),
  T('6m', 'convidados', 'Convidar os padrinhos'),
  T('6m', 'bebidas', 'Contratar bebidas e bar'),
  T('6m', 'lua_de_mel', 'Planejar a lua de mel'),
  T('6m', 'geral', 'Montar a lista de presentes'),
  T('3m', 'convites', 'Enviar os convites'),
  T('3m', 'buffet', 'Fazer a degustação do buffet'),
  T('3m', 'vestido_traje', 'Escolher as alianças'),
  T('3m', 'lembrancinhas', 'Encomendar as lembrancinhas'),
  T('3m', 'geral', 'Contratar transporte dos noivos'),
  T('3m', 'vestido_traje', 'Agendar as provas de vestido e traje'),
  T('1m', 'convidados', 'Cobrar as confirmações de presença'),
  T('1m', 'buffet', 'Enviar o número final de convidados ao buffet'),
  T('1m', 'convidados', 'Montar o mapa de mesas'),
  T('1m', 'geral', 'Fechar o cronograma do dia com os fornecedores'),
  T('1m', 'vestido_traje', 'Fazer a prova final do vestido e traje'),
  T('1m', 'orcamento', 'Organizar os pagamentos finais'),
  T('semana', 'geral', 'Confirmar horários com todos os fornecedores'),
  T('semana', 'geral', 'Separar documentos e alianças'),
  T('semana', 'convidados', 'Entregar a lista de convidados à recepção'),
  T('semana', 'orcamento', 'Preparar os pagamentos do dia'),
  T('dia', 'geral', 'Entregar as alianças a quem vai levá-las'),
  T('dia', 'geral', 'Aproveitar o casamento!'),
] as const;

export interface GeneratedTask {
  title: string;
  category: TaskCategory;
  phase: TaskPhase;
  dueDate: string | null;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Checklist com prazos calculados pela data do casamento. Sem data, sem prazos
 * (as tarefas ficam agrupadas por fase). Prazos que já passaram viram "hoje",
 * para o casal não começar com dezenas de tarefas atrasadas.
 */
export function generateChecklist(weddingDate: string | null, now = new Date()): GeneratedTask[] {
  const today = todayInSaoPaulo(now);
  return CHECKLIST_TEMPLATE.map(({ phase, category, title }) => {
    if (!weddingDate) return { title, category, phase, dueDate: null };
    const daysBefore = TASK_PHASES.find((p) => p.key === phase)?.daysBefore ?? 0;
    const due = addDays(weddingDate, -daysBefore);
    return { title, category, phase, dueDate: due < today && phase !== 'dia' ? today : due };
  });
}

/**
 * Fase em que uma tarefa cai, pela distância até o casamento. Cada fase vai do
 * seu marco até o marco seguinte (ex.: "1 mês antes" = de 30 a 8 dias antes).
 */
export function phaseForDueDate(dueDate: string, weddingDate: string): TaskPhase {
  const days = Math.round(
    (Date.parse(`${weddingDate}T00:00:00Z`) - Date.parse(`${dueDate}T00:00:00Z`)) / 86_400_000,
  );
  const reached = TASK_PHASES.filter((p) => p.daysBefore >= days);
  return reached.at(-1)?.key ?? '12m';
}

/** Atrasada = prazo antes de hoje (São Paulo) e não concluída. */
export function isOverdue(dueDate: string | null, done: boolean, now = new Date()): boolean {
  return !done && dueDate !== null && dueDate < todayInSaoPaulo(now);
}
