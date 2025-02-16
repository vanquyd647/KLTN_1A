const AddressService = require('../services/addressService');

const addressController = {
    // Lấy danh sách địa chỉ
    async getAddresses(req, res) {
        try {
            const addresses = await AddressService.getAddressesByUserId(req.userId);

            res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Lấy danh sách địa chỉ thành công',
                data: addresses
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                code: 500,
                message: error.message,
                data: null
            });
        }
    },

    // Thêm địa chỉ mới
    async createAddress(req, res) {
        try {
            const addressData = {
                user_id: req.userId,
                street: req.body.street,
                ward: req.body.ward,
                district: req.body.district,
                city: req.body.city,
                country: req.body.country || 'Vietnam',
                address_type: req.body.address_type,
                is_default: req.body.is_default || false
            };

            const newAddress = await AddressService.createAddress(addressData);

            res.status(201).json({
                status: 'success',
                code: 201,
                message: 'Thêm địa chỉ mới thành công',
                data: newAddress
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                code: 400,
                message: error.message,
                data: null
            });
        }
    },

    // Cập nhật địa chỉ
    async updateAddress(req, res) {
        try {
            const { addressId } = req.params;
            const updatedAddress = await AddressService.updateAddress(
                addressId,
                req.userId,
                req.body
            );

            res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Cập nhật địa chỉ thành công',
                data: updatedAddress
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                code: 400,
                message: error.message,
                data: null
            });
        }
    },

    // Xóa địa chỉ
    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;
            await AddressService.deleteAddress(addressId, req.userId);

            res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Xóa địa chỉ thành công',
                data: null
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                code: 400,
                message: error.message,
                data: null
            });
        }
    },

    // Đặt địa chỉ mặc định
    async setDefaultAddress(req, res) {
        try {
            const { addressId } = req.params;
            const updatedAddress = await AddressService.setDefaultAddress(addressId, req.userId);

            res.status(200).json({
                status: 'success',
                code: 200,
                message: 'Đặt địa chỉ mặc định thành công',
                data: updatedAddress
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                code: 400,
                message: error.message,
                data: null
            });
        }
    }
};

module.exports = addressController;
