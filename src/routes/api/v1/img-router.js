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

    const publicKey = Buffer.from(process.env.PUBLIC_KEY, 'base64')

    const payload = jwt.verify(token, publicKey)

    req.user = payload.sub

    next()
  } catch (err) {
    const error = createError(401, 'Access token invalid or not provided.')
    error.cause = err
    next(error)
  }
}

/**
 * Authorize requests.
 *
 * If authorization is successful, that is the user is granted access
 * to the requested resource, the request is authorized to continue.
 * If authentication fails, a forbidden response will be sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const hasPermission = (req, res, next) => {
  if (req.user === req.image.owner) {
    next()
  } else {
    next(createError(403, 'Permission to the requested resource was denied.'))
  }
}

// Provide req.image to the route if :id is present in the route path.
router.param('id', (req, res, next, id) => controller.loadImage(req, res, next, id))

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
  hasPermission,
  (req, res, next) => controller.readImages(req, res, next)
)

router.put('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.updateImagePut(req, res, next)
)

router.patch('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.updateImagePatch(req, res, next)
)

router.delete('/:id',
  authenticateJWT,
  hasPermission,
  (req, res, next) => controller.deleteImage(req, res, next)
)
