import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// Validation for creating a listing
const createSchema = Joi.object({
  title: Joi.string().required(),

  description: Joi.string().allow(''),

  price: Joi.number().min(0).required(),

  category: Joi.string()
    .valid(
      'textbooks',
      'electronics',
      'furniture',
      'clothing',
      'other'
    ),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn'),

  status: Joi.string()
    .valid('active', 'sold', 'removed'),

  seller: Joi.string()
    .hex()
    .length(24)
});

// Validation for updating a listing
const updateSchema = Joi.object({
  title: Joi.string(),

  description: Joi.string().allow(''),

  price: Joi.number().min(0),

  category: Joi.string()
    .valid(
      'textbooks',
      'electronics',
      'furniture',
      'clothing',
      'other'
    ),

  condition: Joi.string()
    .valid('new', 'like-new', 'used', 'worn'),

  status: Joi.string()
    .valid('active', 'sold', 'removed'),

  seller: Joi.string()
    .hex()
    .length(24)
});

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';

    const filter = includeRemoved
      ? {}
      : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json(listings);
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found'
      });
    }

    // Don't show removed listings unless explicitly requested
    if (
      listing.status === 'removed' &&
      req.query.includeRemoved !== 'true'
    ) {
      return res.status(404).json({
        error: 'Listing not found'
      });
    }

    return res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    const listing = await Listing.create(value);

    return res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      {
        new: true,
        runValidators: true
      }
    );

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found'
      });
    }

    return res.status(200).json(listing);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: 'removed' },
      {
        new: true,
        runValidators: true
      }
    );

    if (!listing) {
      return res.status(404).json({
        error: 'Listing not found'
      });
    }

    return res.status(200).json({
      message: 'Listing removed successfully',
      listing
    });
  } catch (err) {
    next(err);
  }
}