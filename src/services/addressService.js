const { Address } = require('../models');

class AddressService {
    // Lấy tất cả địa chỉ của user
    async getAddressesByUserId(userId) {
        return await Address.findAll({
            where: { user_id: userId },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });
    }

    // Tạo địa chỉ mới
    async createAddress(addressData) {
        // Nếu đánh dấu là địa chỉ mặc định, cập nhật các địa chỉ khác thành không mặc định
        if (addressData.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: addressData.user_id } }
            );
        }
        return await Address.create(addressData);
    }

    // Cập nhật địa chỉ
    async updateAddress(addressId, userId, updateData) {
        // Nếu đánh dấu là địa chỉ mặc định, cập nhật các địa chỉ khác thành không mặc định
        if (updateData.is_default) {
            await Address.update(
                { is_default: false },
                { where: { user_id: userId } }
            );
        }

        const [updatedRows] = await Address.update(updateData, {
            where: { id: addressId, user_id: userId }
        });

        if (updatedRows === 0) {
            throw new Error('Địa chỉ không tồn tại hoặc không thuộc về người dùng này');
        }

        return await Address.findByPk(addressId);
    }

    // Xóa địa chỉ
    async deleteAddress(addressId, userId) {
        const address = await Address.findOne({
            where: { id: addressId, user_id: userId }
        });

        if (!address) {
            throw new Error('Địa chỉ không tồn tại hoặc không thuộc về người dùng này');
        }

        // Không cho phép xóa địa chỉ mặc định
        if (address.is_default) {
            throw new Error('Không thể xóa địa chỉ mặc định');
        }

        await address.destroy();
        return true;
    }

    // Đặt địa chỉ mặc định
    async setDefaultAddress(addressId, userId) {
        // Cập nhật tất cả địa chỉ thành không mặc định
        await Address.update(
            { is_default: false },
            { where: { user_id: userId } }
        );

        // Đặt địa chỉ được chọn thành mặc định
        const [updatedRows] = await Address.update(
            { is_default: true },
            { where: { id: addressId, user_id: userId } }
        );

        if (updatedRows === 0) {
            throw new Error('Địa chỉ không tồn tại hoặc không thuộc về người dùng này');
        }

        return await Address.findByPk(addressId);
    }
}

module.exports = new AddressService();
