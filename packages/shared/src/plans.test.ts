import { describe, expect, it } from 'vitest';
import {
  COUPLE_PLANS,
  PLANNER_PLANS,
  canCreateActiveEvent,
  coupleUpgradePriceCents,
  effectiveCouplePlan,
  fairUseExtraMonthlyCents,
} from './plans';

describe('planos dos noivos', () => {
  it('tem os preços do briefing', () => {
    expect(COUPLE_PLANS.couple_free.priceCents).toBe(0);
    expect(COUPLE_PLANS.couple_plus.priceCents).toBe(14_900);
    expect(COUPLE_PLANS.couple_premium.priceCents).toBe(29_900);
  });

  it('só o Premium tem WhatsApp, com 1.000 mensagens', () => {
    expect(COUPLE_PLANS.couple_free.whatsappRsvp).toBe(false);
    expect(COUPLE_PLANS.couple_plus.whatsappRsvp).toBe(false);
    expect(COUPLE_PLANS.couple_premium.whatsappRsvp).toBe(true);
    expect(COUPLE_PLANS.couple_premium.whatsappMessages).toBe(1_000);
  });

  it('Free não tem IA, agenda nem acesso da família', () => {
    const free = COUPLE_PLANS.couple_free;
    expect(free.aiAssistant || free.aiContractAnalysis || free.calendarSync || free.familyAccess).toBe(
      false,
    );
  });

  it('upgrade de Plus para Premium cobra a diferença', () => {
    expect(coupleUpgradePriceCents('couple_plus', 'couple_premium')).toBe(15_000);
    expect(coupleUpgradePriceCents('couple_free', 'couple_plus')).toBe(14_900);
    expect(coupleUpgradePriceCents('couple_premium', 'couple_plus')).toBe(0);
  });
});

describe('plano efetivo dos noivos com assessor', () => {
  it('sem assessor, vale o plano comprado', () => {
    expect(effectiveCouplePlan('couple_plus', null).code).toBe('couple_plus');
  });

  it('assessor Free não inclui nada', () => {
    expect(effectiveCouplePlan('couple_free', 'planner_free').code).toBe('couple_free');
  });

  it('assessor Essencial inclui Plus', () => {
    expect(effectiveCouplePlan('couple_free', 'planner_essencial').code).toBe('couple_plus');
  });

  it('assessor Profissional e Agência incluem Premium', () => {
    expect(effectiveCouplePlan('couple_free', 'planner_profissional').code).toBe('couple_premium');
    expect(effectiveCouplePlan('couple_plus', 'planner_agencia').code).toBe('couple_premium');
  });

  it('plano comprado maior que o incluído prevalece', () => {
    expect(effectiveCouplePlan('couple_premium', 'planner_essencial').code).toBe('couple_premium');
  });
});

describe('limite de eventos ativos dos assessores', () => {
  it('tem os limites do briefing', () => {
    expect(PLANNER_PLANS.planner_free.maxActiveEvents).toBe(5);
    expect(PLANNER_PLANS.planner_essencial.maxActiveEvents).toBe(30);
    expect(PLANNER_PLANS.planner_profissional.maxActiveEvents).toBe(40);
    expect(PLANNER_PLANS.planner_agencia.maxActiveEvents).toBeNull();
  });

  it('bloqueia a criação ao atingir o limite', () => {
    expect(canCreateActiveEvent('planner_free', 4)).toBe(true);
    expect(canCreateActiveEvent('planner_free', 5)).toBe(false);
    expect(canCreateActiveEvent('planner_profissional', 40)).toBe(false);
  });

  it('Agência nunca bloqueia', () => {
    expect(canCreateActiveEvent('planner_agencia', 10_000)).toBe(true);
  });

  it('uso justo da Agência: R$ 8 por evento acima de 80', () => {
    expect(fairUseExtraMonthlyCents('planner_agencia', 80)).toBe(0);
    expect(fairUseExtraMonthlyCents('planner_agencia', 85)).toBe(4_000);
    expect(fairUseExtraMonthlyCents('planner_profissional', 85)).toBe(0);
  });

  it('logins de equipe: 1, 1, 3, ilimitado', () => {
    expect(PLANNER_PLANS.planner_free.maxTeamLogins).toBe(1);
    expect(PLANNER_PLANS.planner_essencial.maxTeamLogins).toBe(1);
    expect(PLANNER_PLANS.planner_profissional.maxTeamLogins).toBe(3);
    expect(PLANNER_PLANS.planner_agencia.maxTeamLogins).toBeNull();
  });

  it('banco de fornecedores limitado a 20 só no Free', () => {
    expect(PLANNER_PLANS.planner_free.maxVendors).toBe(20);
    expect(PLANNER_PLANS.planner_essencial.maxVendors).toBeNull();
  });
});
