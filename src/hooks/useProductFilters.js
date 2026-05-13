import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

const STORAGE_KEY = 'product_filters_v2';

const DEFAULT_FILTERS = {
  categories: [],
  brands: [],
  priceRange: [0, 15000],
  minRating: 0,
  availability: 'all', // 'all' | 'in_stock' | 'out_of_stock'
  deliveryTime: 'all', // 'all' | 'same_day' | '1_2_days' | '3_5_days'
  maxDistance: 10, // km
  sortBy: 'relevance', // 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'distance'
  page: 1,
};


function loadFilters() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_FILTERS, ...parsed, page: 1 }; // Reset page on load
    }
  } catch (e) {
    console.error("Could not load filters from storage", e);
  }
  return { ...DEFAULT_FILTERS };
}

function saveFilters(filters) {
  try {
    const { page, ...filtersToSave } = filters; // don't persist pagination
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
  } catch (e) {
    console.error("Could not save filters to storage", e);
  }
}

export default function useProductFilters(initialProductsFallback = []) {
  const [filters, setFilters] = useState(loadFilters);
  const [filteredProducts, setFilteredProducts] = useState(initialProductsFallback);
  const [totalCount, setTotalCount] = useState(initialProductsFallback.length);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    categories: ['Electronics', 'Fashion', 'Home & Garden', 'Handmade Crafts', 'Groceries'],
    brands: ['Nike', 'Apple', 'Samsung', 'Adidas', 'Sony', 'Local Artisan'], // Mock fallback
    priceRange: [0, 15000],
  });

  const debounceRef = useRef(null);

  // Apply real-time changes
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  const fetchProducts = useCallback(async (currentFilters) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_filtered_products', {
        search_term: currentFilters.search,
        categories_filter: currentFilters.categories,
        brands_filter: currentFilters.brands,
        min_price: currentFilters.priceRange[0],
        max_price: currentFilters.priceRange[1],
        min_rating: currentFilters.minRating,
        availability_filter: currentFilters.availability,
        delivery_filter: currentFilters.deliveryTime,
        sort_by: currentFilters.sortBy,
        page_size: 20,
        page_number: currentFilters.page
      });

      if (error) {
        console.warn('Supabase RPC get_filtered_products failed, falling back to mock filtering:', error.message);
        fallbackClientFiltering(currentFilters);
        return;
      }

      if (data && data.length > 0) {
        // Map database fields to frontend fields
        const mappedProducts = data.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          originalPrice: p.original_price,
          category: p.category_name,
          brand: p.brand,
          rating: p.rating,
          likes: p.reviews_count, // mapping for UI
          inStock: p.is_in_stock,
          deliveryDays: p.delivery_time === 'same_day' ? 0 : (p.delivery_time === '1_2_days' ? 1 : 3),
          distance: '2.5 km', // Placeholder if no geo-query
          distanceKm: 2.5,
          image: `https://source.unsplash.com/random/400x400/?${p.category_name || 'product'}`, // fallback img
          views: 120,
          description: p.title, 
        }));
        setFilteredProducts(mappedProducts);
        setTotalCount(data[0].total_count);
      } else {
        setFilteredProducts([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.warn('Error fetching products, falling back:', err);
      fallbackClientFiltering(currentFilters);
    } finally {
      setIsLoading(false);
    }
  }, [initialProductsFallback]);

  const fallbackClientFiltering = useCallback((currentFilters) => {
      let result = initialProductsFallback.filter(p => {

        if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(p.category)) return false;
        if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(p.brand)) return false;
        if (p.price < currentFilters.priceRange[0] || p.price > currentFilters.priceRange[1]) return false;
        if (currentFilters.minRating > 0 && (p.rating || 0) < currentFilters.minRating) return false;
        if (currentFilters.availability === 'in_stock' && !p.inStock) return false;
        if (currentFilters.availability === 'out_of_stock' && p.inStock) return false;
        if (currentFilters.deliveryTime !== 'all') {
          const days = p.deliveryDays || 999;
          if (currentFilters.deliveryTime === 'same_day' && days > 0) return false;
          if (currentFilters.deliveryTime === '1_2_days' && days > 2) return false;
          if (currentFilters.deliveryTime === '3_5_days' && days > 5) return false;
        }
        if (p.distanceKm && p.distanceKm > currentFilters.maxDistance) return false;
        return true;
      });

      switch (currentFilters.sortBy) {
        case 'price_low': result.sort((a, b) => a.price - b.price); break;
        case 'price_high': result.sort((a, b) => b.price - a.price); break;
        case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
        case 'newest': result.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
        case 'distance': result.sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99)); break;
        default: result.sort((a, b) => (b.views || 0) - (a.views || 0));
      }

      setFilteredProducts(result);
      setTotalCount(result.length);
  }, [initialProductsFallback]);

  // Trigger fetch when filters change (with debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(filters);
    }, 400); // 400ms debounce
    return () => clearTimeout(debounceRef.current);
  }, [filters, fetchProducts]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const toggleArrayFilter = useCallback((key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...prev, [key]: next, page: 1 };
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const setPage = useCallback((pageNumber) => {
    setFilters(prev => ({ ...prev, page: pageNumber }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 15000) count++;
    if (filters.minRating > 0) count++;
    if (filters.availability !== 'all') count++;
    if (filters.deliveryTime !== 'all') count++;
    if (filters.maxDistance < 10) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredProducts,
    totalCount,
    filterOptions,
    isLoading,
    activeFilterCount,
    updateFilter,
    toggleArrayFilter,
    clearAllFilters,
    setPage,
  };
}
