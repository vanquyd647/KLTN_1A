const FavoriteService = require('../services/favoriteService');

const addToFavorite = async (req, res) => {
    try {
        const { productId } = req.params;
        const favorite = await FavoriteService.addToFavorite(productId, {
            userId: req.userId, 
            sectionId: req.sessionId
        });

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Đã thêm vào danh sách yêu thích',
            data: favorite
        });
    } catch (error) {
        return res.status(400).json({
            code: 400,
            status: 'error',
            message: error.message
        });
    }
};

const getFavorites = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        const result = await FavoriteService.getFavorites({
            userId: req.userId,
            sectionId: req.sessionId
        }, { page, limit });

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Lấy danh sách yêu thích thành công',
            data: result.favorites,
            pagination: result.pagination
        });
    } catch (error) {
        return res.status(400).json({
            code: 400,
            status: 'error',
            message: error.message
        });
    }
};

const removeFromFavorite = async (req, res) => {
    try {
        const { productId } = req.params;
        await FavoriteService.removeFromFavorite(productId, {
            userId: req.userId,
            sectionId: req.sessionId
        });

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Đã xóa khỏi danh sách yêu thích'
        });
    } catch (error) {
        return res.status(400).json({
            code: 400,
            status: 'error',
            message: error.message
        });
    }
};

const checkFavoriteStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const isFavorited = await FavoriteService.checkIsFavorited(productId, {
            userId: req.userId,
            sectionId: req.sessionId
        });

        return res.status(200).json({
            code: 200,
            status: 'success',
            data: { isFavorited }
        });
    } catch (error) {
        return res.status(400).json({
            code: 400,
            status: 'error',
            message: error.message
        });
    }
};

const transferFavorites = async (req, res) => {
    try {
        if (!req.userId) {
            throw new Error('Bạn cần đăng nhập để thực hiện chức năng này');
        }

        const result = await FavoriteService.transferFavoritesFromSectionToUser(
            req.sessionId,
            req.userId
        );

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: `Đã chuyển ${result.transferred} sản phẩm và xóa ${result.deleted} sản phẩm từ session`,
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            code: 400,
            status: 'error',
            message: error.message
        });
    }
};


module.exports = {
    addToFavorite,
    getFavorites,
    removeFromFavorite,
    checkFavoriteStatus,
    transferFavorites
};
