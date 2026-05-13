import { supabase } from '../utils/supabase/client';

export const getProducts = async () => {
  return await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
};

export const deleteProduct = async (id) => {
  return await supabase
    .from('products')
    .delete()
    .eq('id', id);
};

export const productService = {
  /**
   * Fetch a single product with all its associated data
   */
  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:profiles!products_seller_id_fkey(*),
          images:product_images(*),
          category:product_categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching product:', error);
      return { data: null, error };
    }
  },

  /**
   * Fetch nearby prices for the same product
   */
  async getNearbyPrices(productId) {
    try {
      const { data, error } = await supabase
        .from('nearby_seller_prices')
        .select(`
          *,
          seller:profiles!nearby_seller_prices_seller_id_fkey(full_name, rating, avatar_url)
        `)
        .eq('product_id', productId)
        .order('price', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching nearby prices:', error);
      return { data: [], error };
    }
  },

  /**
   * Fetch reviews for a product
   */
  async getProductReviews(productId) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:profiles(full_name, avatar_url)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return { data: [], error };
    }
  },

  /**
   * Add item to cart
   */
  async addToCart(userId, productId, quantity = 1) {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id: productId, quantity },
          { onConflict: 'user_id,product_id' }
        )
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return { data: null, error };
    }
  },

  /**
   * Add/Remove from wishlist
   */
  async toggleWishlist(userId, productId) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed', error: null };
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: productId });
        if (error) throw error;
        return { action: 'added', error: null };
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      return { action: null, error };
    }
  },

  /**
   * Fetch all product categories
   */
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: [], error };
    }
  }
};

/**
 * Create a new product with multiple image uploads
 */
export const createProduct = async (formData, imageFiles, user, status = 'active') => {
  try {
    if (!user) throw new Error('Authentication required to create product');

    const uploadedImages = [];
    
    // 1. Upload all images to Supabase Storage
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
      uploadedImages.push({
        url: publicUrl,
        is_primary: i === 0,
        display_order: i
      });
    }

    // 2. Get category ID
    const { data: categoryData } = await supabase
      .from('product_categories')
      .select('id')
      .eq('name', formData.category)
      .single();

    // 3. Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        category_id: categoryData?.id || null,
        category_name: formData.category,
        brand: formData.brand,
        product_condition: formData.condition,
        key_features: formData.features,
        stock_quantity: parseInt(formData.stock) || 0,
        location: `${formData.city}, ${formData.state}`,
        location_city: formData.city,
        location_state: formData.state,
        location_country: formData.country,
        location_pincode: formData.pincode,
        image_url: uploadedImages[0]?.url,
        tags: formData.tags,
        status: status,
        is_shipping_available: formData.shippingAvailable === 'yes',
        delivery_estimate: formData.deliveryTime,
        shipping_charges: parseFloat(formData.shippingCharges) || 0,
        return_policy: formData.returnPolicy,
        warranty_info: formData.warranty,
        size_variants: formData.sizes,
        color_variants: formData.colors,
        material_variants: formData.materials
      })
      .select()
      .single();

    if (productError) throw productError;

    // 4. Insert all images into product_images gallery
    const imageRecords = uploadedImages.map(img => ({
      product_id: product.id,
      url: img.url,
      is_primary: img.is_primary,
      display_order: img.display_order
    }));

    const { error: imageError } = await supabase
      .from('product_images')
      .insert(imageRecords);

    if (imageError) throw imageError;

    return { data: product, error: null };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};
