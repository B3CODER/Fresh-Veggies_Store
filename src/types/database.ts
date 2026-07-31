export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      settings: {
        Row: Settings;
        Insert: Partial<Settings>;
        Update: Partial<Settings>;
      };
      vegetables: {
        Row: Vegetable;
        Insert: Omit<Vegetable, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vegetable, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id' | 'created_at'>;
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  role: 'admin' | 'customer';
  full_name: string;
  phone: string;
  created_at: string;
}

export interface Settings {
  id: string;
  store_name: string;
  store_address: string;
  phone_number: string;
  whatsapp_number: string;
  delivery_radius_km: number;
  latitude: number | null;
  longitude: number | null;
  opening_time: string;
  closing_time: string;
  banner_url: string;
  created_at: string;
  updated_at: string;
}

export interface Vegetable {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity_available: number | null;
  is_available: boolean;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  latitude: number | null;
  longitude: number | null;
  total_amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  vegetable_id: string | null;
  vegetable_name: string;
  vegetable_unit: string;
  price_at_order: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface CartItem {
  vegetable: Vegetable;
  quantity: number;
}
