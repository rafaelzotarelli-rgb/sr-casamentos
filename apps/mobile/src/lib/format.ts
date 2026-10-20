const shortDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC', // datas sem fuso (YYYY-MM-DD)
});

const longDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2027-01-10" → "10/01/2027". */
export function formatDate(iso: string): string {
  return shortDate.format(new Date(`${iso}T00:00:00Z`));
}

/** "2027-01-10" → "10 de janeiro de 2027". */
export function formatLongDate(iso: string): string {
  return longDate.format(new Date(`${iso}T00:00:00Z`));
}
