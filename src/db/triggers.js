// db/triggers.js
const { sequelize } = require('../models');
const logger = require('../configs/winston');

// db/triggers.js
const createRevenueTrigger = async () => {
    try {
        await sequelize.query('DROP TRIGGER IF EXISTS after_payment_update;');

        await sequelize.query(`
            CREATE TRIGGER after_payment_update
            AFTER UPDATE ON payments
            FOR EACH ROW
            BEGIN
                DECLARE order_status VARCHAR(20);
                
                SELECT status INTO order_status
                FROM orders 
                WHERE id = NEW.order_id;

                IF NEW.payment_status = 'paid' 
                   AND OLD.payment_status != 'paid'
                   AND order_status = 'completed' THEN
                    
                    INSERT INTO revenues (
                        order_id,
                        amount,
                        payment_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        NEW.order_id,
                        NEW.payment_amount,
                        NEW.id,
                        NOW(),
                        NOW()
                    )
                    ON DUPLICATE KEY UPDATE
                        amount = NEW.payment_amount,
                        updated_at = NOW();
                END IF;
            END;
        `);

        logger.info('✅ Revenue trigger created successfully');
    } catch (error) {
        logger.error('❌ Error creating revenue trigger:', error);
        throw error;
    }
};


// Hàm kiểm tra trigger
const checkTrigger = async () => {
    try {
        const [results] = await sequelize.query(`
            SHOW TRIGGERS WHERE \`Table\` = 'Payments';
        `);
        logger.info('📋 Existing triggers:', results);
        return results;
    } catch (error) {
        logger.error('❌ Error checking triggers:', error);
        throw error;
    }
};

// Hàm xóa trigger
const dropTrigger = async () => {
    try {
        await sequelize.query('DROP TRIGGER IF EXISTS after_payment_update;');
        logger.info('🗑️ Trigger dropped successfully');
    } catch (error) {
        logger.error('❌ Error dropping trigger:', error);
        throw error;
    }
};

module.exports = {
    createRevenueTrigger,
    checkTrigger,
    dropTrigger
};
