"use strict";

const colorService = require('../services/colorService');

const getColors = async (req, res) => {
    try {
        const colors = await colorService.getAllColors();
        return res.status(200).json({
            status: 'success',
            code: 200,
            message: 'Lấy danh sách màu sắc thành công',
            data: colors,
        });
    } catch (error) {
        console.error('Error fetching colors:', error);
        return res.status(500).json({
            status: 'error',
            code: 500,
            message: 'Lỗi máy chủ, không thể lấy danh sách màu sắc',
            error: error.message,
        });
    }
};

module.exports = {
    getColors,
};
