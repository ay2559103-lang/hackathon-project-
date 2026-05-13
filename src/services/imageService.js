import { supabase } from '../utils/supabase/client';

/**
 * Image Service for handling product image uploads and gallery management
 */

export const uploadProductImage = async (file, path = 'products') => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, path: null, error };
  }
};

export const deleteProductImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { error };
  }
};

export const saveImageGallery = async (productId, images) => {
  try {
    // 1. Delete existing images if needed or handle updates
    // For simplicity, we'll insert new ones. The caller should manage which ones to keep.
    
    const imageRecords = images.map((img, index) => ({
      product_id: productId,
      url: img.url,
      display_order: index,
      is_primary: index === 0,
      alt_text: img.alt_text || ''
    }));

    const { data, error } = await supabase
      .from('product_images')
      .insert(imageRecords);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving image gallery:', error);
    return { data: null, error };
  }
};
