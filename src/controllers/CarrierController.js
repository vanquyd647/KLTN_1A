// controllers/CarrierController.js
const CarrierService = require('../services/carrierService');
const logger = require('../configs/winston');

class CarrierController {
    async create(req, res) {
        try {
            const carrier = await CarrierService.create(req.body);
            return res.status(201).json({
                code: 201,
                success: true,
                data: carrier
            });
        } catch (error) {
            logger.error('Error creating carrier:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }

    async getAll(req, res) {
        try {
            const carriers = await CarrierService.findAll(req.query);
            return res.json({
                code: 200,
                success: true,
                data: carriers
            });
        } catch (error) {
            logger.error('Error getting carriers:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const carrier = await CarrierService.findById(req.params.id);
            if (!carrier) {
                return res.status(404).json({
                    code: 404,
                    success: false,
                    message: 'Carrier not found'
                });
            }
            return res.json({
                code: 200,
                success: true,
                data: carrier
            });
        } catch (error) {
            logger.error('Error getting carrier:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const carrier = await CarrierService.update(req.params.id, req.body);
            return res.json({
                code: 200,
                success: true,
                data: carrier
            });
        } catch (error) {
            logger.error('Error updating carrier:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            await CarrierService.delete(req.params.id);
            return res.json({
                code: 200,
                success: true,
                message: 'Carrier deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting carrier:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const carrier = await CarrierService.updateStatus(
                req.params.id,
                req.body.status
            );
            return res.json({
                code: 200,
                success: true,
                data: carrier
            });
        } catch (error) {
            logger.error('Error updating carrier status:', error);
            return res.status(500).json({
                code: 500,
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new CarrierController();
