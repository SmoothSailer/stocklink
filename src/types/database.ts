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
          pieces_per_unit: number | null;
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
          pieces_per_unit?: number | null;
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
          pieces_per_unit?: number | null;
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
          pieces_per_unit: number | null;
          image_url: string | null;
          wholesaler_id: string | null;
          manufacturer_id: string | null;
          is_trending: boolean;
          is_flash_deal: boolean;
          flash_deal_price: number | null;
          flash_deal_expires_at: string | null;
          location: string | null;
          is_coming_soon: boolean;
          expected_arrival_date: string | null;
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
          pieces_per_unit?: number | null;
          image_url?: string | null;
          wholesaler_id?: string | null;
          manufacturer_id?: string | null;
          is_trending?: boolean;
          is_flash_deal?: boolean;
          flash_deal_price?: number | null;
          flash_deal_expires_at?: string | null;
          location?: string | null;
          is_coming_soon?: boolean;
          expected_arrival_date?: string | null;
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
          pieces_per_unit?: number | null;
          image_url?: string | null;
          wholesaler_id?: string | null;
          manufacturer_id?: string | null;
          is_trending?: boolean;
          is_flash_deal?: boolean;
          flash_deal_price?: number | null;
          flash_deal_expires_at?: string | null;
          location?: string | null;
          is_coming_soon?: boolean;
          expected_arrival_date?: string | null;
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
          sales_rep_id: string | null;
          id_number: string | null;
          business_reg_number: string | null;
          verification_status: "unverified" | "pending" | "verified" | "rejected";
          verified_at: string | null;
          verified_by: string | null;
          credit_limit: number;
          bnpl_enabled: boolean;
          verification_notes: string | null;
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
          sales_rep_id?: string | null;
          id_number?: string | null;
          business_reg_number?: string | null;
          verification_status?: "unverified" | "pending" | "verified" | "rejected";
          verified_at?: string | null;
          verified_by?: string | null;
          credit_limit?: number;
          bnpl_enabled?: boolean;
          verification_notes?: string | null;
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
          sales_rep_id?: string | null;
          id_number?: string | null;
          business_reg_number?: string | null;
          verification_status?: "unverified" | "pending" | "verified" | "rejected";
          verified_at?: string | null;
          verified_by?: string | null;
          credit_limit?: number;
          bnpl_enabled?: boolean;
          verification_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "retailers_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          retailer_id: string | null;
          status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          total: number;
          delivery_address: string;
          payment_method: "mpesa" | "cash" | "card" | "bnpl";
          payment_status: "pending" | "partial" | "paid" | "failed";
          amount_paid: number;
          paid_at: string | null;
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
          payment_method?: "mpesa" | "cash" | "card" | "bnpl";
          payment_status?: "pending" | "partial" | "paid" | "failed";
          amount_paid?: number;
          paid_at?: string | null;
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
          payment_method?: "mpesa" | "cash" | "card" | "bnpl";
          payment_status?: "pending" | "partial" | "paid" | "failed";
          amount_paid?: number;
          paid_at?: string | null;
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
      product_media: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          type: "image" | "video";
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          type?: "image" | "video";
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          type?: "image" | "video";
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          changed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: "placed" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
          changed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_records: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          method: "mpesa" | "cash" | "card";
          reference: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          method?: "mpesa" | "cash" | "card";
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          method?: "mpesa" | "cash" | "card";
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_records_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      bnpl_plans: {
        Row: {
          id: string;
          order_id: string;
          cost_price: number;
          markup_amount: number;
          total_with_markup: number;
          num_installments: number;
          installment_amount: number;
          down_payment_rate: number;
          down_payment: number;
          down_payment_paid_at: string | null;
          status: "pending" | "active" | "completed" | "defaulted";
          approved_at: string | null;
          approved_by: string | null;
          agreed_at: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          cost_price: number;
          markup_amount: number;
          total_with_markup: number;
          num_installments: number;
          installment_amount: number;
          down_payment_rate?: number;
          down_payment: number;
          down_payment_paid_at?: string | null;
          status?: "pending" | "active" | "completed" | "defaulted";
          approved_at?: string | null;
          approved_by?: string | null;
          agreed_at?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          cost_price?: number;
          markup_amount?: number;
          total_with_markup?: number;
          num_installments?: number;
          installment_amount?: number;
          down_payment_rate?: number;
          down_payment?: number;
          down_payment_paid_at?: string | null;
          status?: "pending" | "active" | "completed" | "defaulted";
          approved_at?: string | null;
          approved_by?: string | null;
          agreed_at?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bnpl_plans_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      bnpl_installments: {
        Row: {
          id: string;
          plan_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status: "upcoming" | "due" | "paid" | "overdue";
          paid_at: string | null;
          payment_record_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          installment_number: number;
          amount: number;
          due_date: string;
          status?: "upcoming" | "due" | "paid" | "overdue";
          paid_at?: string | null;
          payment_record_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          installment_number?: number;
          amount?: number;
          due_date?: string;
          status?: "upcoming" | "due" | "paid" | "overdue";
          paid_at?: string | null;
          payment_record_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bnpl_installments_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "bnpl_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      product_waitlist: {
        Row: {
          id: string;
          product_id: string;
          retailer_id: string;
          quantity_interested: number;
          notes: string | null;
          notified: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          retailer_id: string;
          quantity_interested?: number;
          notes?: string | null;
          notified?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          retailer_id?: string;
          quantity_interested?: number;
          notes?: string | null;
          notified?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_waitlist_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_waitlist_retailer_id_fkey";
            columns: ["retailer_id"];
      leads: {
        Row: {
          id: string;
          sales_rep_id: string;
          name: string;
          business_name: string | null;
          phone: string;
          location: string | null;
          notes: string | null;
          status: "new" | "contacted" | "interested" | "converted" | "lost";
          source: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id: string | null;
          follow_up_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          name: string;
          business_name?: string | null;
          phone: string;
          location?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "interested" | "converted" | "lost";
          source?: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          name?: string;
          business_name?: string | null;
          phone?: string;
          location?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "interested" | "converted" | "lost";
          source?: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_converted_retailer_id_fkey";
            columns: ["converted_retailer_id"];
            isOneToOne: false;
            referencedRelation: "retailers";
            referencedColumns: ["id"];
          },
        ];
      };
      rep_activities: {
        Row: {
          id: string;
          sales_rep_id: string;
          retailer_id: string | null;
          lead_id: string | null;
          type: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes: string | null;
          outcome: string | null;
      product_waitlist: {
        Row: {
          id: string;
          product_id: string;
          retailer_id: string;
          quantity_interested: number;
          notes: string | null;
          notified: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          retailer_id?: string | null;
          lead_id?: string | null;
          type: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes?: string | null;
          outcome?: string | null;
          product_id: string;
          retailer_id: string;
          quantity_interested?: number;
          notes?: string | null;
          notified?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          retailer_id?: string | null;
          lead_id?: string | null;
          type?: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes?: string | null;
          outcome?: string | null;
          product_id?: string;
          retailer_id?: string;
          quantity_interested?: number;
          notes?: string | null;
          notified?: boolean;
          notified_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rep_activities_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rep_activities_retailer_id_fkey";
            foreignKeyName: "product_waitlist_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_waitlist_retailer_id_fkey";
            columns: ["retailer_id"];
            isOneToOne: false;
            referencedRelation: "retailers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rep_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          sales_rep_id: string;
          name: string;
          business_name: string | null;
          phone: string;
          location: string | null;
          notes: string | null;
          status: "new" | "contacted" | "interested" | "converted" | "lost";
          source: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id: string | null;
          follow_up_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          name: string;
          business_name?: string | null;
          phone: string;
          location?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "interested" | "converted" | "lost";
          source?: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          name?: string;
          business_name?: string | null;
          phone?: string;
          location?: string | null;
          notes?: string | null;
          status?: "new" | "contacted" | "interested" | "converted" | "lost";
          source?: "field_visit" | "referral" | "whatsapp" | "walk_in" | "other";
          converted_retailer_id?: string | null;
          follow_up_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_converted_retailer_id_fkey";
            columns: ["converted_retailer_id"];
            isOneToOne: false;
            referencedRelation: "retailers";
            referencedColumns: ["id"];
          },
        ];
      };
      rep_activities: {
        Row: {
          id: string;
          sales_rep_id: string;
          retailer_id: string | null;
          lead_id: string | null;
          type: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes: string | null;
          outcome: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_rep_id: string;
          retailer_id?: string | null;
          lead_id?: string | null;
          type: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sales_rep_id?: string;
          retailer_id?: string | null;
          lead_id?: string | null;
          type?: "visit" | "call" | "whatsapp" | "order_follow_up" | "payment_collection" | "onboarding" | "note";
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rep_activities_sales_rep_id_fkey";
            columns: ["sales_rep_id"];
            isOneToOne: false;
            referencedRelation: "sales_reps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rep_activities_retailer_id_fkey";
            columns: ["retailer_id"];
            isOneToOne: false;
            referencedRelation: "retailers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rep_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_retailer_bnpl_exposure: {
        Args: { p_retailer_id: string };
        Returns: number;
      };
      advance_installment_statuses: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_restock_alerts: {
        Args: { p_sales_rep_id: string };
        Returns: {
          retailer_id: string;
          retailer_name: string;
          retailer_phone: string;
          retailer_location: string | null;
          product_id: string;
          product_name: string;
          avg_interval_days: number;
          days_since_last: number;
          urgency: number;
        }[];
      };
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
export type ProductMedia = Database["public"]["Tables"]["product_media"]["Row"];
export type OrderStatusHistory = Database["public"]["Tables"]["order_status_history"]["Row"];
export type PaymentRecord = Database["public"]["Tables"]["payment_records"]["Row"];
export type BnplPlan = Database["public"]["Tables"]["bnpl_plans"]["Row"];
export type BnplInstallment = Database["public"]["Tables"]["bnpl_installments"]["Row"];
export type ProductWaitlist = Database["public"]["Tables"]["product_waitlist"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type RepActivity = Database["public"]["Tables"]["rep_activities"]["Row"];
export type ProductWaitlist = Database["public"]["Tables"]["product_waitlist"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type RepActivity = Database["public"]["Tables"]["rep_activities"]["Row"];

export type OrderStatus = Order["status"];
export type PaymentMethod = Order["payment_method"];
export type PaymentStatus = Order["payment_status"];
export type AffiliateStatus = Affiliate["status"];
export type ReferralStatus = Referral["status"];
export type LeadStatus = Lead["status"];
export type LeadSource = Lead["source"];
export type ActivityType = RepActivity["type"];
