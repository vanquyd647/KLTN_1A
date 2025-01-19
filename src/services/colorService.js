const { Color } = require('../models');

const getAllColors = async () => {
    try {
        const colors = await Color.findAll({
            attributes: ['id', 'color', 'hex_code'], // Select specific fields
        });
        return colors;
    } catch (error) {
        console.error('Error fetching colors:', error);
        throw new Error('Unable to fetch colors');
    }
};

module.exports = {
    getAllColors,
};
