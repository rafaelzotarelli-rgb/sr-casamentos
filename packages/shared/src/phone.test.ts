import { describe, expect, it } from 'vitest';
import { formatPhone, normalizePhone, splitPhone, whatsappLink } from './phone';

describe('telefone com DDI', () => {
  it.each([
    ['(19) 99123-4567', '55', '5519991234567'],
    ['19991234567', '55', '5519991234567'],
    ['+55 19 99123-4567', '55', '5519991234567'],
    ['(11) 3456-7890', '55', '551134567890'],
    ['912 345 678', '351', '351912345678'],
    ['+351 912 345 678', '55', '351912345678'],
    ['(415) 555-2671', '1', '14155552671'],
    ['11 2345-6789', '54', '541123456789'],
  ])('normaliza %s (DDI %s)', (input, country, expected) => {
    expect(normalizePhone(input, country)).toBe(expected);
  });

  it.each([
    ['', '55'],
    ['123', '55'],
    ['(19) 89123-4567', '55'], // celular brasileiro sem o 9
    ['(01) 99123-4567', '55'], // DDD inexistente
    ['+55 19 99123', '55'],
    ['+1234567890123456', '1'], // mais de 15 dígitos
  ])('rejeita "%s" (DDI %s)', (input, country) => {
    expect(normalizePhone(input, country)).toBeNull();
  });

  it('formata para exibição sempre com DDI', () => {
    expect(formatPhone('5519991234567')).toBe('+55 (19) 99123-4567');
    expect(formatPhone('551134567890')).toBe('+55 (11) 3456-7890');
    expect(formatPhone('351912345678')).toBe('+351 912345678');
    expect(formatPhone('9715012345678')).toBe('+9715012345678');
  });

  it('separa DDI e número para edição', () => {
    expect(splitPhone('5519991234567')).toEqual({ countryCode: '55', number: '19991234567' });
    expect(splitPhone('351912345678')).toEqual({ countryCode: '351', number: '912345678' });
    expect(splitPhone('9715012345678')).toEqual({ countryCode: '', number: '+9715012345678' });
  });

  it('monta o link do WhatsApp com a mensagem codificada', () => {
    expect(whatsappLink('351912345678', 'Olá, tudo bem?')).toBe(
      'https://wa.me/351912345678?text=Ol%C3%A1%2C%20tudo%20bem%3F',
    );
  });
});
