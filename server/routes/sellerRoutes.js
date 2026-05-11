import express from 'express';
import Seller from '../models/Seller.js';

const router = express.Router();

// @route GET /api/sellers/nearby
// @desc Get nearby sellers based on lat, lng and radius
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5, query = '' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and Longitude are required' });
  }

  try {
    // MongoDB geospatial query
    const sellers = await Seller.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // radius in meters
        }
      },
      // Filter by product query if provided
      ...(query && {
        'products.name': { $regex: query, $options: 'i' }
      }),
      // Only show sellers with products in stock (as requested)
      'products.inStock': true
    });

    // Post-processing to compare prices if needed or sort
    res.json(sellers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route POST /api/sellers
// @desc Create a new seller (for testing)
router.post('/', async (req, res) => {
  try {
    const newSeller = new Seller(req.body);
    const seller = await newSeller.save();
    res.status(201).json(seller);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
