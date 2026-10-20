const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC', // a data do casamento não tem fuso (YYYY-MM-DD)
});

export function formatWeddingDate(date: string | null): string {
  return date ? dateFormat.format(new Date(`${date}T00:00:00Z`)) : 'Data a definir';
}
