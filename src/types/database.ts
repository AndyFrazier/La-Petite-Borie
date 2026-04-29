export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: string;
          location: string;
          bedrooms: number;
          bathrooms: number;
          area_sqm: number;
          land_area_sqm: number;
          year_built: number | null;
          features: string[];
          contact_email: string;
          contact_phone: string;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          description?: string;
          price?: string;
          location?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqm?: number;
          land_area_sqm?: number;
          year_built?: number | null;
          features?: string[];
          contact_email?: string;
          contact_phone?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: string;
          location?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqm?: number;
          land_area_sqm?: number;
          year_built?: number | null;
          features?: string[];
          contact_email?: string;
          contact_phone?: string;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          image_url: string;
          caption: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          image_url: string;
          caption?: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          image_url?: string;
          caption?: string;
          display_order?: number;
          created_at?: string;
        };
      };
    };
  };
};
