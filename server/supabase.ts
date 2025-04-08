import { createClient } from '@supabase/supabase-js';

// Supabase istemcisi oluştur
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Supabase veritabanına doğrudan sorgu yapmak için yardımcı fonksiyon
export async function querySupabase(query: string, params: any[] = []) {
  try {
    const { data, error } = await supabase.rpc('pgquery', { query, params });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Supabase sorgu hatası:', error);
    throw error;
  }
}