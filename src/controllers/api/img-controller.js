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

/**
 * Encapsulates a controller.
 */
export class ImgController {
  /**
   * Validates the data in the request body.
   *
   * @param {object} req - Express request object.
   * @param {Function} next - Express next middleware function.
   */
  #validateData (req, next) {
    if (!req.data || !req.contentType) {
      next(createError(400, 'Data and/or content type not provided.'))
    } else if (!isBase64(req.data)) {
      next(createError(400, 'The provided data must be base64 endoded.'))
    } else if (req.contentType !== 'image/gif' && req.contentType !== 'image/jpeg' && req.contentType !== 'image/png') {
      next(createError(400, 'The provided content type is not valid.'))
    }
  }

  /**
   * Sends a request to the image server and returns the response.
   *
   * @param {object} req - Express request object.
   * @param {string} method - The request method.
   * @returns {Promise} - A promise that will resolve to a response object.
   */
  async #contactImageServer (req, method) {
    // Create body for request to image server.
    const reqBodyImageServer = {
      data: req.data,
      contentType: req.contentType
    }

    // Send request to image server and return response.
    return fetch('https://courselab.lnu.se/picture-it/images/api/v1/images', {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Private-Token': process.env.ACCESS_TOKEN_IMAGE_API
      },
      body: JSON.stringify(reqBodyImageServer)
    })
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

      res.status(200).json(images)
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
      const resImageServer = await this.#contactImageServer(req, 'post')

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
    res.status(200).json(req.image)
  }
}
