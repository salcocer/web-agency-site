// Types for the Supabase schema in supabase/migrations.
// Written to match `supabase gen types typescript` output; regenerate with
// `npm run db:types` after changing the schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13"
  }
  public: {
    Tables: {
      charges: {
        Row: {
          amount: number
          checkout_session_id: string | null
          client_id: string
          created_at: string
          currency: string
          description: string
          id: string
          paid_at: string | null
          payment_intent_id: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["charge_status"]
        }
        Insert: {
          amount: number
          checkout_session_id?: string | null
          client_id: string
          created_at?: string
          currency?: string
          description: string
          id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
        }
        Update: {
          amount?: number
          checkout_session_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["charge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          business: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          need: string | null
        }
        Insert: {
          business?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          need?: string | null
        }
        Update: {
          business?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          need?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          launch_date: string | null
          name: string
          notes: string | null
          package: string | null
          site_url: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          launch_date?: string | null
          name: string
          notes?: string | null
          package?: string | null
          site_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          launch_date?: string | null
          name?: string
          notes?: string | null
          package?: string | null
          site_url?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          author_id: string | null
          created_at: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          cancel_at: string | null
          client_id: string
          created_at: string
          currency: string | null
          current_period_end: string | null
          id: string
          interval: string | null
          plan_name: string | null
          price_id: string | null
          project_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          cancel_at?: string | null
          client_id: string
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          id: string
          interval?: string | null
          plan_name?: string | null
          price_id?: string | null
          project_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          cancel_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          id?: string
          interval?: string | null
          plan_name?: string | null
          price_id?: string | null
          project_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      charge_status: "due" | "paid" | "void"
      project_status: "discovery" | "design" | "build" | "review" | "live" | "paused"
      request_status: "open" | "in_progress" | "done"
      user_role: "client" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
