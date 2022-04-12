/**
 * API version 1 routes.
 *
 * @author Ellinor Henriksson
 * @version 2.0.0
 */

import express from 'express'
import { router as imgRouter } from './img-router.js'

export const router = express.Router()

router.use('/images', imgRouter)
