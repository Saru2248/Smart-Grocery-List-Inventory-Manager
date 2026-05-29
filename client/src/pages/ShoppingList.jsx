import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShoppingCart, 
  Check, 
  RefreshCcw, 
  Printer, 
  Plus, 
  Trash2, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

const ShoppingList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For checked/purchased status in local session
  const [checkedItems, setCheckedItems] = useState({});
  // Custom manual items to buy (in addition to auto-generated low-stock list)
  const [customItems, setCustomItems] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [customUnit, setCustomUnit] = useState('pcs');

  const fetchLowStockItems = async () => {
    try {
      const res = await api.getItems();
      // Filter for items that are low-stock or out-of-stock
      const lowStock = res.data.filter(
        item => item.status === 'low-stock' || item.status === 'out-of-stock'
      );
      setItems(lowStock);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch low-stock list');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  // Toggle checkbox state
  const handleToggleCheck = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // restock item: sets quantity = minStock * 2 + 1 to move it back to 'in-stock'
  const handleRestock = async (id, minStock, unit) => {
    try {
      const targetQty = (minStock * 2) || 5;
      const res = await api.updateItem(id, {
        quantity: targetQty
      });
      // Remove item from shopping list since it's now in-stock
      setItems(items.filter(item => item._id !== id));
      // Clean checked state
      const updatedChecked = { ...checkedItems };
      delete updatedChecked[id];
      setCheckedItems(updatedChecked);
    } catch (err) {
      alert(err.message || 'Failed to restock item');
    }
  };

  // Add custom temporary shopping items
  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customName) return;

    const newItem = {
      id: 'custom-' + Date.now(),
      name: customName,
      quantity: customQty || '1',
      unit: customUnit,
      isCustom: true
    };

    setCustomItems([...customItems, newItem]);
    setCustomName('');
    setCustomQty('');
    setCustomUnit('pcs');
  };

  // Remove custom items
  const handleRemoveCustom = (id) => {
    setCustomItems(customItems.filter(item => item.id !== id));
  };

  // Print shopping list
  const handlePrint = () => {
    window.print();
  };

  const totalToBuy = items.length + customItems.length;
  const totalChecked = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="shopping-list-view animate-fade-in">
      {/* Header Info */}
      <section className="shopping-summary-bar print-hide">
        <div className="summary-info">
          <ShoppingCart size={24} className="text-primary" />
          <div>
            <h3>Automated Shopping Checklist</h3>
            <p>Generated from {items.length} low-stock/out-of-stock items, plus {customItems.length} manual entries.</p>
          </div>
        </div>

        <div className="summary-actions">
          <button onClick={handlePrint} className="btn btn-secondary flex items-center gap-2">
            <Printer size={16} />
            <span>Print List</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Checklist & Custom Adder */}
      <div className="shopping-grid">
        {/* Left Side: Generated & Custom Shopping Lists */}
        <div className="shopping-main-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Generating list...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : totalToBuy === 0 ? (
            <div className="empty-shopping-state">
              <Check className="check-success" size={48} />
              <h3>All Stocked Up!</h3>
              <p>You don't have any low-stock items in your pantry. Use the side panel to add custom reminders if needed.</p>
            </div>
          ) : (
            <div className="shopping-card-wrapper">
              <div className="list-progress-bar print-hide">
                <div className="progress-labels">
                  <span>Shopping Progress</span>
                  <span>{totalChecked} of {totalToBuy} items checked</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(totalChecked / totalToBuy) * 100}%` }}
                  />
                </div>
              </div>

              {/* Auto Generated Section */}
              {items.length > 0 && (
                <div className="shopping-section">
                  <h4 className="section-title">Auto-Generated Alerts ({items.length})</h4>
                  <div className="shopping-items-list">
                    {items.map((item) => {
                      const isChecked = !!checkedItems[item._id];
                      return (
                        <div key={item._id} className={`shopping-row ${isChecked ? 'checked' : ''}`}>
                          <div className="shopping-checkbox-col">
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => handleToggleCheck(item._id)} 
                              />
                              <span className="checkmark"></span>
                            </label>
                          </div>
                          
                          <div className="shopping-details-col">
                            <span className="shopping-item-name">{item.name}</span>
                            <span className="shopping-item-meta">
                              Category: {item.category} | Current Stock: {item.quantity} {item.unit} (Min: {item.minStock})
                            </span>
                          </div>

                          <div className="shopping-status-col print-hide">
                            <span className={`status-pill ${item.status}`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>

                          <div className="shopping-actions-col print-hide">
                            <button 
                              onClick={() => handleRestock(item._id, item.minStock, item.unit)}
                              className="btn btn-sm btn-success-light flex items-center gap-1"
                              title="Restock to inventory"
                            >
                              <RefreshCcw size={14} />
                              <span>Restock</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Manual Items Section */}
              {customItems.length > 0 && (
                <div className="shopping-section">
                  <h4 className="section-title">Manual Entries ({customItems.length})</h4>
                  <div className="shopping-items-list">
                    {customItems.map((item) => {
                      const isChecked = !!checkedItems[item.id];
                      return (
                        <div key={item.id} className={`shopping-row ${isChecked ? 'checked' : ''}`}>
                          <div className="shopping-checkbox-col">
                            <label className="checkbox-container">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => handleToggleCheck(item.id)} 
                              />
                              <span className="checkmark"></span>
                            </label>
                          </div>

                          <div className="shopping-details-col">
                            <span className="shopping-item-name">{item.name}</span>
                            <span className="shopping-item-meta">
                              To Buy: {item.quantity} {item.unit}
                            </span>
                          </div>

                          <div className="shopping-status-col print-hide">
                            <span className="status-pill status-custom">custom</span>
                          </div>

                          <div className="shopping-actions-col print-hide">
                            <button 
                              onClick={() => handleRemoveCustom(item.id)}
                              className="action-btn btn-delete"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Quick Add Form */}
        <div className="shopping-sidebar print-hide">
          <div className="shopping-panel">
            <div className="panel-header">
              <ClipboardList size={18} />
              <h3>Add Shopping Reminders</h3>
            </div>
            <div className="panel-body">
              <p className="panel-instruction">
                Need to buy other items not currently in your system? Write them here.
              </p>
              
              <form onSubmit={handleAddCustom} className="shopping-side-form">
                <div className="form-group">
                  <label htmlFor="customName">Item Name</label>
                  <input
                    type="text"
                    id="customName"
                    placeholder="e.g. Tomatoes, Napkins"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="customQty">Quantity</label>
                    <input
                      type="number"
                      id="customQty"
                      min="1"
                      placeholder="1"
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customUnit">Unit</label>
                    <select
                      id="customUnit"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="packs">packs</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  <Plus size={16} />
                  <span>Add Reminder</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
