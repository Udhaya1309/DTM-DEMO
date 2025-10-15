import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  department: string;
  year: string;
  phone: string;
  role: string; 
  created_at: string;
  updated_at: string;
}

export interface Talent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  media_url: string;
  media_type: string;
  tags: string[];
  likes_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  is_liked?: boolean;
}

export interface CampusLocation {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  building_code: string;
  floor_number: string;
  is_frequently_used: boolean;
  created_at: string;
}

export interface CustomMarker {
  id: string;
  user_id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  icon: string;
  color: string;
  created_at: string;
}

export interface HostelService {
  id: string;
  user_id: string;
  service_type: string;
  description: string;
  room_number: string;
  hostel_block: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface MessMenu {
  id: string;
  day_of_week: string;
  meal_type: string;
  items: string[];
  is_special: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}
