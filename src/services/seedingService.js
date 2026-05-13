import { supabase } from '../utils/supabase/client';
import { createProduct } from './productService';

const SAMPLE_PRODUCTS = [
  {
    title: 'Artisan Sourdough Bread',
    description: 'Freshly baked 48-hour fermented sourdough bread. Organic flour, water, salt, and lots of love. Crusty outside, airy inside.',
    category: 'Home Food',
    price: '180',
    originalPrice: '220',
    stock: '10',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    condition: 'New',
    features: ['Organic Flour', '48h Fermentation', 'No Preservatives'],
    tags: ['bakery', 'sourdough', 'fresh', 'homemade'],
    imageUrl: 'https://images.unsplash.com/photo-1585478259715-876a6a81fc08?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Handmade Lavender Soy Candle',
    description: 'Pure soy wax candle infused with organic lavender essential oil. 40+ hours burn time. Hand-poured in a recycled glass jar.',
    category: 'Handmade Crafts',
    price: '450',
    originalPrice: '600',
    stock: '25',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    condition: 'New',
    features: ['Eco-friendly Soy Wax', 'Essential Oils', 'Long Burn Time'],
    tags: ['candle', 'lavender', 'handmade', 'aromatherapy'],
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Organic Cherry Tomatoes',
    description: 'Sweet and juicy cherry tomatoes grown without any chemical pesticides. Harvested fresh every morning from our rooftop garden.',
    category: 'Fresh Produce',
    price: '120',
    originalPrice: '150',
    stock: '50',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    condition: 'New',
    features: ['Pesticide Free', 'Fresh Daily', 'Rooftop Grown'],
    tags: ['organic', 'vegetables', 'fresh', 'tomatoes'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
  },
  {
    title: 'Hand-Carved Teak Wood Bowl',
    description: 'A beautiful decorative bowl hand-carved from reclaimed teak wood. Each piece features a unique grain pattern and organic shape.',
    category: 'Handmade Crafts',
    price: '1200',
    originalPrice: '1800',
    stock: '5',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pincode: '201301',
    condition: 'New',
    features: ['Reclaimed Wood', 'Hand-Carved', 'Unique Piece'],
    tags: ['woodwork', 'artisanal', 'home-decor', 'teak'],
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=800'
  }
];

export const seedSellerProducts = async (user) => {
  if (!user) return { success: false, error: 'User not authenticated' };

  try {
    const results = [];
    for (const productData of SAMPLE_PRODUCTS) {
      // We need to simulate the file upload or bypass it since we have URLs
      // Modified createProduct to handle URL instead of File if needed, 
      // or we can manually insert into Supabase here.
      
      const { data: categoryData } = await supabase
        .from('product_categories')
        .select('id')
        .eq('name', productData.category)
        .single();

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          title: productData.title,
          description: productData.description,
          price: parseFloat(productData.price),
          original_price: parseFloat(productData.originalPrice),
          category_id: categoryData?.id || null,
          category_name: productData.category,
          product_condition: productData.condition,
          key_features: productData.features,
          stock_quantity: parseInt(productData.stock),
          location_city: productData.city,
          location_state: productData.state,
          location_country: productData.country,
          location_pincode: productData.pincode,
          image_url: productData.imageUrl,
          tags: productData.tags,
          status: 'active'
        })
        .select()
        .single();

      if (productError) throw productError;

      // Add to product_images
      await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          url: productData.imageUrl,
          is_primary: true,
          display_order: 0
        });

      results.push(product);
    }

    return { success: true, count: results.length };
  } catch (error) {
    console.error('Seeding Error:', error);
    return { success: false, error: error.message };
  }
};
