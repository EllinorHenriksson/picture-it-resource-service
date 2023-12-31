/**
 * Mongoose model Image.
 *
 * @author Ellinor Henriksson
 * @version 2.0.0
 */

import mongoose from 'mongoose'
import validator from 'validator'

const { isURL } = validator

// Create a schema.
const schema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required.'],
    validate: [isURL, 'Please provide a valid URL to the image.']
  },
  imageId: {
    type: String,
    required: [true, 'Image ID is required.']
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  owner: {
    type: String,
    required: [true, 'Owner is required.']
  }
},
{
  timestamps: true,
  toJSON: {
    /**
     * Performs a transformation of the resulting object to remove sensitive information.
     *
     * @param {object} doc - The mongoose document which is being converted.
     * @param {object} ret - The plain object representation which has been converted.
     */
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
      delete ret.imageId
      delete ret.owner
    },
    virtuals: true // ensure virtual fields are serialized
  }
})

schema.virtual('id').get(function () {
  return this._id.toHexString()
})

// Create a model using the schema.
export const Image = mongoose.model('Image', schema)
