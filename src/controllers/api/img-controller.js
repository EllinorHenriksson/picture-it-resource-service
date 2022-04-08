/**
 * Module for the ImgController.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import createError from 'http-errors'
import fetch from 'node-fetch'
import validator from 'validator'

import { Image } from '../../models/image.js'

const { isBase64 } = validator

const URL_IMAGE_SERVER = 'https://courselab.lnu.se/picture-it/images/api/v1/images/'

/**
 * Encapsulates a controller.
 */
export class ImgController {
  /**
   * Alters an image object by removing the properties imageId and owner.
   *
   * @param {object} image The original image object.
   * @returns {object} The altered image object.
   */
  #alterImage (image) {
    delete image.imageId
    delete image.owner
    return image
  }

  /**
   * Validates the data in the request body.
   *
   * @param {object} req - Express request object.
   * @param {Function} next - Express next middleware function.
   */
  #validateData (req, next) {
    if (!req.body) {
      next(createError(400), 'No body content provided.')
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.body.data || !req.body.contentType) {
        next(createError(400, 'Data and/or content type not provided.'))
      } else if (!isBase64(req.body.data)) {
        next(createError(400, 'The provided data must be base64 endoded.'))
      } else if (req.body.contentType !== 'image/gif' && req.body.contentType !== 'image/jpeg' && req.body.contentType !== 'image/png') {
        next(createError(400, 'The provided content type is not valid.'))
      }
    }

    if (req.method === 'PATCH') {
      if (!req.body.data && !req.body.contentType && !req.body.description && req.body.location) {
        next(createError(400, 'None of the requested data is provided.'))
      } else if (req.body.data && !isBase64(req.body.data)) {
        next(createError(400, 'The provided data must be base64 endoded.'))
      } else if (req.body.contentType && (req.body.contentType !== 'image/gif' && req.body.contentType !== 'image/jpeg' && req.body.contentType !== 'image/png')) {
        next(createError(400, 'The provided content type is not valid.'))
      }
    }
  }

  /**
   * Sends a request to the image server and returns the response.
   *
   * @param {object} req - Express request object.
   * @returns {Promise} - A promise that will resolve to a response object.
   */
  async #contactImageServer (req) {
    // Create an options object for the request.
    const options = {
      method: req.method,
      headers: {
        'X-API-Private-Token': process.env.ACCESS_TOKEN_IMAGE_API
      }
    }

    // Create a body object for the request.
    const body = {}
    if (req.body?.data) {
      body.data = req.body.data
    }
    if (req.body?.contentType) {
      body.contentType = req.body.contentType
    }

    // If the body object is not empty...
    if (Object.keys(body).length) {
      // ...add it to a body property of the options object.
      options.body = JSON.stringify(body)
    }

    // Send request to image server and return response.
    return fetch(URL_IMAGE_SERVER + req.image.imageId, options)
  }

  /**
   * Provide req.image to the route if :id is present.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   * @param {string} id - The ID of the image to load.
   */
  async loadImage (req, res, next, id) {
    try {
      const image = await Image.findById(id)

      if (!image) {
        next(createError(404, 'The requested resource was not found.'))
      }

      req.image = image

      next()
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response with all images.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async readImages (req, res, next) {
    try {
      const images = await Image.find({ owner: req.user })

      const alteredImages = images.map(img => {
        return this.#alterImage(img)
      })

      res.status(200).json(alteredImages)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response with all images.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async createImage (req, res, next) {
    try {
      // Validate body content.
      this.#validateData(req, next)

      // Contact image server.
      const resImageServer = await this.#contactImageServer(req)

      // Save response body as an object.
      const resBodyImageServer = await resImageServer.json()

      // If image successfully created at image server...
      if (resImageServer.status === 201) {
        // ...save image in resource database.
        const image = new Image({
          imageUrl: resBodyImageServer.imageUrl,
          imageId: resBodyImageServer.id,
          description: req.body.description,
          location: req.body.location,
          owner: req.user
        })

        await image.save()

        // Create body for response to client.
        const resBodyClient = {
          imageUrl: image.imageUrl,
          contentType: resBodyImageServer.contentType,
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
          id: image.id
        }

        // Send response to client.
        res.status(201).json(resBodyClient)
      } else if (resImageServer.status >= 400) {
        console.error(
          'Status: ' + resBodyImageServer.status_code +
          '\nMessage: ' + resBodyImageServer.message
        )

        next(createError(500))
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sends a JSON response with the requested image.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  readImage (req, res, next) {
    const alteredImage = this.#alterImage(req.image)
    res.status(200).json(alteredImage)
  }

  /**
   * Completely updates a specific image.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async updateImagePut (req, res, next) {
    try {
      // Validate body content.
      this.#validateData(req, next)

      // Contact image server.
      const resImageServer = await this.#contactImageServer(req)

      // If image successfully updated at image server...
      if (resImageServer.status === 204) {
        // ...update image in resource database.
        req.image.description = req.body.description
        req.image.location = req.body.location
        await req.image.save()

        // Send response to client.
        res.status(204)
      } else if (resImageServer.status >= 400) {
        const resBodyImageServer = await resImageServer.json()
        console.error(
          'Status: ' + resBodyImageServer.status_code +
          '\nMessage: ' + resBodyImageServer.message
        )

        next(createError(500))
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Partially updates a specific image.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async updateImagePatch (req, res, next) {
    try {
      // Validate body content.
      this.#validateData(req, next)

      let updated = false

      // Update image server if data or content type is provided.
      if (req.body.data || req.body.contentType) {
        // Contact image server.
        const resImageServer = await this.#contactImageServer(req)

        // If image successfully updated at image server...
        if (resImageServer.status === 204) {
          updated = true
        } else if (resImageServer.status >= 400) {
          const resBodyImageServer = await resImageServer.json()
          console.error(
            'Status: ' + resBodyImageServer.status_code +
            '\nMessage: ' + resBodyImageServer.message
          )
          next(createError(500))
        }
      }

      // Update image if description or location is provided.
      if (req.body.description || req.body.location) {
        if (req.body.description) {
          req.image.description = req.body.description
        }
        if (req.body.location) {
          req.image.location = req.body.location
        }
        await req.image.save()
        updated = true
      }

      if (updated) {
        res.status(204)
      } else {
        next(createError(400))
      }
    } catch (error) {
      next(error)
    }
  }

  /**
   * Deletes a specific image.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async deleteImage (req, res, next) {
    try {
      // Fetch
    } catch (error) {
      
    }
  }
}
