// scripts/initRoles.js
const { Role } = require('../models');

const roles = [
    { role_name: 'customer', description: 'Regular customer role' },
    { role_name: 'admin', description: 'Administrator with management access' },
    { role_name: 'superadmin', description: 'Super administrator with full access' },
];

const initRoles = async () => {
    try {
        for (const role of roles) {
            const [roleInstance, created] = await Role.findOrCreate({
                where: { role_name: role.role_name },
                defaults: role,
            });

            if (created) {
                console.log(`Role '${role.role_name}' created.`);
            } else {
                console.log(`Role '${role.role_name}' already exists.`);
            }
        }
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
};

module.exports = initRoles;
