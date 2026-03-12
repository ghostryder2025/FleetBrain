export interface Truck {
  id: string
  user_id: string
  name: string
  make: string
  model: string
  year: number
  vin?: string
  mpg: number
  maintenance_cost_per_mile: number
  status: 'available' | 'on_load' | 'maintenance'
  notes?: string
  created_at: string
}

export interface Load {
  id: string
  user_id: string
  truck_id?: string
  truck?: Truck
  origin?: string
  destination?: string
  pickup_date?: string
  delivery_date?: string
  commodity?: string
  revenue: number
  loaded_miles: number
  deadhead_miles: number
  fuel_price?: number
  fuel_cost?: number
  toll_cost?: number
  driver_pay?: number
  maintenance_allocation?: number
  net_profit?: number
  profit_per_mile?: number
  ai_rating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'
  ai_recommendation?: string
  ai_analysis?: AIAnalysis
  screenshot_url?: string
  status: 'analyzed' | 'accepted' | 'rejected' | 'completed'
  created_at: string
}

export interface AIAnalysis {
  extraction: {
    origin: string
    destination: string
    revenue: number
    loaded_miles: number
    deadhead_miles: number
    commodity: string
    pickup_date?: string
    delivery_date?: string
    broker_name?: string
  }
  costs: {
    fuel_price_used: number
    fuel_cost: number
    maintenance_allocation: number
    driver_pay: number
    toll_estimate: number
    total_expenses: number
    net_profit: number
    profit_per_mile: number
    rate_per_mile: number
  }
  rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'
  recommendation: string
  flags: string[]
}

export interface TruckOption {
  make: string
  model: string
  mpg_min: number
  mpg_max: number
  mpg_avg: number
}

export interface FuelPrice {
  value: number
  period: string
  region: string
}
