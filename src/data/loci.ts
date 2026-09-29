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
  modelFile: string; // CC0 3D model in /models/ (e.g. 'doorwayFront.glb')
  rotation?: [number, number, number]; // Euler rotation angles
}

/**
 * 20 LOCI DEFINITION:
 * Strictly verified to contain zero words from List A or List B.
 * Follows a single continuous walking circuit through 6 rooms.
 * Each locus maps to an unmistakable CC0 3D model from Kenney Furniture Kit.
 */
export const PALACE_LOCI: readonly LocusData[] = [
  // Room 1: Hallway (1-3)
  {
    id: 1,
    name: 'Front Door',
    room: 'Hallway',
    position: [0, 0, -13.8],
    cameraPosition: [0, 1.5, -11.2],
    color: '#854d0e', // Amber wood
    shape: 'box',
    dimensions: [1.3, 2.2, 0.3],
    modelFile: 'doorwayFront.glb',
    rotation: [0, 0, 0],
  },
  {
    id: 2,
    name: 'Entryway Bench',
    room: 'Hallway',
    position: [1.8, 0, -11.0],
    cameraPosition: [-0.4, 1.4, -11.0],
    color: '#a16207', // Light wood
    shape: 'box',
    dimensions: [1.4, 0.6, 0.7],
    modelFile: 'benchCushionLow.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 3,
    name: 'Standing Coat Rack',
    room: 'Hallway',
    position: [-1.8, 0, -9.0],
    cameraPosition: [0.4, 1.5, -9.0],
    color: '#475569', // Slate metal
    shape: 'cylinder',
    dimensions: [0.6, 1.8, 0.6],
    modelFile: 'coatRackStanding.glb',
    rotation: [0, 0, 0],
  },

  // Room 2: Living Room (4-7)
  {
    id: 4,
    name: 'Lounge Sofa',
    room: 'Living Room',
    position: [-5.0, 0, -6.0],
    cameraPosition: [-2.4, 1.4, -6.0],
    color: '#e11d48', // Coral red upholstery
    shape: 'box',
    dimensions: [2.2, 0.9, 1.0],
    modelFile: 'loungeSofa.glb',
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 5,
    name: 'Coffee Table',
    room: 'Living Room',
    position: [-5.0, 0, -4.0],
    cameraPosition: [-2.6, 1.4, -4.0],
    color: '#b45309', // Warm oak
    shape: 'box',
    dimensions: [1.2, 0.45, 0.8],
    modelFile: 'tableCoffee.glb',
    rotation: [0, 0, 0],
  },
  {
    id: 6,
    name: 'Television Set',
    room: 'Living Room',
    position: [-7.2, 0, -4.0],
    cameraPosition: [-4.6, 1.5, -4.0],
    color: '#0f172a', // Matte black
    shape: 'box',
    dimensions: [0.3, 1.2, 1.6],
    modelFile: 'televisionModern.glb',
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 7,
    name: 'Bookcase',
    room: 'Living Room',
    position: [-2.0, 0, -7.2],
    cameraPosition: [-2.0, 1.5, -4.6],
    color: '#7c2d12', // Mahogany
    shape: 'box',
    dimensions: [1.2, 2.2, 0.5],
    modelFile: 'bookcaseClosed.glb',
    rotation: [0, 0, 0],
  },

  // Room 3: Kitchen (8-11)
  {
    id: 8,
    name: 'Dining Table',
    room: 'Kitchen',
    position: [3.5, 0, -6.0],
    cameraPosition: [1.0, 1.5, -6.0],
    color: '#d97706', // Honey oak
    shape: 'cylinder',
    dimensions: [1.8, 0.85, 1.8],
    modelFile: 'tableRound.glb',
    rotation: [0, 0, 0],
  },
  {
    id: 9,
    name: 'Refrigerator',
    room: 'Kitchen',
    position: [7.2, 0, -7.0],
    cameraPosition: [4.6, 1.5, -7.0],
    color: '#cbd5e1', // Stainless steel silver
    shape: 'box',
    dimensions: [1.0, 2.2, 0.9],
    modelFile: 'kitchenFridgeLarge.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 10,
    name: 'Kitchen Sink',
    room: 'Kitchen',
    position: [7.2, 0, -4.0],
    cameraPosition: [4.6, 1.4, -4.0],
    color: '#64748b', // Steel grey
    shape: 'box',
    dimensions: [1.0, 0.95, 0.9],
    modelFile: 'kitchenSink.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 11,
    name: 'Cooking Stove',
    room: 'Kitchen',
    position: [7.2, 0, -1.5],
    cameraPosition: [4.6, 1.4, -1.5],
    color: '#dc2626', // Enamel red accent
    shape: 'box',
    dimensions: [0.9, 0.95, 0.9],
    modelFile: 'kitchenStoveElectric.glb',
    rotation: [0, -Math.PI / 2, 0],
  },

  // Room 4: Study (12-15)
  {
    id: 12,
    name: 'Wood Desk',
    room: 'Study',
    position: [-5.0, 0, 2.0],
    cameraPosition: [-2.6, 1.5, 2.0],
    color: '#92400e', // Dark timber
    shape: 'box',
    dimensions: [1.8, 0.85, 1.0],
    modelFile: 'desk.glb',
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 13,
    name: 'Desk Chair',
    room: 'Study',
    position: [-5.0, 0, 3.5],
    cameraPosition: [-2.6, 1.4, 3.5],
    color: '#059669', // Emerald green leather
    shape: 'cylinder',
    dimensions: [0.75, 1.0, 0.75],
    modelFile: 'chairDesk.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 14,
    name: 'Storage Box',
    room: 'Study',
    position: [-7.2, 0, 6.0],
    cameraPosition: [-4.6, 1.4, 6.0],
    color: '#b45309', // Cardboard brown
    shape: 'box',
    dimensions: [0.8, 0.8, 0.8],
    modelFile: 'cardboardBoxClosed.glb',
    rotation: [0, 0, 0],
  },
  {
    id: 15,
    name: 'Reading Armchair',
    room: 'Study',
    position: [-3.0, 0, 6.8],
    cameraPosition: [-3.0, 1.45, 4.4],
    color: '#1e3a8a', // Dark blue armchair fabric
    shape: 'box',
    dimensions: [1.1, 0.9, 1.1],
    modelFile: 'loungeChairRelax.glb',
    rotation: [0, Math.PI, 0],
  },

  // Room 5: Bedroom (16-18)
  {
    id: 16,
    name: 'Nightstand',
    room: 'Bedroom',
    position: [3.2, 0, 2.0],
    cameraPosition: [1.2, 1.4, 2.0],
    color: '#78350f', // Walnut
    shape: 'box',
    dimensions: [0.8, 0.75, 0.7],
    modelFile: 'sideTableDrawers.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 17,
    name: 'Double Bed',
    room: 'Bedroom',
    position: [5.5, 0, 3.5],
    cameraPosition: [2.5, 1.5, 3.5],
    color: '#6366f1', // Indigo linen
    shape: 'box',
    dimensions: [2.2, 0.8, 2.0],
    modelFile: 'bedDouble.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
  {
    id: 18,
    name: 'Bedroom Dresser',
    room: 'Bedroom',
    position: [7.2, 0, 6.5],
    cameraPosition: [4.6, 1.4, 6.5],
    color: '#831843', // Deep rosewood
    shape: 'box',
    dimensions: [1.0, 1.1, 0.7],
    modelFile: 'cabinetBedDrawer.glb',
    rotation: [0, -Math.PI / 2, 0],
  },

  // Room 6: Bathroom (19-20)
  {
    id: 19,
    name: 'Bathtub',
    room: 'Bathroom',
    position: [-2.5, 0, 11.0],
    cameraPosition: [0.2, 1.5, 11.0],
    color: '#0891b2', // Cyan porcelain
    shape: 'box',
    dimensions: [1.8, 0.65, 0.9],
    modelFile: 'bathtub.glb',
    rotation: [0, Math.PI / 2, 0],
  },
  {
    id: 20,
    name: 'Glass Shower',
    room: 'Bathroom',
    position: [2.5, 0, 11.0],
    cameraPosition: [-0.2, 1.5, 11.0],
    color: '#0d9488', // Teal glass
    shape: 'cylinder',
    dimensions: [1.4, 2.2, 1.4],
    modelFile: 'showerRound.glb',
    rotation: [0, -Math.PI / 2, 0],
  },
] as const;

/**
 * Helper to retrieve a locus by ID (1-based index).
 */
export function getLocusById(id: number): LocusData | undefined {
  return PALACE_LOCI.find((l) => l.id === id);
}

/**
 * Route order for the memory palace.
 */
export const PALACE_ROUTE_ORDER: readonly number[] = PALACE_LOCI.map((l) => l.id);
