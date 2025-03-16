const { Favorite, Product, Color, Size, Category, ProductStock } = require('../models');
const { Op } = require('sequelize');

class FavoriteService {
    /**
     * Tạo điều kiện tìm kiếm dựa trên userId hoặc sectionId
     */
    _createWhereCondition(userId, sectionId) {
        if (userId) {
            // Nếu có userId, chỉ lấy các bản ghi của user và không có section_id
            return { 
                user_id: userId,
                section_id: null 
            };
        }
        if (sectionId) {
            // Nếu có sectionId, chỉ lấy các bản ghi của session và không có user_id
            return { 
                section_id: sectionId,
                user_id: null
            };
        }
        throw new Error('Yêu cầu userId hoặc sectionId');
    }
    

    /**
     * Thêm sản phẩm vào danh sách yêu thích
     */
    async addToFavorite(productId, { userId = null, sectionId = null }) {
        try {
            // Kiểm tra sản phẩm tồn tại
            const product = await Product.findByPk(productId);
            if (!product) {
                throw new Error('Sản phẩm không tồn tại');
            }
    
            // Tạo điều kiện tìm kiếm
            let whereCondition = {
                product_id: productId
            };
    
            if (userId) {
                // Nếu có userId, tìm trong các bản ghi của user (không có section_id)
                whereCondition.user_id = userId;
                whereCondition.section_id = null;
            } else if (sectionId) {
                // Nếu có sectionId, tìm trong các bản ghi của session (không có user_id)
                whereCondition.section_id = sectionId;
                whereCondition.user_id = null;
            }
    
            // Tìm favorite hiện có
            const existingFavorite = await Favorite.findOne({
                where: whereCondition
            });
    
            if (existingFavorite) {
                throw new Error('Sản phẩm đã có trong danh sách yêu thích');
            }
    
            // Tạo favorite mới
            const newFavorite = {
                product_id: productId,
                created_at: new Date()
            };
    
            if (userId) {
                newFavorite.user_id = userId;
                newFavorite.section_id = null;
            } else if (sectionId) {
                newFavorite.section_id = sectionId;
                newFavorite.user_id = null;
            }
    
            // Tạo và trả về favorite mới
            return await Favorite.create(newFavorite);
        } catch (error) {
            throw error;
        }
    }
    

    /**
     * Lấy danh sách yêu thích có phân trang
     */
    async getFavorites({ userId = null, sectionId = null }, query = {}) {
        try {
            const whereCondition = this._createWhereCondition(userId, sectionId);
            const { page = 1, limit = 10 } = query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Favorite.findAndCountAll({
                distinct: true,
                where: whereCondition,
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: [
                        'id', 'product_name', 'slug', 'description',
                        'price', 'discount_price', 'is_new',
                        'is_featured', 'status'
                    ],
                    include: [
                        {
                            model: Category,
                            as: 'categories',
                            attributes: ['id', 'name'],
                            through: { attributes: [] },
                        },
                        {
                            model: Color,
                            as: 'productColors',
                            attributes: ['id', 'color', 'hex_code'],
                            through: { attributes: ['image'] },
                        },
                        {
                            model: Size,
                            as: 'productSizes',
                            attributes: ['id', 'size'],
                            through: { attributes: [] },
                        }
                    ]
                }],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            return {
                favorites: rows,
                pagination: {
                    total: count,
                    currentPage: parseInt(page),
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa sản phẩm khỏi danh sách yêu thích
     */
    async removeFromFavorite(productId, { userId = null, sectionId = null }) {
        try {
            const whereCondition = this._createWhereCondition(userId, sectionId);
            const result = await Favorite.destroy({
                where: {
                    ...whereCondition,
                    product_id: productId
                }
            });

            if (!result) {
                throw new Error('Không tìm thấy sản phẩm trong danh sách yêu thích');
            }

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích không
     */
    async checkIsFavorited(productId, { userId = null, sectionId = null }) {
        try {
            const whereCondition = this._createWhereCondition(userId, sectionId);
            const favorite = await Favorite.findOne({
                where: {
                    ...whereCondition,
                    product_id: productId
                }
            });
            return !!favorite;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Chuyển danh sách yêu thích từ section sang user
     */
    async transferFavoritesFromSectionToUser(sectionId, userId) {
        try {
            // Kiểm tra favorites của section có tồn tại không
            const sectionFavorites = await Favorite.findAll({
                where: { 
                    section_id: sectionId,
                    // Chỉ lấy những bản ghi không có user_id
                    user_id: null
                }
            });
    
            if (!sectionFavorites || sectionFavorites.length === 0) {
                // Cập nhật các bản ghi có cả user_id và section_id
                const updatedCount = await Favorite.update(
                    { section_id: null },
                    {
                        where: {
                            user_id: userId,
                            section_id: sectionId
                        }
                    }
                );
    
                if (updatedCount[0] === 0) {
                    throw new Error('Không có sản phẩm yêu thích nào để chuyển');
                }
    
                return {
                    transferred: 0,
                    updated: updatedCount[0],
                    deleted: 0
                };
            }
    
            let transferredCount = 0;
            let deletedCount = 0;
    
            // Chuyển từng favorite
            for (const favorite of sectionFavorites) {
                // Kiểm tra xem đã có favorite với user_id và product_id này chưa
                const existingUserFavorite = await Favorite.findOne({
                    where: {
                        user_id: userId,
                        product_id: favorite.product_id,
                        section_id: null
                    }
                });
    
                if (existingUserFavorite) {
                    // Nếu favorite đã tồn tại với user_id, xóa bản ghi session
                    await Favorite.destroy({
                        where: {
                            id: favorite.id
                        }
                    });
                    deletedCount++;
                } else {
                    // Cập nhật bản ghi hiện tại
                    await Favorite.update(
                        {
                            user_id: userId,
                            section_id: null
                        },
                        {
                            where: {
                                id: favorite.id
                            }
                        }
                    );
                    transferredCount++;
                }
            }
    
            // Cập nhật các bản ghi có cả user_id và section_id
            const updatedCount = await Favorite.update(
                { section_id: null },
                {
                    where: {
                        user_id: userId,
                        section_id: sectionId
                    }
                }
            );
    
            return {
                transferred: transferredCount,
                updated: updatedCount[0],
                deleted: deletedCount
            };
        } catch (error) {
            throw error;
        }
    }
    
    
}

module.exports = new FavoriteService();
