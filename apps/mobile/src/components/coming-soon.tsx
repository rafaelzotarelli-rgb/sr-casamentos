import { Body, Card, Screen, Title } from './ui';

/** Abas cujo conteúdo chega nas próximas etapas (briefing, seção 13). */
export function ComingSoon({ title, items }: { title: string; items: string[] }) {
  return (
    <Screen>
      <Title>{title}</Title>
      <Card>
        <Body muted>Em breve por aqui:</Body>
        {items.map((item) => (
          <Body key={item}>• {item}</Body>
        ))}
      </Card>
    </Screen>
  );
}
