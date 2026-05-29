import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Package, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Plus,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.getDashboard();
        setData(res.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading your inventory metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertTriangle size={48} className="text-danger" />
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  const { stats, categoryBreakdown, expiringSoon, recentItems } = data;

  // Find max category count to compute bar chart percentages
  const maxCategoryCount = categoryBreakdown.length > 0 
    ? Math.max(...categoryBreakdown.map(c => c.count)) 
    : 0;

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Metric Cards Row */}
      <section className="metrics-grid">
        <div className="metric-card card-total">
          <div className="card-icon">
            <Package size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Total Items</span>
            <h3 className="card-value">{stats.total}</h3>
          </div>
        </div>

        <div className="metric-card card-success">
          <div className="card-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">In Stock</span>
            <h3 className="card-value">{stats.inStock}</h3>
          </div>
        </div>

        <div className="metric-card card-warning">
          <div className="card-icon">
            <TrendingDown size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Low Stock</span>
            <h3 className="card-value">{stats.lowStock}</h3>
          </div>
        </div>

        <div className="metric-card card-danger">
          <div className="card-icon">
            <XCircle size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Out of Stock</span>
            <h3 className="card-value">{stats.outOfStock}</h3>
          </div>
        </div>

        <div className="metric-card card-expired">
          <div className="card-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="card-info">
            <span className="card-label">Expired Items</span>
            <h3 className="card-value">{stats.expired}</h3>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="dashboard-grid">
        {/* Left Side: Alerts and Expirations */}
        <div className="dashboard-left">
          {/* Expiring Soon Card */}
          <div className="dashboard-panel panel-expiring">
            <div className="panel-header">
              <div className="header-title-wrapper">
                <Calendar size={18} className="text-expired" />
                <h3>Expiring in next 7 Days</h3>
              </div>
              <span className="badge badge-danger-light">{expiringSoon.length} alerts</span>
            </div>
            
            <div className="panel-body">
              {expiringSoon.length === 0 ? (
                <div className="empty-panel-state">
                  <CheckCircle2 className="text-success" size={32} />
                  <p>Great! No items are expiring in the next 7 days.</p>
                </div>
              ) : (
                <div className="alert-list">
                  {expiringSoon.map((item) => (
                    <div className="alert-item" key={item._id}>
                      <div className="alert-item-info">
                        <span className="alert-item-name">{item.name}</span>
                        <span className="alert-item-details">
                          Category: {item.category} | Qty: {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="alert-item-date text-danger">
                        Exp: {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Checklist Card */}
          <div className="dashboard-panel panel-lowstock">
            <div className="panel-header">
              <div className="header-title-wrapper">
                <TrendingDown size={18} className="text-warning" />
                <h3>Low Stock Checklist</h3>
              </div>
              <Link to="/shopping-list" className="link-action">
                <span>View Shopping List</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="panel-body">
              {stats.lowStock === 0 && stats.outOfStock === 0 ? (
                <div className="empty-panel-state">
                  <CheckCircle2 className="text-success" size={32} />
                  <p>Awesome! All items are fully stocked.</p>
                </div>
              ) : (
                <div className="quick-checklist">
                  <p className="checklist-sub">These items are running low. Tap to navigate and restock.</p>
                  <div className="checklist-items">
                    {recentItems.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').slice(0, 4).map(item => (
                      <div key={item._id} className="checklist-row" onClick={() => navigate('/inventory')}>
                        <span className="checklist-dot" />
                        <span className="checklist-name">{item.name}</span>
                        <span className="badge badge-warning-light">
                          {item.quantity} {item.unit} (Min: {item.minStock})
                        </span>
                      </div>
                    ))}
                    {recentItems.filter(item => item.status === 'low-stock' || item.status === 'out-of-stock').length === 0 && (
                      <p className="no-items-sub">Navigate to Inventory to view all low-stock items.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Charts and Recents */}
        <div className="dashboard-right">
          {/* Category Breakdown Panel */}
          <div className="dashboard-panel panel-chart">
            <div className="panel-header">
              <h3>Category Stock Distribution</h3>
            </div>
            
            <div className="panel-body">
              {categoryBreakdown.length === 0 ? (
                <div className="empty-panel-state">
                  <Package size={32} />
                  <p>No inventory items registered yet.</p>
                  <Link to="/inventory" className="btn btn-primary btn-sm">
                    <Plus size={16} /> Add First Item
                  </Link>
                </div>
              ) : (
                <div className="bar-chart">
                  {categoryBreakdown.map((cat) => {
                    const percentage = maxCategoryCount > 0 
                      ? (cat.count / maxCategoryCount) * 100 
                      : 0;
                    return (
                      <div className="chart-row" key={cat._id}>
                        <div className="chart-label-col">
                          <span className="chart-category-title">{cat._id}</span>
                        </div>
                        <div className="chart-bar-col">
                          <div className="chart-bar-bg">
                            <div 
                              className="chart-bar-fill" 
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="chart-value-overlay">{cat.count}</span>
                            </div>
                          </div>
                        </div>
                        <div className="chart-total-col">
                          <span className="chart-total-qty">
                            {cat.totalQuantity} units
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Additions Panel */}
          <div className="dashboard-panel panel-recent">
            <div className="panel-header">
              <h3>Recently Added</h3>
              <Link to="/inventory" className="link-action">
                <span>Manage All</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="panel-body">
              {recentItems.length === 0 ? (
                <div className="empty-panel-state">
                  <p>Your grocery stock is empty.</p>
                </div>
              ) : (
                <div className="recent-list">
                  {recentItems.map((item) => (
                    <div className="recent-item" key={item._id}>
                      <div className="recent-item-left">
                        <span className="recent-item-name">{item.name}</span>
                        <span className="recent-item-cat">{item.category}</span>
                      </div>
                      <div className="recent-item-right">
                        <span className="recent-item-qty">
                          {item.quantity} {item.unit}
                        </span>
                        <span className={`status-pill ${item.status}`}>
                          {item.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
