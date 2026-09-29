// 20 distinct memory palace loci with 3D positions, unique geometries, room groupings, and verified zero-word overlap.

export interface LocusData {
  id: number; // 1 to 20
  name: string;
  room: 'Hallway' | 'Living Room' | 'Kitchen' | 'Study' | 'Bedroom' | 'Bathroom';
  position: [number, number, number];
  cameraPosition: [number, number, number];
  color: string;
  shape: 'box' | 'cylinder' | 'sphere' | 'furniture';
  dimensions: [number, number, number]; // width, height, depth or radius
}

/**
 * 20 LOCI DEFINITION:
 * Strictly verified to contain zero words from List A or List B.
 * Follows a single continuous walking circuit through 6 rooms.
 */
export const PALACE_LOCI: readonly LocusData[] = [
  // Room 1: Hallway (1-3)
  {
    id: 1,
    name: 'Front Door',
    room: 'Hallway',
    position: [0, 1.4, -13.6],
    cameraPosition: [0, 1.6, -11.5],
    color: '#854d0e', // Amber wood
    shape: 'box',
    dimensions: [1.2, 2.4, 0.15],
  },
  {
    id: 2,
    name: 'Shoe Rack',
    room: 'Hallway',
    position: [1.8, 0.4, -11.0],
    cameraPosition: [0.6, 1.6, -11.0],
    color: '#a16207', // Light wood
    shape: 'box',
    dimensions: [0.6, 0.8, 1.4],
  },
  {
    id: 3,
    name: 'Coat Hooks',
    room: 'Hallway',
    position: [-1.8, 1.5, -9.0],
    cameraPosition: [-0.6, 1.6, -9.0],
    color: '#475569', // Slate metal
    shape: 'cylinder',
    dimensions: [0.15, 1.6, 0.15],
  },

  // Room 2: Living Room (4-7)
  {
    id: 4,
    name: 'Blue Sofa',
    room: 'Living Room',
    position: [-5.0, 0.6, -6.0],
    cameraPosition: [-3.2, 1.6, -5.5],
    color: '#1d4ed8', // Vivid blue
    shape: 'box',
    dimensions: [2.2, 0.8, 1.0],
  },
  {
    id: 5,
    name: 'Coffee Table',
    room: 'Living Room',
    position: [-5.0, 0.35, -4.0],
    cameraPosition: [-3.4, 1.5, -3.5],
    color: '#b45309', // Warm oak
    shape: 'cylinder',
    dimensions: [0.7, 0.4, 0.7],
  },
  {
    id: 6,
    name: 'Television Set',
    room: 'Living Room',
    position: [-7.2, 1.3, -4.0],
    cameraPosition: [-5.4, 1.6, -4.0],
    color: '#0f172a', // Matte black
    shape: 'box',
    dimensions: [0.2, 1.0, 1.8],
  },
  {
    id: 7,
    name: 'Bookcase',
    room: 'Living Room',
    position: [-2.0, 1.4, -7.2],
    cameraPosition: [-2.5, 1.6, -5.4],
    color: '#7c2d12', // Mahogany
    shape: 'box',
    dimensions: [1.2, 2.2, 0.4],
  },

  // Room 3: Kitchen (8-11)
  {
    id: 8,
    name: 'Dining Bench',
    room: 'Kitchen',
    position: [3.5, 0.5, -6.0],
    cameraPosition: [2.0, 1.6, -5.5],
    color: '#d97706', // Honey wood
    shape: 'box',
    dimensions: [2.0, 0.6, 0.7],
  },
  {
    id: 9,
    name: 'Refrigerator',
    room: 'Kitchen',
    position: [7.2, 1.5, -7.0],
    cameraPosition: [5.2, 1.6, -6.5],
    color: '#cbd5e1', // Stainless steel silver
    shape: 'box',
    dimensions: [0.9, 2.4, 0.9],
  },
  {
    id: 10,
    name: 'Metal Sink',
    room: 'Kitchen',
    position: [7.2, 0.9, -4.0],
    cameraPosition: [5.2, 1.6, -4.0],
    color: '#64748b', // Steel grey
    shape: 'cylinder',
    dimensions: [0.6, 0.8, 0.6],
  },
  {
    id: 11,
    name: 'Cooking Stove',
    room: 'Kitchen',
    position: [7.2, 0.9, -1.5],
    cameraPosition: [5.2, 1.6, -1.8],
    color: '#dc2626', // Enamel red accent
    shape: 'box',
    dimensions: [0.8, 1.0, 0.9],
  },

  // Room 4: Study (12-15)
  {
    id: 12,
    name: 'Wood Desk',
    room: 'Study',
    position: [-5.0, 0.8, 2.0],
    cameraPosition: [-3.5, 1.6, 2.5],
    color: '#92400e', // Dark timber
    shape: 'box',
    dimensions: [1.8, 0.8, 1.0],
  },
  {
    id: 13,
    name: 'Desk Chair',
    room: 'Study',
    position: [-5.0, 0.6, 3.5],
    cameraPosition: [-3.5, 1.6, 3.5],
    color: '#059669', // Emerald green leather
    shape: 'cylinder',
    dimensions: [0.4, 0.9, 0.4],
  },
  {
    id: 14,
    name: 'Filing Cabinet',
    room: 'Study',
    position: [-7.2, 1.0, 6.0],
    cameraPosition: [-5.2, 1.6, 5.5],
    color: '#475569', // Charcoal metal
    shape: 'box',
    dimensions: [0.7, 1.4, 0.6],
  },
  {
    id: 15,
    name: 'Wall Whiteboard',
    room: 'Study',
    position: [-3.0, 1.6, 7.4],
    cameraPosition: [-3.0, 1.6, 5.4],
    color: '#f8fafc', // Glossy white surface
    shape: 'box',
    dimensions: [2.0, 1.2, 0.08],
  },

  // Room 5: Bedroom (16-18)
  {
    id: 16,
    name: 'Nightstand',
    room: 'Bedroom',
    position: [3.2, 0.6, 2.0],
    cameraPosition: [2.0, 1.6, 2.5],
    color: '#78350f', // Walnut
    shape: 'box',
    dimensions: [0.6, 0.7, 0.6],
  },
  {
    id: 17,
    name: 'Sleeping Bed',
    room: 'Bedroom',
    position: [5.5, 0.6, 3.5],
    cameraPosition: [3.5, 1.6, 3.5],
    color: '#6366f1', // Indigo linen
    shape: 'box',
    dimensions: [2.2, 0.7, 1.8],
  },
  {
    id: 18,
    name: 'Tall Wardrobe',
    room: 'Bedroom',
    position: [7.2, 1.5, 6.5],
    cameraPosition: [5.2, 1.6, 6.0],
    color: '#831843', // Deep rosewood
    shape: 'box',
    dimensions: [0.8, 2.4, 1.5],
  },

  // Room 6: Bathroom (19-20)
  {
    id: 19,
    name: 'Bathtub Basin',
    room: 'Bathroom',
    position: [-2.5, 0.5, 11.0],
    cameraPosition: [-1.0, 1.6, 11.0],
    color: '#0891b2', // Cyan porcelain
    shape: 'box',
    dimensions: [1.8, 0.7, 0.9],
  },
  {
    id: 20,
    name: 'Shower Curtain',
    room: 'Bathroom',
    position: [2.5, 1.4, 11.0],
    cameraPosition: [1.0, 1.6, 11.0],
    color: '#0d9488', // Teal vinyl
    shape: 'cylinder',
    dimensions: [0.2, 2.2, 1.2],
  },
] as const;
