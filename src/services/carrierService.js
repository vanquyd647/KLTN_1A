// services/CarrierService.js
const { Carrier } = require('../models');

class CarrierService {
    async create(data) {
        return await Carrier.create(data);
    }

    async findAll(query = {}) {
        const { page = 1, limit = 10, status } = query;
        const where = {};
        
        if (status) {
            where.status = status;
        }

        return await Carrier.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: (page - 1) * limit,
            order: [['created_at', 'DESC']]
        });
    }

    async findById(id) {
        return await Carrier.findByPk(id);
    }

    async update(id, data) {
        const carrier = await Carrier.findByPk(id);
        if (!carrier) throw new Error('Carrier not found');
        return await carrier.update(data);
    }

    async delete(id) {
        const carrier = await Carrier.findByPk(id);
        if (!carrier) throw new Error('Carrier not found');
        return await carrier.destroy();
    }

    async updateStatus(id, status) {
        const carrier = await Carrier.findByPk(id);
        if (!carrier) throw new Error('Carrier not found');
        return await carrier.update({ status });
    }
}

module.exports = new CarrierService();
