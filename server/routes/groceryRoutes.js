const express = require('express');
const router = express.Router();
const {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  updateQuantity,
  getDashboardSummary,
} = require('../controllers/groceryController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

router.get('/', getItems);
router.post('/', addItem);
router.get('/dashboard', getDashboardSummary);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.patch('/:id/quantity', updateQuantity);

module.exports = router;
