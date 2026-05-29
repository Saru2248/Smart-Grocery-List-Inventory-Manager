const mongoose = require('mongoose');

const GroceryItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide the item name'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Fruits & Vegetables',
      'Dairy & Eggs',
      'Bakery & Bread',
      'Grains & Pasta',
      'Meat & Seafood',
      'Beverages',
      'Pantry Staples',
      'Snacks & Sweets',
      'Household & Cleaning',
      'Other',
    ],
    default: 'Other',
  },
  quantity: {
    type: Number,
    required: [true, 'Please enter quantity'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  unit: {
    type: String,
    required: [true, 'Please select a unit of measurement'],
    enum: ['pcs', 'kg', 'g', 'L', 'ml', 'packs', 'bottles', 'cans', 'loaves', 'dozens'],
    default: 'pcs',
  },
  minStock: {
    type: Number,
    required: [true, 'Please enter minimum stock level for alert'],
    min: [0, 'Minimum stock cannot be negative'],
    default: 2,
  },
  expiryDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock', 'expired'],
    default: 'in-stock',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically calculate status on save
GroceryItemSchema.pre('save', function (next) {
  const now = new Date();
  
  if (this.expiryDate && new Date(this.expiryDate) < now) {
    this.status = 'expired';
  } else if (this.quantity === 0) {
    this.status = 'out-of-stock';
  } else if (this.quantity <= this.minStock) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  next();
});

module.exports = mongoose.model('GroceryItem', GroceryItemSchema);
