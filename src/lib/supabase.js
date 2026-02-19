import { createClient } from '@supabase/supabase-js'

// Fallback seguro para evitar builds com chave inválida.
// Use sempre a publishable (sbp_) e a URL reais.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://cwuchkahhofcylqgolb.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_-42-1BHRCwiQdL2NkF12nQ_Uq-RPKvL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
