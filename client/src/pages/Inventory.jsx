import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ChevronDown, 
  AlertTriangle, 
  Calendar,
  Layers,
  ArrowUpDown,
  Package
} from 'lucide-react';

const CATEGORIES = [
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Grains & Pasta',
  'Meat & Seafood',
  'Beverages',
  'Pantry Staples',
  'Snacks & Sweets',
  'Household & Cleaning',
  'Other'
];

const UNITS = ['pcs', 'kg', 'g', 'L', 'ml', 'packs', 'bottles', 'cans', 'loaves', 'dozens'];

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [minStock, setMinStock] = useState(2);
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch items
  const fetchItems = async () => {
    try {
      const res = await api.getItems({
        search,
        category: categoryFilter,
        status: statusFilter
      });
      setItems(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory items');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search, categoryFilter, statusFilter]);

  // Handle quick quantity changes (+1 or -1)
  const handleQuantityChange = async (id, change, currentQty) => {
    if (currentQty + change < 0) return;
    try {
      const res = await api.updateQuantity(id, change);
      // Update local state without fetching all items again for better performance
      setItems(items.map(item => item._id === id ? res.data : item));
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Open modal for adding
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setName('');
    setCategory('Fruits & Vegetables');
    setQuantity(1);
    setUnit('pcs');
    setMinStock(2);
    setExpiryDate('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (item) => {
    setModalMode('edit');
    setEditingId(item._id);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setUnit(item.unit);
    setMinStock(item.minStock);
    // Format date to YYYY-MM-DD for date input
    const formattedDate = item.expiryDate 
      ? new Date(item.expiryDate).toISOString().split('T')[0] 
      : '';
    setExpiryDate(formattedDate);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !category || quantity === undefined || !unit || minStock === undefined) {
      setFormError('Please fill in all required fields');
      return;
    }

    const payload = {
      name,
      category,
      quantity: Number(quantity),
      unit,
      minStock: Number(minStock),
      expiryDate: expiryDate || null
    };

    try {
      if (modalMode === 'add') {
        await api.addItem(payload);
      } else {
        await api.updateItem(editingId, payload);
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(err.message || 'Failed to save item');
    }
  };

  // Handle deletion
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this grocery item?')) {
      try {
        await api.deleteItem(id);
        setItems(items.filter(item => item._id !== id));
      } catch (err) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="inventory-view animate-fade-in">
      {/* Search & Actions Bar */}
      <section className="search-filter-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search groceries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {/* Category Filter */}
          <div className="select-wrapper">
            <Filter size={14} className="filter-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown size={14} className="chevron-icon" />
          </div>

          {/* Status Filter */}
          <div className="select-wrapper">
            <Layers size={14} className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown size={14} className="chevron-icon" />
          </div>
        </div>

        <button onClick={handleOpenAddModal} className="btn btn-primary btn-add">
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </section>

      {/* Main Inventory Table/Cards */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} className="text-muted" />
          <h3>No Groceries Found</h3>
          <p>Try resetting your filters or add a new item to get started.</p>
          <button onClick={handleOpenAddModal} className="btn btn-primary mt-4">
            <Plus size={16} /> Add First Item
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th className="text-center">Stock Level</th>
                <th className="text-center">Min. Alert Threshold</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={`table-row-${item.status}`}>
                  <td className="item-name-cell">
                    <span className="font-semibold">{item.name}</span>
                  </td>
                  <td>
                    <span className="category-pill">{item.category}</span>
                  </td>
                  <td>
                    <div className="qty-control">
                      <button 
                        onClick={() => handleQuantityChange(item._id, -1, item.quantity)}
                        className="qty-btn"
                        disabled={item.quantity <= 0}
                      >
                        -
                      </button>
                      <span className="qty-value">
                        {item.quantity} <span className="unit-label">{item.unit}</span>
                      </span>
                      <button 
                        onClick={() => handleQuantityChange(item._id, 1, item.quantity)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-center font-medium">
                    {item.minStock} {item.unit}
                  </td>
                  <td>
                    {item.expiryDate ? (
                      <span className={`expiry-date-cell ${item.status === 'expired' ? 'expired-text' : ''}`}>
                        <Calendar size={14} />
                        {new Date(item.expiryDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${item.status}`}>
                      {item.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleOpenEditModal(item)}
                        className="action-btn btn-edit"
                        title="Edit Item"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="action-btn btn-delete"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-in">
            <div className="modal-header">
              <h3>{modalMode === 'add' ? 'Add New Grocery Item' : 'Edit Grocery Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">&times;</button>
            </div>

            {formError && (
              <div className="alert alert-error mx-6 mt-4">
                <AlertTriangle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label htmlFor="itemName">Item Name *</label>
                  <input
                    type="text"
                    id="itemName"
                    placeholder="e.g. Organic Milk, Whole Bread"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="itemCategory">Category *</label>
                  <select
                    id="itemCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="itemUnit">Unit of Measure *</label>
                  <select
                    id="itemUnit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="itemQty">Initial Quantity *</label>
                  <input
                    type="number"
                    id="itemQty"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="itemMin">Min. Level (For Alert) *</label>
                  <input
                    type="number"
                    id="itemMin"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-span-2">
                  <label htmlFor="itemExpiry">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    id="itemExpiry"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
