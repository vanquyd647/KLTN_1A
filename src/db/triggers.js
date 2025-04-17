// db/triggers.js
const { sequelize } = require('../models');
const logger = require('../configs/winston');

// db/triggers.js
const createRevenueTrigger = async () => {
    try {
        await sequelize.query('DROP TRIGGER IF EXISTS after_payment_update;');
        await sequelize.query('DROP TRIGGER IF EXISTS after_order_update;');

        // Trigger khi order được update
        await sequelize.query(`
            CREATE TRIGGER after_order_update
            AFTER UPDATE ON orders
            FOR EACH ROW
            BEGIN
                DECLARE payment_exists INT;
                DECLARE payment_amount DECIMAL(10,2);
                DECLARE payment_id BIGINT;
                DECLARE revenue_exists INT;

                -- Kiểm tra xem có payment nào đã paid chưa
                SELECT p.id, p.payment_amount, COUNT(*)
                INTO payment_id, payment_amount, payment_exists
                FROM payments p
                WHERE p.order_id = NEW.id 
                AND p.payment_status = 'paid'
                LIMIT 1;

                -- Kiểm tra xem đã tồn tại trong revenues chưa
                SELECT COUNT(*)
                INTO revenue_exists
                FROM revenues
                WHERE order_id = NEW.id 
                AND payment_id = payment_id;

                -- Nếu order chuyển sang completed và có payment đã paid và chưa có trong revenues
                IF NEW.status = 'completed' 
                   AND OLD.status != 'completed'
                   AND payment_exists > 0 
                   AND revenue_exists = 0 THEN
                    
                    INSERT INTO revenues (
                        order_id,
                        amount,
                        payment_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        NEW.id,
                        payment_amount,
                        payment_id,
                        NOW(),
                        NOW()
                    );
                END IF;
            END;
        `);

        // Trigger khi payment được update
        await sequelize.query(`
            CREATE TRIGGER after_payment_update
            AFTER UPDATE ON payments
            FOR EACH ROW
            BEGIN
                DECLARE order_status VARCHAR(20);
                DECLARE revenue_exists INT;
                
                -- Lấy status của order
                SELECT status INTO order_status
                FROM orders 
                WHERE id = NEW.order_id;

                -- Kiểm tra xem đã tồn tại trong revenues chưa
                SELECT COUNT(*)
                INTO revenue_exists
                FROM revenues
                WHERE order_id = NEW.order_id 
                AND payment_id = NEW.id;

                -- Nếu payment chuyển sang paid và order đã completed và chưa có trong revenues
                IF NEW.payment_status = 'paid' 
                   AND OLD.payment_status != 'paid'
                   AND order_status = 'completed' 
                   AND revenue_exists = 0 THEN
                    
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
                    );
                END IF;
            END;
        `);

        logger.info('✅ Revenue triggers created successfully');
    } catch (error) {
        logger.error('❌ Error creating revenue triggers:', error);
        throw error;
    }
};

// Cập nhật hàm check trigger
const checkTrigger = async () => {
    try {
        const [results] = await sequelize.query(`
            SHOW TRIGGERS WHERE \`Table\` IN ('payments', 'orders');
        `);
        logger.info('📋 Existing triggers:', results);
        return results;
    } catch (error) {
        logger.error('❌ Error checking triggers:', error);
        throw error;
    }
};

// Cập nhật hàm drop trigger
const dropTrigger = async () => {
    try {
        await sequelize.query('DROP TRIGGER IF EXISTS after_payment_update;');
        await sequelize.query('DROP TRIGGER IF EXISTS after_order_update;');
        logger.info('🗑️ Triggers dropped successfully');
    } catch (error) {
        logger.error('❌ Error dropping triggers:', error);
        throw error;
    }
};

module.exports = {
    createRevenueTrigger,
    checkTrigger,
    dropTrigger
};
