import type { Category, Track, Series, SeasonSchedule } from './types'
import { season2VenueNames } from './season2-venues'

// ─── Tracks ──────────────────────────────────────────────────────────
// Representative selection of popular road tracks.
// track_id values are realistic but not guaranteed to match iRacing exactly.

const baseTracks: Track[] = [
  // Free tracks
  { track_id: 1, track_name: 'Centripetal Circuit', config_name: '', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 2, track_name: 'Summit Point Raceway', config_name: 'Full Course', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 3, track_name: 'Lime Rock Park', config_name: 'Full Course', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 4, track_name: 'Oulton Park', config_name: 'Fosters', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 5, track_name: 'Okayama International Circuit', config_name: 'Full Course', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 6, track_name: 'Tsukuba Circuit', config_name: '2000 Full', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 7, track_name: 'Brands Hatch Circuit', config_name: 'Indy', category: 'road', free_with_subscription: true, price: 0, sku: 0 },
  { track_id: 8, track_name: 'Laguna Seca', config_name: '', category: 'road', free_with_subscription: true, price: 0, sku: 0 },

  // Paid tracks
  { track_id: 100, track_name: 'Spa-Francorchamps', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 100 },
  { track_id: 101, track_name: 'Monza', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 101 },
  { track_id: 102, track_name: 'Suzuka International Racing Course', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 102 },
  { track_id: 103, track_name: 'Nürburgring', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 103 },
  { track_id: 104, track_name: 'Road Atlanta', config_name: 'Full Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 104 },
  { track_id: 105, track_name: 'Watkins Glen International', config_name: 'Boot', category: 'road', free_with_subscription: false, price: 14.95, sku: 105 },
  { track_id: 106, track_name: 'Road America', config_name: 'Full Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 106 },
  { track_id: 107, track_name: 'Silverstone Circuit', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 107 },
  { track_id: 108, track_name: 'Daytona International Speedway', config_name: 'Road Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 108 },
  { track_id: 109, track_name: 'Sebring International Raceway', config_name: 'Full Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 109 },
  { track_id: 110, track_name: 'Circuit de Barcelona-Catalunya', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 110 },
  { track_id: 111, track_name: 'Interlagos', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 111 },
  { track_id: 112, track_name: 'Imola', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 112 },
  { track_id: 113, track_name: 'Virginia International Raceway', config_name: 'Full Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 113 },
  { track_id: 114, track_name: 'Barber Motorsports Park', config_name: 'Full Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 114 },
  { track_id: 115, track_name: 'Red Bull Ring', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 115 },
  { track_id: 116, track_name: 'Zandvoort', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 116 },
  { track_id: 117, track_name: 'Hungaroring', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 117 },
  { track_id: 118, track_name: 'Charlotte Motor Speedway', config_name: 'Road Course', category: 'road', free_with_subscription: false, price: 14.95, sku: 118 },
  { track_id: 119, track_name: 'Mount Panorama Circuit', config_name: '', category: 'road', free_with_subscription: false, price: 14.95, sku: 119 },
  { track_id: 120, track_name: 'Sonoma Raceway', config_name: 'Cup', category: 'road', free_with_subscription: false, price: 14.95, sku: 120 },
  { track_id: 121, track_name: 'Snetterton Circuit', config_name: '300', category: 'road', free_with_subscription: false, price: 14.95, sku: 121 },
  { track_id: 122, track_name: 'Zolder', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 122 },
  { track_id: 123, track_name: 'Nogaro', config_name: 'Grand Prix', category: 'road', free_with_subscription: false, price: 14.95, sku: 123 },
]

function normalizeTrackName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace('[legacy]', '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferCategoryFromVenue(venueName: string): Category {
  const normalized = normalizeTrackName(venueName)

  if (
    normalized.includes('rallycross') ||
    normalized.includes('hell rx') ||
    normalized.includes('dirt road')
  ) {
    return 'dirt_road'
  }

  const dirtOvalKeywords = [
    'eldora',
    'knoxville',
    'lernerville',
    'fairbury',
    'cedar lake',
    'huset',
    'kokomo',
    'limaland',
    'lincoln speedway',
    'port royal',
    'volusia',
    'weedsport',
    'williams grove',
    'chili bowl',
    'the dirt track at charlotte',
    'lucas oil speedway - dirt oval',
  ]
  if (dirtOvalKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'dirt_oval'
  }

  if (
    normalized.includes('speedway') ||
    normalized.includes('superspeedway') ||
    normalized.includes('coliseum') ||
    normalized.includes('oval')
  ) {
    return 'oval'
  }

  return 'road'
}

const generatedSeason2VenueTracks: Track[] = (() => {
  const existingNames = new Set(baseTracks.map((track) => normalizeTrackName(track.track_name)))
  const generated: Track[] = []
  let nextId = 2000

  for (const venueName of season2VenueNames) {
    const cleanedName = venueName.replace('[Legacy] ', '').trim()
    const normalized = normalizeTrackName(cleanedName)
    if (!normalized || existingNames.has(normalized)) continue

    existingNames.add(normalized)
    generated.push({
      track_id: nextId,
      track_name: cleanedName,
      config_name: '',
      category: inferCategoryFromVenue(cleanedName),
      free_with_subscription: false,
      price: 14.95,
      sku: nextId,
    })
    nextId += 1
  }

  return generated
})()

export const tracks: Track[] = [...baseTracks, ...generatedSeason2VenueTracks]

// ─── Series ──────────────────────────────────────────────────────────

export const series: Series[] = [
  {
    series_id: 1,
    series_name: 'Global Mazda MX-5 Cup',
    category: 'road',
    license_group: 'rookie',
    car_class_ids: [1],
    fixed_setup: true,
  },
  {
    series_id: 2,
    series_name: 'Formula Vee',
    category: 'road',
    license_group: 'rookie',
    car_class_ids: [2],
    fixed_setup: true,
  },
  {
    series_id: 3,
    series_name: 'Production Car Sim-Lab Challenge',
    category: 'road',
    license_group: 'd',
    car_class_ids: [3],
    fixed_setup: false,
  },
  {
    series_id: 4,
    series_name: 'GT4 Falken Tyre Challenge',
    category: 'road',
    license_group: 'd',
    car_class_ids: [4],
    fixed_setup: false,
  },
  {
    series_id: 5,
    series_name: 'Ferrari GT3 Challenge',
    category: 'road',
    license_group: 'c',
    car_class_ids: [5],
    fixed_setup: true,
  },
  {
    series_id: 6,
    series_name: 'IMSA Michelin Pilot Challenge',
    category: 'road',
    license_group: 'c',
    car_class_ids: [4, 6],
    fixed_setup: false,
  },
  {
    series_id: 7,
    series_name: 'GT3 Fixed',
    category: 'road',
    license_group: 'b',
    car_class_ids: [5],
    fixed_setup: true,
  },
  {
    series_id: 8,
    series_name: 'European Sprint Series',
    category: 'road',
    license_group: 'b',
    car_class_ids: [5],
    fixed_setup: false,
  },
]

// ─── Season Schedules (2026 S1) ─────────────────────────────────────

export const schedules: SeasonSchedule[] = [
  {
    series_id: 1, // MX-5 Cup
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 108 }, // Daytona
      { week_num: 2, track_id: 118 }, // Charlotte
      { week_num: 3, track_id: 5 },   // Okayama (free)
      { week_num: 4, track_id: 7 },   // Brands Hatch (free)
      { week_num: 5, track_id: 113 }, // VIR
      { week_num: 6, track_id: 4 },   // Oulton Park (free)
      { week_num: 7, track_id: 120 }, // Sonoma
      { week_num: 8, track_id: 106 }, // Road America
      { week_num: 9, track_id: 3 },   // Lime Rock (free)
      { week_num: 10, track_id: 114 }, // Barber
      { week_num: 11, track_id: 8 },   // Laguna Seca (free)
      { week_num: 12, track_id: 104 }, // Road Atlanta
    ],
  },
  {
    series_id: 2, // Formula Vee
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 2 },   // Summit Point (free)
      { week_num: 2, track_id: 3 },   // Lime Rock (free)
      { week_num: 3, track_id: 113 }, // VIR
      { week_num: 4, track_id: 5 },   // Okayama (free)
      { week_num: 5, track_id: 6 },   // Tsukuba (free)
      { week_num: 6, track_id: 7 },   // Brands Hatch (free)
      { week_num: 7, track_id: 121 }, // Snetterton
      { week_num: 8, track_id: 4 },   // Oulton Park (free)
      { week_num: 9, track_id: 1 },   // Centripetal (free)
      { week_num: 10, track_id: 8 },  // Laguna Seca (free)
      { week_num: 11, track_id: 114 }, // Barber
      { week_num: 12, track_id: 104 }, // Road Atlanta
    ],
  },
  {
    series_id: 3, // Production Car
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 7 },   // Brands Hatch (free)
      { week_num: 2, track_id: 100 }, // Spa
      { week_num: 3, track_id: 112 }, // Imola
      { week_num: 4, track_id: 103 }, // Nürburgring
      { week_num: 5, track_id: 5 },   // Okayama (free)
      { week_num: 6, track_id: 107 }, // Silverstone
      { week_num: 7, track_id: 119 }, // Mount Panorama
      { week_num: 8, track_id: 116 }, // Zandvoort
      { week_num: 9, track_id: 115 }, // Red Bull Ring
      { week_num: 10, track_id: 117 }, // Hungaroring
      { week_num: 11, track_id: 101 }, // Monza
      { week_num: 12, track_id: 110 }, // Barcelona
    ],
  },
  {
    series_id: 4, // GT4
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 108 }, // Daytona
      { week_num: 2, track_id: 109 }, // Sebring
      { week_num: 3, track_id: 106 }, // Road America
      { week_num: 4, track_id: 105 }, // Watkins Glen
      { week_num: 5, track_id: 100 }, // Spa
      { week_num: 6, track_id: 3 },   // Lime Rock (free)
      { week_num: 7, track_id: 103 }, // Nürburgring
      { week_num: 8, track_id: 107 }, // Silverstone
      { week_num: 9, track_id: 101 }, // Monza
      { week_num: 10, track_id: 111 }, // Interlagos
      { week_num: 11, track_id: 102 }, // Suzuka
      { week_num: 12, track_id: 104 }, // Road Atlanta
    ],
  },
  {
    series_id: 5, // Ferrari GT3
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 101 }, // Monza
      { week_num: 2, track_id: 100 }, // Spa
      { week_num: 3, track_id: 107 }, // Silverstone
      { week_num: 4, track_id: 103 }, // Nürburgring
      { week_num: 5, track_id: 112 }, // Imola
      { week_num: 6, track_id: 102 }, // Suzuka
      { week_num: 7, track_id: 110 }, // Barcelona
      { week_num: 8, track_id: 115 }, // Red Bull Ring
      { week_num: 9, track_id: 119 }, // Mount Panorama
      { week_num: 10, track_id: 116 }, // Zandvoort
      { week_num: 11, track_id: 117 }, // Hungaroring
      { week_num: 12, track_id: 108 }, // Daytona
    ],
  },
  {
    series_id: 6, // IMSA Pilot
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 108 }, // Daytona
      { week_num: 2, track_id: 109 }, // Sebring
      { week_num: 3, track_id: 105 }, // Watkins Glen
      { week_num: 4, track_id: 104 }, // Road Atlanta
      { week_num: 5, track_id: 106 }, // Road America
      { week_num: 6, track_id: 3 },   // Lime Rock (free)
      { week_num: 7, track_id: 113 }, // VIR
      { week_num: 8, track_id: 114 }, // Barber
      { week_num: 9, track_id: 100 }, // Spa
      { week_num: 10, track_id: 101 }, // Monza
      { week_num: 11, track_id: 102 }, // Suzuka
      { week_num: 12, track_id: 119 }, // Mount Panorama
    ],
  },
  {
    series_id: 7, // GT3 Fixed
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 100 }, // Spa
      { week_num: 2, track_id: 101 }, // Monza
      { week_num: 3, track_id: 102 }, // Suzuka
      { week_num: 4, track_id: 108 }, // Daytona
      { week_num: 5, track_id: 103 }, // Nürburgring
      { week_num: 6, track_id: 105 }, // Watkins Glen
      { week_num: 7, track_id: 104 }, // Road Atlanta
      { week_num: 8, track_id: 119 }, // Mount Panorama
      { week_num: 9, track_id: 107 }, // Silverstone
      { week_num: 10, track_id: 111 }, // Interlagos
      { week_num: 11, track_id: 110 }, // Barcelona
      { week_num: 12, track_id: 112 }, // Imola
    ],
  },
  {
    series_id: 8, // European Sprint
    season_year: 2026,
    season_quarter: 1,
    weeks: [
      { week_num: 1, track_id: 107 }, // Silverstone
      { week_num: 2, track_id: 100 }, // Spa
      { week_num: 3, track_id: 103 }, // Nürburgring
      { week_num: 4, track_id: 112 }, // Imola
      { week_num: 5, track_id: 110 }, // Barcelona
      { week_num: 6, track_id: 115 }, // Red Bull Ring
      { week_num: 7, track_id: 116 }, // Zandvoort
      { week_num: 8, track_id: 117 }, // Hungaroring
      { week_num: 9, track_id: 122 }, // Zolder
      { week_num: 10, track_id: 123 }, // Nogaro
      { week_num: 11, track_id: 101 }, // Monza
      { week_num: 12, track_id: 102 }, // Suzuka
    ],
  },
]
