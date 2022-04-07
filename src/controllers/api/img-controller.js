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
const { isMimeType } = validator

/**
 * Encapsulates a controller.
 */
export class ImgController {
  /**
   * Sends a JSON response with all images.
   *
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {Function} next - Express next middleware function.
   */
  async readImage (req, res, next) {
    try {
      const images = await Image.find()

      res.json(images)
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
      /* OBS! The payload in the request:
      "data": "CP4ACwgcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQyoEQFKkRpIlTV5Em...",
      "contentType": "image/gif",
      "description": "The mighty monkey!",
      "location": "56.660213604736484, 16.35623696306458"
      */

      // Fetch: POST image data to image service, save the response (the image URL)
      if (!req.data || !req.contentType) {
        next(createError(400, 'Data and/or content type not provided.'))
      } else if (!isBase64(req.data)) {
        next(createError(400, 'The provided data must be base64 endoded.'))
      } else if (!isMimeType(req.contentType)) {
        next(createError(400, 'The provided content type is not valid.'))
      }

      // OBS! Kolla vad som ska vara med i bodyn som skickas med POST till image service
      const body = {
        data: req.data
      }

      const response = await fetch('https://courselab.lnu.se/picture-it/images/api/v1/', {
        method: 'post',
        body: JSON.stringify(body),
        // OBS! Kolla vad som ska stå i content-type headern
        // headers: {'Content-Type': 'application/json'}
        headers: { 'Content-Type': req.contentType }
      })

      // Kolla hur response-bodyn ser ut, använd image URL till att skapa Image nedan

      const task = new Image({
        imageUrl: undefined,
        description: req.body.description,
        location: req.body.location
      })

      await task.save()

      const location = new URL(
        `${req.protocol}://${req.get('host')}${req.baseUrl}/${task._id}`
      )

      res
        .location(location.href)
        .status(201)
        .json(task)
    } catch (error) {
      next(error)
    }
  }
}
