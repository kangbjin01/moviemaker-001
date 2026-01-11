export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string
          settings: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          project_type: string
          timezone: string
          start_date: string | null
          end_date: string | null
          settings: Json
          created_at: string
          updated_at: string
          created_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          project_type?: string
          timezone?: string
          start_date?: string | null
          end_date?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          project_type?: string
          timezone?: string
          start_date?: string | null
          end_date?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
      }
      shooting_days: {
        Row: {
          id: string
          project_id: string
          day_number: number | null
          shoot_date: string
          call_time: string | null
          shooting_time_start: string | null
          shooting_time_end: string | null
          base_location_id: string | null
          call_location_id: string | null
          weather: string | null
          sunrise: string | null
          sunset: string | null
          status: string
          version: number
          published_at: string | null
          published_by: string | null
          change_note: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          day_number?: number | null
          shoot_date: string
          call_time?: string | null
          shooting_time_start?: string | null
          shooting_time_end?: string | null
          base_location_id?: string | null
          call_location_id?: string | null
          weather?: string | null
          sunrise?: string | null
          sunset?: string | null
          status?: string
          version?: number
          published_at?: string | null
          published_by?: string | null
          change_note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          day_number?: number | null
          shoot_date?: string
          call_time?: string | null
          shooting_time_start?: string | null
          shooting_time_end?: string | null
          base_location_id?: string | null
          call_location_id?: string | null
          weather?: string | null
          sunrise?: string | null
          sunset?: string | null
          status?: string
          version?: number
          published_at?: string | null
          published_by?: string | null
          change_note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
          deleted_at?: string | null
        }
      }
      shot_plan_items: {
        Row: {
          id: string
          shooting_day_id: string
          sequence: number
          scene_number: string | null
          cut_number: string | null
          scene_time: string | null
          scene_location_type: string | null
          start_time: string | null
          end_time: string | null
          location_id: string | null
          location_override: string | null
          content: string
          cast_ids: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          shooting_day_id: string
          sequence: number
          scene_number?: string | null
          cut_number?: string | null
          scene_time?: string | null
          scene_location_type?: string | null
          start_time?: string | null
          end_time?: string | null
          location_id?: string | null
          location_override?: string | null
          content: string
          cast_ids?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          shooting_day_id?: string
          sequence?: number
          scene_number?: string | null
          cut_number?: string | null
          scene_time?: string | null
          scene_location_type?: string | null
          start_time?: string | null
          end_time?: string | null
          location_id?: string | null
          location_override?: string | null
          content?: string
          cast_ids?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      characters: {
        Row: {
          id: string
          project_id: string
          character_name: string
          actor_name: string | null
          actor_contact: string | null
          role_type: string
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          character_name: string
          actor_name?: string | null
          actor_contact?: string | null
          role_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          character_name?: string
          actor_name?: string | null
          actor_contact?: string | null
          role_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          project_id: string
          name: string
          address: string | null
          location_type: string | null
          contact_name: string | null
          contact_phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          address?: string | null
          location_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          address?: string | null
          location_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      scenes: {
        Row: {
          id: string
          project_id: string
          scene_number: string
          scene_name: string | null
          description: string | null
          location_id: string | null
          script_page_start: number | null
          script_page_end: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          scene_number: string
          scene_name?: string | null
          description?: string | null
          location_id?: string | null
          script_page_start?: number | null
          script_page_end?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          scene_number?: string
          scene_name?: string | null
          description?: string | null
          location_id?: string | null
          script_page_start?: number | null
          script_page_end?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
