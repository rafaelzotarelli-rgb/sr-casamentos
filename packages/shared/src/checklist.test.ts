import { describe, expect, it } from 'vitest';
import { CHECKLIST_TEMPLATE, generateChecklist, isOverdue, phaseForDueDate } from './checklist';

const now = new Date('2026-10-21T15:00:00Z');

describe('checklist inicial', () => {
  it('cobre todas as fases do briefing', () => {
    const phases = new Set(CHECKLIST_TEMPLATE.map((t) => t.phase));
    expect([...phases]).toEqual(['12m', '9m', '6m', '3m', '1m', 'semana', 'dia']);
  });

  it('calcula os prazos pela data do casamento', () => {
    const tasks = generateChecklist('2028-06-10', now);
    const buffet = tasks.find((t) => t.title === 'Contratar o buffet');
    expect(buffet?.dueDate).toBe('2027-09-14'); // 270 dias antes
    expect(tasks.find((t) => t.phase === 'dia')?.dueDate).toBe('2028-06-10');
  });

  it('prazos que já passaram viram hoje (casamento próximo)', () => {
    const tasks = generateChecklist('2027-01-15', now);
    const local = tasks.find((t) => t.title === 'Reservar o local da cerimônia e da festa');
    expect(local?.dueDate).toBe('2026-10-21');
    expect(tasks.filter((t) => isOverdue(t.dueDate, false, now))).toEqual([]);
  });

  it('sem data definida, as tarefas ficam sem prazo', () => {
    expect(generateChecklist(null, now).every((t) => t.dueDate === null)).toBe(true);
  });

  it('identifica a fase pela distância até o casamento', () => {
    expect(phaseForDueDate('2027-01-01', '2028-06-10')).toBe('12m');
    expect(phaseForDueDate('2028-05-20', '2028-06-10')).toBe('1m');
    expect(phaseForDueDate('2028-06-05', '2028-06-10')).toBe('semana');
  });

  it('atrasada = prazo passado e não concluída', () => {
    expect(isOverdue('2026-10-20', false, now)).toBe(true);
    expect(isOverdue('2026-10-20', true, now)).toBe(false);
    expect(isOverdue('2026-10-21', false, now)).toBe(false);
    expect(isOverdue(null, false, now)).toBe(false);
  });
});
