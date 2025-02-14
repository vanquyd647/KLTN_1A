const express = require('express');
const { getColors } = require('../controllers/colorController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Colors
 *   description: API for managing colors
 */

/**
 * @swagger
 * /v1/api/colors:
 *   get:
 *     summary: Get all colors
 *     tags: [Colors]
 *     responses:
 *       200:
 *         description: Colors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách màu sắc thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get('/', getColors);

module.exports = router;
