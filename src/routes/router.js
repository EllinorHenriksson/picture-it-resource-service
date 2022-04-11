/**
 * The routes.
 *
 * @author Ellinor Henriksson
 * @version 1.0.0
 */

import express from 'express'
import createError from 'http-errors'
import { router as imgRouter } from './api/v1/img-router.js'

export const router = express.Router()

router.use('/images', imgRouter)

router.use('*', (req, res, next) => next(createError(404)))
