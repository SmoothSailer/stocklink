// Supabase Database types
// Regenerate with: npx supabase gen types typescript

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      manufacturers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          description: string | null;
          location: string | null;
          website: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          sales_rep_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          description?: string | null;
          location?: string | null;
          website?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          sales_rep_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          description?: string | null;
          location?: string | null;
          website?: string | null;
          contact_person?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          sales_rep_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manufacturers_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
        ];
      };
      product_units: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plural_name: string;
          abbreviation: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plural_name: string;
          abbreviation?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plural_name?: string;
          abbreviation?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      product_unit_options: {
        Row: {
          id: string;
          product_id: string;
          unit_slug: string;
          price: number;
          stock: number;
          min_order_qty: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          unit_slug: string;
          price: number;
          stock?: number;
          min_order_qty?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          unit_slug?: string;
          price?: number;
          stock?: number;
          min_order_qty?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_unit_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_reps: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          phone: string;
          whatsapp_phone: string;
          email: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          phone: string;
          whatsapp_phone: string;
          email?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string;
          whatsapp_phone?: string;
          email?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      wholesalers: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          phone: string | null;
          sales_rep_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          phone?: string | null;
          sales_rep_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          phone?: string | null;
          sales_rep_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wholesalers_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          price: number;
          unit: string;
          min_order_qty: number;
          stock: number;
          image_url: string | null;
          wholesaler_id: string | null;
          manufacturer_id: string | null;
          is_trending: boolean;
          is_flash_deal: boolean;
          flash_deal_price: number | null;
          flash_deal_expires_at: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          price: number;
          unit?: string;
          min_order_qty?: number;
          stock?: number;
          image_url?: string | null;
          wholesaler_id?: string | null;
          manufacturer_id?: string | null;
          is_trending?: boolean;
          is_flash_deal?: boolean;
          flash_deal_price?: number | null;
          flash_deal_expires_at?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          price?: number;
          unit?: string;
          min_order_qty?: number;
          stock?: number;
          image_url?: string | null;
          wholesaler_id?: string | null;
          manufacturer_id?: string | null;
          is_trending?: boolean;
          is_flash_deal?: boolean;
          flash_deal_price?: number | null;
          flash_deal_expires_at?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_wholesaler_id_fkey";
            columns: ["wholesaler_id"];
            isOneToOne: false;
            referencedRelation: "wholesalers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey";
            columns: ["manufacturer_id"];
            isOneToOne: false;
            referencedRelation: "manufacturers";
            referencedColumns: ["id"];
          },
        ];
      };
      retailers: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          business_name: string | null;
          phone: string;
          email: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          business_name?: string | null;
          phone: string;
          email?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          business_name?: string | null;
          phone?: string;
          email?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          retailer_id: string | null;
          status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          total: number;
          delivery_address: string;
          payment_method: "mpesa" | "cash" | "card";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          retailer_id?: string | null;
          status?: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          total: number;
          delivery_address: string;
          payment_method?: "mpesa" | "cash" | "card";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          retailer_id?: string | null;
          status?: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          total?: number;
          delivery_address?: string;
          payment_method?: "mpesa" | "cash" | "card";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_retailer_id_fkey";
            columns: ["retailer_id"];
            isOneToOne: false;
            referencedRelation: "retailers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          unit: string | null;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          unit?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      demand_requests: {
        Row: {
          id: string;
          retailer_id: string | null;
          product_name: string;
          category: string | null;
          quantity: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          retailer_id?: string | null;
          product_name: string;
          category?: string | null;
          quantity?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          retailer_id?: string | null;
          product_name?: string;
          category?: string | null;
          quantity?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliates: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          name: string;
          email: string;
          commission_rate: number;
          total_earnings: number;
          total_paid: number;
          total_clicks: number;
          total_referrals: number;
          status: "active" | "inactive" | "pending";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          name: string;
          email: string;
          commission_rate?: number;
          total_earnings?: number;
          total_paid?: number;
          total_clicks?: number;
          total_referrals?: number;
          status?: "active" | "inactive" | "pending";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          name?: string;
          email?: string;
          commission_rate?: number;
          total_earnings?: number;
          total_paid?: number;
          total_clicks?: number;
          total_referrals?: number;
          status?: "active" | "inactive" | "pending";
          created_at?: string;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          affiliate_id: string;
          order_id: string | null;
          referred_user_id: string | null;
          order_total: number;
          commission: number;
          status: "pending" | "approved" | "paid" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_id: string;
          order_id?: string | null;
          referred_user_id?: string | null;
          order_total: number;
          commission: number;
          status?: "pending" | "approved" | "paid" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          affiliate_id?: string;
          order_id?: string | null;
          referred_user_id?: string | null;
          order_total?: number;
          commission?: number;
          status?: "pending" | "approved" | "paid" | "rejected";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliates";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Manufacturer = Database["public"]["Tables"]["manufacturers"]["Row"];
export type ProductUnit = Database["public"]["Tables"]["product_units"]["Row"];
export type ProductUnitOption = Database["public"]["Tables"]["product_unit_options"]["Row"];
export type SalesRep = Database["public"]["Tables"]["sales_reps"]["Row"];
export type Wholesaler = Database["public"]["Tables"]["wholesalers"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Retailer = Database["public"]["Tables"]["retailers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type DemandRequest = Database["public"]["Tables"]["demand_requests"]["Row"];
export type Affiliate = Database["public"]["Tables"]["affiliates"]["Row"];
export type Referral = Database["public"]["Tables"]["referrals"]["Row"];

export type OrderStatus = Order["status"];
export type PaymentMethod = Order["payment_method"];
export type AffiliateStatus = Affiliate["status"];
export type ReferralStatus = Referral["status"];
