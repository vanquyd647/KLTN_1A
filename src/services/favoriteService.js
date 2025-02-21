const { Favorite, Product, Color, Size, Category, ProductStock } = require('../models');
const { Op } = require('sequelize');

class FavoriteService {
    /**
     * Tạo điều kiện tìm kiếm dựa trên userId hoặc sectionId
     */
    _createWhereCondition(userId, sectionId) {
        if (userId) {
            return { user_id: userId };
        }
        if (sectionId) {
            return { section_id: sectionId };
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

            // Tìm favorite hiện có (nếu có)
            const existingFavorite = await Favorite.findOne({
                where: {
                    product_id: productId,
                    ...(userId ? { user_id: userId } : { section_id: sectionId })
                }
            });

            if (existingFavorite) {
                throw new Error('Sản phẩm đã có trong danh sách yêu thích');
            }

            // Tạo và trả về favorite mới
            return await Favorite.create({
                user_id: userId,
                section_id: sectionId,
                product_id: productId,
                created_at: new Date()
            });
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
                where: { section_id: sectionId }
            });
    
            // Nếu không có favorites nào từ section
            if (!sectionFavorites || sectionFavorites.length === 0) {
                throw new Error('Không có sản phẩm yêu thích nào để chuyển');
            }
    
            let transferredCount = 0;
            let deletedCount = 0;
    
            // Chuyển từng favorite
            for (const favorite of sectionFavorites) {
                const [newFavorite, created] = await Favorite.findOrCreate({
                    where: {
                        user_id: userId,
                        product_id: favorite.product_id
                    },
                    defaults: {
                        user_id: userId,
                        section_id: null,
                        product_id: favorite.product_id,
                        created_at: favorite.created_at
                    }
                });
    
                if (created) {
                    transferredCount++;
                }
            }
    
            // Xóa favorites của section và đếm số bản ghi bị xóa
            deletedCount = await Favorite.destroy({
                where: { section_id: sectionId }
            });
    
            // Nếu không có bản ghi nào được chuyển hoặc xóa
            if (transferredCount === 0 && deletedCount === 0) {
                throw new Error('Không có thay đổi nào được thực hiện');
            }
    
            return {
                transferred: transferredCount,
                deleted: deletedCount
            };
        } catch (error) {
            throw error;
        }
    }
    
}

module.exports = new FavoriteService();
