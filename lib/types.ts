export type Side = "pros" | "cons";

export interface TopicCard {
  id: string;
  title: string;
  description: string;
  category: string;
  weight: number;
  pros_label: string;
  cons_label: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
  last_chat_at: string | null;
  pros_count: number;
  cons_count: number;
  live_rooms: number;
}

export interface TopicStats {
  topic_id: string;
  trend: { date: string; count: number }[];
  keywords: { word: string; weight: number }[];
  relations: { name: string; type: string; weight: number }[];
  articles: { title: string; press: string; date: string; url: string }[];
  is_sample: boolean;
  updated_at: string;
}

export interface Room {
  id: string;
  topic_id: string;
  title: string;
  created_by: string | null;
  speak_seconds: number;
  rounds: number;
  status: "waiting" | "live" | "ended";
  first_side: Side | null;
  current_round: number;
  current_side: Side | null;
  speaker_id: string | null;
  turn_starts_at: string | null;
  turn_ends_at: string | null;
  paused_remaining: string | null;
  interrupter_id: string | null;
  interrupt_ends_at: string | null;
  wait_used: boolean;
  block_used: boolean;
  muted: boolean;
  started_at: string | null;
  created_at: string;
}

export interface Member {
  room_id: string;
  user_id: string;
  side: Side;
  is_leader: boolean;
  kicked: boolean;
  joined_at: string;
}

export interface Message {
  id: number;
  room_id: string;
  user_id: string | null;
  channel: "main" | "pros" | "cons" | "system";
  body: string;
  created_at: string;
}

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: "user" | "admin";
}
