/**
 * SeuFluxo WhatsApp — Supabase Client (Frontend)
 * Usa config.js injetado em runtime para funcionar sem rebuild.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Tipo para o config injetado pelo entrypoint
declare global {
  interface Window {
    __CONFIG__?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      API_BASE_URL: string;
    };
  }
}

const DEFAULT_SUPABASE_URL = 'https://srv-api.transformafuturo.com.br';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const DEFAULT_API_BASE_URL = 'https://apifluxowhtasapp.transformafuturo.com.br';

function getConfig() {
  const cfg = typeof window !== 'undefined' ? window.__CONFIG__ : undefined;

  const isValid = (val?: string) => Boolean(val && !val.startsWith('__'));

  const supabaseUrl = isValid(cfg?.SUPABASE_URL)
    ? cfg!.SUPABASE_URL
    : (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);

  const supabaseAnonKey = isValid(cfg?.SUPABASE_ANON_KEY)
    ? cfg!.SUPABASE_ANON_KEY
    : (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY);

  const apiBaseUrl = isValid(cfg?.API_BASE_URL)
    ? cfg!.API_BASE_URL
    : (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);

  return { supabaseUrl, supabaseAnonKey, apiBaseUrl };
}

const { supabaseUrl, supabaseAnonKey, apiBaseUrl } = getConfig();

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    },
  },
});

export const API_BASE_URL = apiBaseUrl;
