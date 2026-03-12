// Common semi-truck makes, models, and typical MPG ranges
// Based on industry data for Class 7-8 commercial trucks

export interface TruckMakeModel {
  make: string
  models: {
    model: string
    mpg_min: number
    mpg_max: number
    mpg_avg: number
    notes?: string
  }[]
}

export const TRUCK_DATABASE: TruckMakeModel[] = [
  {
    make: 'Freightliner',
    models: [
      { model: 'Cascadia 116', mpg_min: 6.5, mpg_max: 8.0, mpg_avg: 7.0, notes: 'Most popular semi in North America' },
      { model: 'Cascadia 126', mpg_min: 6.5, mpg_max: 8.0, mpg_avg: 7.2 },
      { model: 'Coronado', mpg_min: 6.0, mpg_max: 7.0, mpg_avg: 6.5 },
      { model: 'Classic XL', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
    ],
  },
  {
    make: 'Kenworth',
    models: [
      { model: 'T680', mpg_min: 7.0, mpg_max: 8.5, mpg_avg: 7.5, notes: 'Excellent fuel efficiency' },
      { model: 'T660', mpg_min: 6.5, mpg_max: 7.5, mpg_avg: 7.0 },
      { model: 'W900', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
      { model: 'T800', mpg_min: 5.5, mpg_max: 7.0, mpg_avg: 6.2 },
    ],
  },
  {
    make: 'Peterbilt',
    models: [
      { model: '579', mpg_min: 7.0, mpg_max: 8.5, mpg_avg: 7.5 },
      { model: '389', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0, notes: 'Classic look, lower fuel economy' },
      { model: '386', mpg_min: 6.5, mpg_max: 7.5, mpg_avg: 7.0 },
      { model: '567', mpg_min: 5.5, mpg_max: 7.0, mpg_avg: 6.2 },
    ],
  },
  {
    make: 'Volvo',
    models: [
      { model: 'VNL 860', mpg_min: 7.0, mpg_max: 9.0, mpg_avg: 7.8, notes: 'Top fuel economy with I-Shift' },
      { model: 'VNL 760', mpg_min: 7.0, mpg_max: 8.5, mpg_avg: 7.6 },
      { model: 'VNL 660', mpg_min: 6.5, mpg_max: 8.0, mpg_avg: 7.2 },
      { model: 'VNL 430', mpg_min: 6.5, mpg_max: 7.5, mpg_avg: 7.0 },
    ],
  },
  {
    make: 'International',
    models: [
      { model: 'LT Series', mpg_min: 6.5, mpg_max: 8.0, mpg_avg: 7.0 },
      { model: 'ProStar', mpg_min: 6.0, mpg_max: 7.5, mpg_avg: 6.8 },
      { model: 'LoneStar', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
    ],
  },
  {
    make: 'Mack',
    models: [
      { model: 'Anthem', mpg_min: 6.5, mpg_max: 8.0, mpg_avg: 7.0 },
      { model: 'Pinnacle', mpg_min: 6.0, mpg_max: 7.5, mpg_avg: 6.8 },
      { model: 'Granite', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
    ],
  },
  {
    make: 'Western Star',
    models: [
      { model: '5700XE', mpg_min: 6.5, mpg_max: 7.5, mpg_avg: 7.0 },
      { model: '4900', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
      { model: '4700', mpg_min: 5.5, mpg_max: 6.5, mpg_avg: 6.0 },
    ],
  },
  {
    make: 'Ford',
    models: [
      { model: 'F-650', mpg_min: 10, mpg_max: 13, mpg_avg: 11, notes: 'Medium duty' },
      { model: 'F-750', mpg_min: 9, mpg_max: 12, mpg_avg: 10, notes: 'Medium duty' },
      { model: 'F-350 Super Duty', mpg_min: 15, mpg_max: 20, mpg_avg: 17, notes: 'Light duty diesel' },
    ],
  },
  {
    make: 'Ram',
    models: [
      { model: '3500 Dually', mpg_min: 14, mpg_max: 20, mpg_avg: 16, notes: 'Light duty diesel' },
      { model: '4500', mpg_min: 12, mpg_max: 16, mpg_avg: 14, notes: 'Medium duty' },
      { model: '5500', mpg_min: 10, mpg_max: 14, mpg_avg: 12, notes: 'Medium duty' },
    ],
  },
  {
    make: 'Isuzu',
    models: [
      { model: 'NPR', mpg_min: 12, mpg_max: 16, mpg_avg: 14, notes: 'Light/medium duty box truck' },
      { model: 'NRR', mpg_min: 10, mpg_max: 14, mpg_avg: 12, notes: 'Medium duty' },
      { model: 'FTR', mpg_min: 9, mpg_max: 12, mpg_avg: 10 },
    ],
  },
]

export function getMakes(): string[] {
  return TRUCK_DATABASE.map(t => t.make)
}

export function getModels(make: string) {
  const truck = TRUCK_DATABASE.find(t => t.make === make)
  return truck?.models || []
}

export function getMpg(make: string, model: string): number {
  const truck = TRUCK_DATABASE.find(t => t.make === make)
  const m = truck?.models.find(m => m.model === model)
  return m?.mpg_avg || 7.0
}
