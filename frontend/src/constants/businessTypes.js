export const BUSINESS_TYPES = [
  {
    id: "cafe",
    label: "Cafe / Coffee Shop",
    value: "cafe",
    keywords: "cafe|coffee_shop|bakery|dessert_shop",
    osmQuery: '["amenity"~"cafe|bar|pub|ice_cream|fast_food|bakery"]',
    radius: 800
  },
  {
    id: "restaurant",
    label: "Restaurant / F&B",
    value: "restaurant",
    keywords: "restaurant|food_court|diner|bistro|meal_takeaway",
    osmQuery: '["amenity"~"restaurant|food_court"]',
    radius: 1000
  },
  {
    id: "retail",
    label: "Retail Store / Shop",
    value: "retail",
    keywords: "clothing_store|electronics_store|furniture_store|jewelry_store|shoe_store|shopping_mall|supermarket",
    osmQuery: '["shop"]',
    radius: 1000
  },
  {
    id: "convenience",
    label: "Convenience Store",
    value: "convenience_store",
    keywords: "convenience_store|supermarket|grocery_or_supermarket",
    osmQuery: '["shop"~"convenience|supermarket|general"]',
    radius: 500
  },
  {
    id: "service",
    label: "Service (Salon, Barber, etc)",
    value: "service",
    keywords: "hair_care|beauty_salon|laundry|spa",
    osmQuery: '["shop"~"hairdresser|laundry|beauty|massage"]',
    radius: 700
  },
  {
    id: "office",
    label: "Office / Co-working",
    value: "office",
    keywords: "point_of_interest|establishment", // General business
    osmQuery: '["office"]',
    radius: 1000
  },
  {
    id: "hotel",
    label: "Hotel / Lodging",
    value: "hotel",
    keywords: "lodging|hotel|guest_house",
    osmQuery: '["tourism"~"hotel|guest_house|hostel"]',
    radius: 3000
  },
  {
    id: "fitness",
    label: "Gym / Fitness Center",
    value: "gym",
    keywords: "gym|fitness_center|sports_club",
    osmQuery: '["leisure"~"fitness_centre|sports_centre"]',
    radius: 1200
  },
  {
    id: "medical",
    label: "Clinic / Pharmacy",
    value: "medical",
    keywords: "doctor|pharmacy|hospital|dentist",
    osmQuery: '["amenity"~"clinic|hospital|pharmacy|doctors|dentist"]',
    radius: 1200
  },
  {
    id: "automotive",
    label: "Automotive / Workshop",
    value: "automotive",
    keywords: "car_repair|motorcycle_repair|auto_repair|car_wash",
    osmQuery: '["shop"~"car_repair|motorcycle_repair|tyres|car_parts"]',
    radius: 1500
  },
  {
    id: "education",
    label: "Education / Course",
    value: "education",
    keywords: "school|primary_school|secondary_school|language_school",
    osmQuery: '["amenity"~"school|college|university|kindergarten|language_school"]',
    radius: 1000
  }
];
