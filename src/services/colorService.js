/**
 * @file Provides functions to manage colors in the database.
 */

const { Color } = require('../models');

/**
 * Retrieves all available colors with their respective attributes.
 * 
 * @async
 * @function getAllColors
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of color objects, each containing `id`, `color`, and `hex_code`.
 * @throws {Error} Throws an error if retrieving colors fails.
 * 
 * @example
 * getAllColors()
 *  .then(colors => console.log(colors))
 *  .catch(error => console.error(error));
 */
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
