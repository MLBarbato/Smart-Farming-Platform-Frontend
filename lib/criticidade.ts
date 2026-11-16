export type Criticidade = 'BAIXA' | 'MEDIA' | 'ALTA'

export const rotuloCriticidade: Record<Criticidade, string> = { BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta' }

/** Cor de um talhão/fazenda conforme a maior criticidade de alerta aberto (nula = sem alertas). */
export function corDaCriticidade(maior?: string | null): string {
  if (maior === 'ALTA') return '#dc2626'
  if (maior === 'MEDIA') return '#ea580c'
  if (maior === 'BAIXA') return '#ca8a04'
  return '#16a34a'
}

export function rotuloDaSituacao(maior?: string | null): string {
  if (maior === 'ALTA') return 'Crítico'
  if (maior === 'MEDIA' || maior === 'BAIXA') return 'Atenção'
  return 'Saudável'
}
