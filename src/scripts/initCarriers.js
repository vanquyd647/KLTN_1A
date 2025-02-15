// scripts/initCarriers.js
const { Carrier } = require('../models');

const carriers = [
    {
        name: 'Giao hàng tiêu chuẩn',
        description: 'Giao hàng tiêu chuẩn',
        contact_email: '',
        contact_phone: '19006192',
        website: '',
        price: 2000,
        status: 'active',
    },
    {
        name: 'Miễn phí vận chuyển',
        description: 'Miễn phí vận chuyển',
        contact_email: '',
        contact_phone: '',
        price: 0,
        website: '',
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
