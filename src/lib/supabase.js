import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Fallback / Hybrid Storage Service
const LOCAL_RSVP_KEY = 'babyshower_online_rsvps';
const LOCAL_BLESSINGS_KEY = 'babyshower_online_blessings';
const LOCAL_VOTES_KEY = 'babyshower_online_votes';

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

  // 2. Blessings
  async getBlessings() {
    if (supabase) {
      const { data, error } = await supabase.from('blessings').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    const defaultBlessings = [
      {
        id: '1',
        author: "Grandma & Grandpa",
        relation: "Family Elders",
        text: "Seemantham & Valaikappu Ashirwadamulu! May divine grace always protect Swathi, Prasanth, and our incoming little blessing.",
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        author: "Sundar & Meena Family",
        relation: "Family Friends",
        text: "இனிய வளைகாப்பு மற்றும் சீமந்த நல்வாழ்த்துகள்! Wishing Swathi a glowing pregnancy and safe delivery.",
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        author: "Kavitha & Srinivas",
        relation: "Cousins",
        text: "Hearty congratulations Swathi and Prasanth! Excited to welcome the tiny bundle of joy into our family!",
        created_at: new Date().toISOString()
      }
    ];
    const stored = JSON.parse(localStorage.getItem(LOCAL_BLESSINGS_KEY) || 'null');
    return stored || defaultBlessings;
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

  // 3. Votes
  async getVotes() {
    if (supabase) {
      const { data } = await supabase.from('votes').select('*');
      if (data && data.length > 0) {
        const girlCount = data.filter(v => v.choice === 'Girl').length;
        const boyCount = data.filter(v => v.choice === 'Boy').length;
        return { Girl: girlCount, Boy: boyCount };
      }
    }
    return JSON.parse(localStorage.getItem(LOCAL_VOTES_KEY) || '{"Girl": 14, "Boy": 11}');
  },

  async castVote(choice) {
    if (supabase) {
      await supabase.from('votes').insert([{ choice }]);
    }
    const votes = await this.getVotes();
    votes[choice] = (votes[choice] || 0) + 1;
    localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
    return votes;
  }
};
