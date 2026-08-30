import type { Product } from '../types'

// ---------------------------------------------------------------------------
// Sample catalog for Phase 1 launch. Replace with a real inventory feed
// later — components only depend on the Product shape in types.ts, not
// on this file's contents, so swapping this out is a drop-in change.
// Placeholder images use placehold.co; swap imageUrl for real product
// photography when available.
// ---------------------------------------------------------------------------

function img(label: string, bg: string) {
  return `https://placehold.co/400x400/${bg}/1C231F?text=${encodeURIComponent(label)}&font=roboto`
}

export const PRODUCTS: Product[] = [
  // Fruits & Vegetables
  { id: 'p001', name: 'Fresh Tomato', brand: 'SGS Farm Fresh', categoryId: 'fruits-veg', packSize: '1 kg', price: 42, mrp: 50, imageUrl: img('Tomato', 'F5D9C9'), popular: true, inStock: true },
  { id: 'p002', name: 'Onion', brand: 'SGS Farm Fresh', categoryId: 'fruits-veg', packSize: '1 kg', price: 38, imageUrl: img('Onion', 'F5D9C9'), inStock: true },
  { id: 'p003', name: 'Robusta Banana', brand: 'SGS Farm Fresh', categoryId: 'fruits-veg', packSize: '6 pcs', price: 45, mrp: 55, imageUrl: img('Banana', 'F5D9C9'), popular: true, inStock: true },
  { id: 'p004', name: 'Potato', brand: 'SGS Farm Fresh', categoryId: 'fruits-veg', packSize: '1 kg', price: 32, imageUrl: img('Potato', 'F5D9C9'), inStock: true },

  // Rice & Grains
  { id: 'p010', name: 'Ponni Boiled Rice', brand: 'SGS Daily', categoryId: 'rice-grains', packSize: '5 kg', price: 320, mrp: 360, imageUrl: img('Ponni+Rice', 'E4EFE6'), popular: true, inStock: true },
  { id: 'p011', name: 'Idli Rice', brand: 'SGS Daily', categoryId: 'rice-grains', packSize: '5 kg', price: 305, imageUrl: img('Idli+Rice', 'E4EFE6'), inStock: true },
  { id: 'p012', name: 'Aashirvaad Atta', brand: 'Aashirvaad', categoryId: 'rice-grains', packSize: '5 kg', price: 299, mrp: 340, imageUrl: img('Aashirvaad+Atta', 'E4EFE6'), popular: true, inStock: true },

  // Dals & Pulses
  { id: 'p020', name: 'Toor Dal', brand: 'SGS Daily', categoryId: 'dals-pulses', packSize: '1 kg', price: 165, mrp: 180, imageUrl: img('Toor+Dal', 'FBEFD8'), inStock: true },
  { id: 'p021', name: 'Moong Dal', brand: 'SGS Daily', categoryId: 'dals-pulses', packSize: '1 kg', price: 145, imageUrl: img('Moong+Dal', 'FBEFD8'), inStock: true },
  { id: 'p022', name: 'Chana Dal', brand: 'SGS Daily', categoryId: 'dals-pulses', packSize: '1 kg', price: 110, imageUrl: img('Chana+Dal', 'FBEFD8'), inStock: true },

  // Oil & Ghee
  { id: 'p030', name: 'Sunflower Oil', brand: 'Gold Winner', categoryId: 'oil-ghee', packSize: '1 L', price: 148, mrp: 165, imageUrl: img('Sunflower+Oil', 'FDECC8'), popular: true, inStock: true },
  { id: 'p031', name: 'Pure Ghee', brand: 'Aavin', categoryId: 'oil-ghee', packSize: '500 ml', price: 320, imageUrl: img('Ghee', 'FDECC8'), inStock: true },
  { id: 'p032', name: 'Groundnut Oil', brand: 'Idhayam', categoryId: 'oil-ghee', packSize: '1 L', price: 210, mrp: 230, imageUrl: img('Groundnut+Oil', 'FDECC8'), inStock: true },

  // Spices & Masalas
  { id: 'p040', name: 'Sambar Powder', brand: 'SGS Daily', categoryId: 'spices-masalas', packSize: '200 g', price: 65, imageUrl: img('Sambar+Powder', 'F6D9C4'), inStock: true },
  { id: 'p041', name: 'Turmeric Powder', brand: 'SGS Daily', categoryId: 'spices-masalas', packSize: '200 g', price: 48, imageUrl: img('Turmeric', 'F6D9C4'), inStock: true },
  { id: 'p042', name: 'Chilli Powder', brand: 'SGS Daily', categoryId: 'spices-masalas', packSize: '200 g', price: 72, mrp: 80, imageUrl: img('Chilli+Powder', 'F6D9C4'), popular: true, inStock: true },

  // Dairy & Bakery
  { id: 'p050', name: 'Toned Milk', brand: 'Aavin', categoryId: 'dairy-bakery', packSize: '1 L', price: 56, imageUrl: img('Milk', 'F0EFE9'), popular: true, inStock: true },
  { id: 'p051', name: 'Curd', brand: 'Aavin', categoryId: 'dairy-bakery', packSize: '400 g', price: 38, imageUrl: img('Curd', 'F0EFE9'), inStock: true },
  { id: 'p052', name: 'Milk Bread', brand: 'Modern', categoryId: 'dairy-bakery', packSize: '400 g', price: 45, mrp: 50, imageUrl: img('Bread', 'F0EFE9'), inStock: true },
  { id: 'p053', name: 'Paneer', brand: 'Aavin', categoryId: 'dairy-bakery', packSize: '200 g', price: 85, imageUrl: img('Paneer', 'F0EFE9'), inStock: true },

  // Beverages
  { id: 'p060', name: 'Filter Coffee Powder', brand: 'SGS Daily', categoryId: 'beverages', packSize: '200 g', price: 110, mrp: 125, imageUrl: img('Coffee', 'E7DCC8'), popular: true, inStock: true },
  { id: 'p061', name: 'Tea Powder', brand: 'Red Label', categoryId: 'beverages', packSize: '250 g', price: 135, imageUrl: img('Tea', 'E7DCC8'), inStock: true },
  { id: 'p062', name: 'Orange Juice', brand: 'Real', categoryId: 'beverages', packSize: '1 L', price: 120, imageUrl: img('Orange+Juice', 'E7DCC8'), inStock: true },

  // Snacks
  { id: 'p070', name: 'Banana Chips', brand: 'SGS Daily', categoryId: 'snacks', packSize: '200 g', price: 55, imageUrl: img('Banana+Chips', 'F7E3C8'), inStock: true },
  { id: 'p071', name: 'Mixture', brand: 'SGS Daily', categoryId: 'snacks', packSize: '200 g', price: 60, mrp: 68, imageUrl: img('Mixture', 'F7E3C8'), popular: true, inStock: true },
  { id: 'p072', name: 'Marie Gold Biscuits', brand: 'Britannia', categoryId: 'snacks', packSize: '250 g', price: 35, imageUrl: img('Biscuits', 'F7E3C8'), inStock: true },

  // Personal Care
  { id: 'p080', name: 'Herbal Shampoo', brand: 'Himalaya', categoryId: 'personal-care', packSize: '340 ml', price: 210, mrp: 240, imageUrl: img('Shampoo', 'E6E6EC'), inStock: true },
  { id: 'p081', name: 'Bathing Soap (Pack of 4)', brand: 'Santoor', categoryId: 'personal-care', packSize: '4x100 g', price: 128, imageUrl: img('Soap', 'E6E6EC'), inStock: true },
  { id: 'p082', name: 'Toothpaste', brand: 'Colgate', categoryId: 'personal-care', packSize: '200 g', price: 105, imageUrl: img('Toothpaste', 'E6E6EC'), inStock: true },

  // Household
  { id: 'p090', name: 'Steel Storage Container Set', brand: 'SGS Home', categoryId: 'household', packSize: 'Set of 3', price: 349, imageUrl: img('Containers', 'E9E3D6'), inStock: true },
  { id: 'p091', name: 'LED Bulb', brand: 'Philips', categoryId: 'household', packSize: '9W', price: 99, mrp: 120, imageUrl: img('LED+Bulb', 'E9E3D6'), inStock: true },

  // Baby Care
  { id: 'p100', name: 'Baby Diapers', brand: 'Pampers', categoryId: 'baby-care', packSize: 'M, 40 pcs', price: 449, mrp: 499, imageUrl: img('Diapers', 'F4E6EE'), popular: true, inStock: true },
  { id: 'p101', name: 'Baby Wipes', brand: 'Himalaya', categoryId: 'baby-care', packSize: '72 pcs', price: 149, imageUrl: img('Baby+Wipes', 'F4E6EE'), inStock: true },

  // Cleaning Products
  { id: 'p110', name: 'Dishwash Liquid', brand: 'Vim', categoryId: 'cleaning', packSize: '750 ml', price: 135, mrp: 150, imageUrl: img('Dishwash', 'DCEAE4'), inStock: true },
  { id: 'p111', name: 'Floor Cleaner', brand: 'Lizol', categoryId: 'cleaning', packSize: '975 ml', price: 189, imageUrl: img('Floor+Cleaner', 'DCEAE4'), inStock: true },
  { id: 'p112', name: 'Detergent Powder', brand: 'Surf Excel', categoryId: 'cleaning', packSize: '2 kg', price: 245, mrp: 270, imageUrl: img('Detergent', 'DCEAE4'), popular: true, inStock: true },
]
