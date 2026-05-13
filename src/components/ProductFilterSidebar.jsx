import { useState } from 'react';
import {
  X, ChevronDown, ChevronUp, Star, MapPin, Truck, Package,
  Tag, DollarSign, Layers, RotateCcw, Check
} from 'lucide-react';

function FilterSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pf-section">
      <button className="pf-section-header" onClick={() => setOpen(!open)}>
        <div className="pf-section-title">
          {Icon && <Icon size={16} />}
          <span>{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div className={`pf-section-body ${open ? 'open' : ''}`}>
        <div className="pf-section-content">{children}</div>
      </div>
    </div>
  );
}

function CheckboxItem({ label, checked, onChange, count }) {
  return (
    <label className="pf-checkbox-item">
      <div className={`pf-checkbox ${checked ? 'checked' : ''}`}>
        {checked && <Check size={12} />}
      </div>
      <span className="pf-checkbox-label">{label}</span>
      {count !== undefined && <span className="pf-checkbox-count">{count}</span>}
      <input type="checkbox" checked={checked} onChange={onChange} hidden />
    </label>
  );
}

function RatingStars({ value, onChange }) {
  const ratings = [4, 3, 2, 1];
  return (
    <div className="pf-rating-list">
      {ratings.map(r => (
        <button
          key={r}
          className={`pf-rating-btn ${value === r ? 'active' : ''}`}
          onClick={() => onChange(value === r ? 0 : r)}
        >
          <div className="pf-stars">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                fill={i < r ? '#FBBF24' : 'none'}
                stroke={i < r ? '#FBBF24' : '#475569'}
              />
            ))}
          </div>
          <span>& Up</span>
        </button>
      ))}
    </div>
  );
}

export default function ProductFilterSidebar({
  filters,
  filterOptions,
  activeFilterCount,
  updateFilter,
  toggleArrayFilter,
  clearAllFilters,
  isOpen,
  onClose,
  products,
}) {
  const getCategoryCount = (cat) => products?.filter(p => p.category === cat).length || 0;
  const getBrandCount = (brand) => products?.filter(p => p.brand === brand).length || 0;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`pf-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`pf-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="pf-header">
          <div className="pf-header-left">
            <h3 className="pf-title">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="pf-active-count">{activeFilterCount}</span>
            )}
          </div>
          <div className="pf-header-right">
            {activeFilterCount > 0 && (
              <button className="pf-clear-btn" onClick={clearAllFilters}>
                <RotateCcw size={14} />
                Clear All
              </button>
            )}
            <button className="pf-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="pf-body">
          {/* Category Filter */}
          <FilterSection title="Category" icon={Layers}>
            <div className="pf-checkbox-list">
              {filterOptions.categories.map(cat => (
                <CheckboxItem
                  key={cat}
                  label={cat}
                  checked={filters.categories.includes(cat)}
                  onChange={() => toggleArrayFilter('categories', cat)}
                  count={getCategoryCount(cat)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection title="Price Range" icon={DollarSign}>
            <div className="pf-price-range">
              <div className="pf-price-inputs">
                <div className="pf-price-input-wrap">
                  <span className="pf-currency">₹</span>
                  <input
                    type="number"
                    className="pf-price-input"
                    value={filters.priceRange[0]}
                    onChange={(e) => updateFilter('priceRange', [
                      Math.max(0, Number(e.target.value)),
                      filters.priceRange[1]
                    ])}
                    min={0}
                    placeholder="Min"
                  />
                </div>
                <span className="pf-price-dash">—</span>
                <div className="pf-price-input-wrap">
                  <span className="pf-currency">₹</span>
                  <input
                    type="number"
                    className="pf-price-input"
                    value={filters.priceRange[1]}
                    onChange={(e) => updateFilter('priceRange', [
                      filters.priceRange[0],
                      Math.max(filters.priceRange[0], Number(e.target.value))
                    ])}
                    min={0}
                    placeholder="Max"
                  />
                </div>
              </div>
              <input
                type="range"
                className="pf-range-slider"
                min={0}
                max={15000}
                step={100}
                value={filters.priceRange[1]}
                onChange={(e) => updateFilter('priceRange', [
                  filters.priceRange[0],
                  Number(e.target.value)
                ])}
              />
              <div className="pf-range-labels">
                <span>₹0</span>
                <span>₹15,000</span>
              </div>
            </div>
          </FilterSection>

          {/* Brand Filter */}
          <FilterSection title="Brand" icon={Tag}>
            <div className="pf-checkbox-list">
              {filterOptions.brands.map(brand => (
                <CheckboxItem
                  key={brand}
                  label={brand}
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleArrayFilter('brands', brand)}
                  count={getBrandCount(brand)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Rating Filter */}
          <FilterSection title="Rating" icon={Star}>
            <RatingStars
              value={filters.minRating}
              onChange={(v) => updateFilter('minRating', v)}
            />
          </FilterSection>

          {/* Availability */}
          <FilterSection title="Availability" icon={Package}>
            <div className="pf-radio-list">
              {[
                { value: 'all', label: 'All Products' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ].map(opt => (
                <label key={opt.value} className="pf-radio-item">
                  <div className={`pf-radio ${filters.availability === opt.value ? 'active' : ''}`}>
                    {filters.availability === opt.value && <div className="pf-radio-dot" />}
                  </div>
                  <span>{opt.label}</span>
                  <input
                    type="radio"
                    name="availability"
                    value={opt.value}
                    checked={filters.availability === opt.value}
                    onChange={() => updateFilter('availability', opt.value)}
                    hidden
                  />
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Delivery Time */}
          <FilterSection title="Delivery Time" icon={Truck}>
            <div className="pf-chip-grid">
              {[
                { value: 'all', label: 'Any' },
                { value: 'same_day', label: 'Same Day' },
                { value: '1_2_days', label: '1-2 Days' },
                { value: '3_5_days', label: '3-5 Days' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`pf-chip ${filters.deliveryTime === opt.value ? 'active' : ''}`}
                  onClick={() => updateFilter('deliveryTime', opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Nearby Sellers (Distance) */}
          <FilterSection title="Nearby Sellers" icon={MapPin}>
            <div className="pf-distance">
              <div className="pf-distance-value">
                <MapPin size={14} className="pf-distance-icon" />
                <span>Within <strong>{filters.maxDistance} km</strong></span>
              </div>
              <input
                type="range"
                className="pf-range-slider"
                min={1}
                max={10}
                step={0.5}
                value={filters.maxDistance}
                onChange={(e) => updateFilter('maxDistance', Number(e.target.value))}
              />
              <div className="pf-range-labels">
                <span>1 km</span>
                <span>10 km</span>
              </div>
            </div>
          </FilterSection>
        </div>

        {/* Mobile Apply Button */}
        <div className="pf-footer">
          <button className="pf-apply-btn" onClick={onClose}>
            Apply Filters
            {activeFilterCount > 0 && <span className="pf-apply-count">({activeFilterCount})</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
