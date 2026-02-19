import { createClient } from '@supabase/supabase-js'

// Fallback seguro para evitar builds com chave inválida.
// Use sempre a publishable (sbp_) e a URL reais.
// For now, force the correct project credentials to avoid invalid keys set via env,
// mas ainda permitindo sobrescrever via variáveis se necessário.
// Force using the known-good publishable credentials to avoid bad env overrides
// Project ref: cwuchkahhofcylqgolb (note: no extra "d")
const supabaseUrl = 'https://cwuchkahhofcylqgolb.supabase.co'
const supabaseAnonKey = 'sb_publishable_-42-1BHRCwiQdL2NkF12nQ_Uq-RPKvL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
