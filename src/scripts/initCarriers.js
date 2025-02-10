// scripts/initCarriers.js
const { Carrier } = require('../models');

const carriers = [
    {
        name: 'GHTK',
        description: 'Giao hàng tiết kiệm',
        contact_email: 'support@ghtk.vn',
        contact_phone: '19006192',
        website: 'https://giaohangtietkiem.vn',
        status: 'active',
    },
    {
        name: 'GHN',
        description: 'Giao hàng nhanh',
        contact_email: 'cskh@ghn.vn',
        contact_phone: '18006328',
        website: 'https://ghn.vn',
        status: 'active',
    }
];

const initCarriers = async () => {
    try {
        for (const carrier of carriers) {
            const [carrierInstance, created] = await Carrier.findOrCreate({
                where: { name: carrier.name },
                defaults: carrier,
            });

            if (created) {
                console.log(`Carrier '${carrier.name}' created.`);
            } else {
                console.log(`Carrier '${carrier.name}' already exists.`);
            }
        }
    } catch (error) {
        console.error('Error initializing carriers:', error);
    }
};

module.exports = initCarriers;
