/**
 * Image routes.
 *
 * @author Ellinor Henriksson
 * @version 2.0.0
 */

import createError from 'http-errors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { ImgController } from '../../../controllers/api/img-controller.js'

export const router = express.Router()

const controller = new ImgController()

/**
 * Authenticates requests.
 *
 * If authentication is successful, `req.user`is populated and the
 * request is authorized to continue.
 * If authentication fails, an unauthorized response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const authenticateJWT = (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    const publicKey = Buffer.from(process.env.ACCESS_TOKEN_SECRET, 'base64')

    const payload = jwt.verify(token, publicKey)

    // OBS! Kolla om det verkligen behövs att user sparas på req
    req.user = {
      username: payload.sub,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      permissionLevel: payload.x_permission_level
    }

    next()
  } catch (err) {
    const error = createError(401, 'Access token invalid or not provided.')
    error.cause = err
    next(error)
  }
}

router.get('/',
  authenticateJWT,
  (req, res, next) => controller.readImages(req, res, next)
)

router.post('/',
  authenticateJWT,
  (req, res, next) => controller.createImage(req, res, next)
)

router.get('/:id',
  authenticateJWT,
  (req, res, next) => controller.readImage(req, res, next)
)

router.put('/:id',
  authenticateJWT,
  (req, res, next) => controller.updateImagePut(req, res, next)
)

router.patch('/:id',
  authenticateJWT,
  (req, res, next) => controller.updateImagePatch(req, res, next)
)

router.delete('/:id',
  authenticateJWT,
  (req, res, next) => controller.deleteImage(req, res, next)
)
