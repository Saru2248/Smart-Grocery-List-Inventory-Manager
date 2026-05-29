const mongoose = require('mongoose');
const GroceryItem = require('../models/GroceryItem');

// @desc    Get all grocery items (with search, category, and status filtering)
// @route   GET /api/groceries
// @access  Private
const getItems = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = { user: req.user.id };

    // Apply search filter (case-insensitive)
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Apply category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Apply status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    const items = await GroceryItem.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a grocery item
// @route   POST /api/groceries
// @access  Private
const addItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, minStock, expiryDate } = req.body;

    if (!name || !category || quantity === undefined || !unit || minStock === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const item = new GroceryItem({
      user: req.user.id,
      name,
      category,
      quantity,
      unit,
      minStock,
      expiryDate: expiryDate || null,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a grocery item
// @route   PUT /api/groceries/:id
// @access  Private
const updateItem = async (req, res) => {
  try {
    const { name, category, quantity, unit, minStock, expiryDate } = req.body;

    let item = await GroceryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    // Make sure user owns item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    item.name = name || item.name;
    item.category = category || item.category;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.unit = unit || item.unit;
    item.minStock = minStock !== undefined ? minStock : item.minStock;
    item.expiryDate = expiryDate !== undefined ? (expiryDate || null) : item.expiryDate;

    // save() triggers the pre-save hook to recalculate status
    await item.save();

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a grocery item
// @route   DELETE /api/groceries/:id
// @access  Private
const deleteItem = async (req, res) => {
  try {
    const item = await GroceryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    // Make sure user owns item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Quick update item quantity (increment or decrement)
// @route   PATCH /api/groceries/:id/quantity
// @access  Private
const updateQuantity = async (req, res) => {
  try {
    const { change } = req.body; // e.g., +1 or -1

    if (change === undefined || typeof change !== 'number') {
      return res.status(400).json({ success: false, message: 'Please provide a valid change value' });
    }

    let item = await GroceryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }

    // Make sure user owns item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    // Update quantity (ensure it doesn't go below 0)
    item.quantity = Math.max(0, item.quantity + change);

    // save() recalculates status automatically
    await item.save();

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics & summaries
// @route   GET /api/groceries/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get basic status counts
    const totalItems = await GroceryItem.countDocuments({ user: userId });
    const inStockItems = await GroceryItem.countDocuments({ user: userId, status: 'in-stock' });
    const lowStockItems = await GroceryItem.countDocuments({ user: userId, status: 'low-stock' });
    const outOfStockItems = await GroceryItem.countDocuments({ user: userId, status: 'out-of-stock' });
    const expiredItems = await GroceryItem.countDocuments({ user: userId, status: 'expired' });

    // Category breakdown aggregation
    const categoryBreakdown = await GroceryItem.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Items expiring soon (next 7 days)
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const expiringSoon = await GroceryItem.find({
      user: userId,
      expiryDate: {
        $gte: today,
        $lte: next7Days,
      },
      status: { $ne: 'expired' }, // only show upcoming, not already expired
    }).sort({ expiryDate: 1 });

    // Recent items added
    const recentItems = await GroceryItem.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalItems,
          inStock: inStockItems,
          lowStock: lowStockItems,
          outOfStock: outOfStockItems,
          expired: expiredItems,
        },
        categoryBreakdown,
        expiringSoon,
        recentItems,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  updateQuantity,
  getDashboardSummary,
};
