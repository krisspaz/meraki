export interface Event {
  id: number;
  name: string;
  organizer: string;
  description: string;
  banner_url?: string;
  logo_url?: string;
  start_date: string;
  start_time: string;
  end_time: string;
  location: string;
  contact_email: string;
  registration_deadline: string;
  max_participants: number;
  status: 'draft' | 'active' | 'closed' | 'finished';
}

export interface Workshop {
  id: number;
  name: string;
  description: string;
  image_url?: string;
  speaker_name: string;
  speaker_bio: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  room: string;
  capacity: number;
  confirmed_count: number;
  slots_available: number;
  status: 'available' | 'almost_full' | 'full' | 'closed_manually' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: number;
  code: string;
  token: string;
  invited_name?: string;
  email?: string;
  phone?: string;
  max_uses: number;
  used_count: number;
  expiration_date?: string;
  status: 'active' | 'used' | 'exhausted' | 'expired' | 'disabled';
}

export interface Registration {
  id: number;
  code: string;
  invitation_id: number;
  workshop_id: number;
  full_name: string;
  email: string;
  phone: string;
  institution?: string;
  age?: number;
  status: 'pending' | 'confirmed' | 'waiting' | 'cancelled' | 'rejected' | 'attended';
  terms_accepted: boolean;
  data_treatment_accepted: boolean;
  comments?: string;
  ip_address?: string;
  user_agent?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  workshop?: Workshop;
  invitation?: Invitation;
}

export interface DashboardStats {
  invitations: {
    total: number;
    used: number;
    available: number;
    expired: number;
  };
  participants: {
    confirmed: number;
    waiting: number;
    attended: number;
    total_active: number;
    general_slots_available: number;
    max_participants_limit: number;
  };
  workshops: {
    id: number;
    name: string;
    capacity: number;
    confirmed_count: number;
    slots_available: number;
    occupation_percentage: number;
    status: string;
  }[];
  recent_registrations: {
    id: number;
    code: string;
    full_name: string;
    email: string;
    status: string;
    created_at: string;
  }[];
}

export interface UserMeResponse {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}
