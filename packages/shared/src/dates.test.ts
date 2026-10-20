import { describe, expect, it } from 'vitest';
import { daysUntil, isActiveEvent, maskBrDate, parseBrDate, todayInSaoPaulo } from './dates';

describe('datas digitadas no formato brasileiro', () => {
  it('converte DD/MM/AAAA para ISO', () => {
    expect(parseBrDate('15/05/2027')).toBe('2027-05-15');
  });

  it('rejeita datas inexistentes ou incompletas', () => {
    expect(parseBrDate('30/02/2027')).toBeNull();
    expect(parseBrDate('15/5/2027')).toBeNull();
    expect(parseBrDate('')).toBeNull();
  });

  it('aplica a máscara enquanto a pessoa digita', () => {
    expect(maskBrDate('15')).toBe('15');
    expect(maskBrDate('150')).toBe('15/0');
    expect(maskBrDate('15052027')).toBe('15/05/2027');
    expect(maskBrDate('15/05/2027999')).toBe('15/05/2027');
  });
});

describe('datas no fuso de São Paulo', () => {
  it('às 23h30 de São Paulo ainda é o mesmo dia (já é o dia seguinte em UTC)', () => {
    // 2026-10-20 23:30 em São Paulo (UTC-3) = 2026-10-21 02:30 UTC
    expect(todayInSaoPaulo(new Date('2026-10-21T02:30:00Z'))).toBe('2026-10-20');
  });

  it('casamento sem data conta como ativo', () => {
    expect(isActiveEvent(null)).toBe(true);
  });

  it('o dia do casamento ainda conta como ativo; o dia seguinte não', () => {
    const now = new Date('2026-10-20T15:00:00Z');
    expect(isActiveEvent('2026-10-20', now)).toBe(true);
    expect(isActiveEvent('2026-10-19', now)).toBe(false);
    expect(isActiveEvent('2027-05-01', now)).toBe(true);
  });

  it('conta os dias até o casamento', () => {
    const now = new Date('2026-10-20T15:00:00Z');
    expect(daysUntil('2026-10-30', now)).toBe(10);
    expect(daysUntil('2026-10-19', now)).toBe(-1);
  });
});
