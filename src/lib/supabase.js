import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Hybrid Storage Service
const LOCAL_RSVP_KEY = 'babyshower_online_rsvps';
const LOCAL_BLESSINGS_KEY = 'babyshower_online_blessings';

export const db = {
  // 1. RSVPs
  async getRsvps() {
    if (supabase) {
      const { data, error } = await supabase.from('rsvps').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(LOCAL_RSVP_KEY) || '[]');
  },

  async addRsvp(rsvpData) {
    const newEntry = {
      ...rsvpData,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('rsvps').insert([rsvpData]);
      if (error) console.error('Supabase RSVP error:', error);
    }

    const current = JSON.parse(localStorage.getItem(LOCAL_RSVP_KEY) || '[]');
    current.unshift(newEntry);
    localStorage.setItem(LOCAL_RSVP_KEY, JSON.stringify(current));
    return newEntry;
  },

  async deleteRsvp(id) {
    if (supabase) {
      const { error } = await supabase.from('rsvps').delete().eq('id', id);
      if (error) console.error('Supabase delete RSVP error:', error);
    }
    const current = JSON.parse(localStorage.getItem(LOCAL_RSVP_KEY) || '[]');
    const updated = current.filter(r => String(r.id) !== String(id));
    localStorage.setItem(LOCAL_RSVP_KEY, JSON.stringify(updated));
  },

  // 2. Blessings
  async getBlessings() {
    if (supabase) {
      const { data, error } = await supabase.from('blessings').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return JSON.parse(localStorage.getItem(LOCAL_BLESSINGS_KEY) || '[]');
  },

  async addBlessing(blessing) {
    const newEntry = {
      ...blessing,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error } = await supabase.from('blessings').insert([blessing]);
      if (error) console.error('Supabase blessing error:', error);
    }

    const current = await this.getBlessings();
    current.unshift(newEntry);
    localStorage.setItem(LOCAL_BLESSINGS_KEY, JSON.stringify(current));
    return newEntry;
  },

  async deleteBlessing(id) {
    if (supabase) {
      const { error } = await supabase.from('blessings').delete().eq('id', id);
      if (error) console.error('Supabase delete blessing error:', error);
    }
    const current = JSON.parse(localStorage.getItem(LOCAL_BLESSINGS_KEY) || '[]');
    const updated = current.filter(b => String(b.id) !== String(id));
    localStorage.setItem(LOCAL_BLESSINGS_KEY, JSON.stringify(updated));
  }
};
