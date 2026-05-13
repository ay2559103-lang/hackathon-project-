import { supabase } from '../utils/supabase/client';

export const bulkUploadProducts = async (products) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(products.map(p => ({
        ...p,
        status: p.status || 'draft',
        created_at: new Date(),
        updated_at: new Date()
      })));
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Bulk upload error:', error);
    return { data: null, error };
  }
};

export const duplicateProduct = async (product) => {
  try {
    const { id, created_at, updated_at, view_count, order_count, rating, review_count, ...rest } = product;
    
    const duplicated = {
      ...rest,
      title: `${product.title} (Copy)`,
      sku: product.sku ? `${product.sku}-COPY-${Math.floor(Math.random() * 1000)}` : null,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await supabase
      .from('products')
      .insert([duplicated])
      .select()
      .single();

    if (error) throw error;

    // Duplicate images as well
    const { data: images, error: imgError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id);

    if (!imgError && images && images.length > 0) {
      const duplicatedImages = images.map(({ id, created_at, ...imgRest }) => ({
        ...imgRest,
        product_id: data.id
      }));
      await supabase.from('product_images').insert(duplicatedImages);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Duplicate product error:', error);
    return { data: null, error };
  }
};

export const getAdminStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_admin_product_stats');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Get admin stats error:', error);
    return { data: null, error };
  }
};
