// Supabase-js builds `.or()`/`.ilike()` filters via string interpolation (PostgREST filter
// syntax), not parameterized queries — a raw `,`, `(`, `)`, `%` or `*` in user input can break
// the filter or change its meaning. Strip them before interpolating into any `.or()` clause.
export function sanitizeOrTerm(input: string): string {
  return input.replace(/[,()%*]/g, '').trim();
}
