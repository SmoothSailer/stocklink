// Auto-generated types placeholder — regenerate with: npx supabase gen types typescript
// This file provides the shape for the Supabase client.

export interface Database {
  public: {
    Tables: {
      wholesalers: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          phone?: string | null;
          created_at?: string;
        };
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
          is_trending?: boolean;
          is_flash_deal?: boolean;
          flash_deal_price?: number | null;
          flash_deal_expires_at?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      retailers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          location?: string | null;
          created_at?: string;
        };
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
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
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
      };
    };
  };
}

// Convenience type aliases
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
