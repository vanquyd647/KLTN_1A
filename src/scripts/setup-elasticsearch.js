"use strict";

const elasticClient = require('../configs/elasticsearch');
const { Product, Color } = require('../models');
const logger = require('../configs/winston');

const ELASTICSEARCH_ERRORS = {
    TIMEOUT: 'ETIMEDOUT',
    CONNECTION_REFUSED: 'ECONNREFUSED',
    NO_LIVING_CONNECTIONS: 'No Living connections'
};

async function checkConnection() {
    let isConnected = false;
    const maxAttempts = 10;
    let attempts = 0;

    while (!isConnected && attempts < maxAttempts) {
        try {
            const health = await elasticClient.cluster.health();
            isConnected = health.status === 'green' || health.status === 'yellow';
            if (isConnected) {
                logger.info(`✅ Elasticsearch đã kết nối - status: ${health.status}`);
                logger.info(`Số lần thử: ${attempts + 1}`);
            }
        } catch (error) {
            attempts++;
            logger.warn(`Đang chờ Elasticsearch... (${attempts}/${maxAttempts})`);
            if (attempts === maxAttempts) {
                throw new Error('Không thể kết nối đến Elasticsearch');
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function setupIndex() {
    try {
        // Kiểm tra và xóa index cũ nếu tồn tại
        const indexExists = await elasticClient.indices.exists({
            index: 'products'
        });

        if (indexExists) {
            await elasticClient.indices.delete({ index: 'products' });
            logger.info('Đã xóa index products cũ');
        }

        // Tạo index mới với cấu hình nâng cao
        await elasticClient.indices.create({
            index: 'products',
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 0,
                    analysis: {
                        analyzer: {
                            vietnamese_analyzer: {
                                type: 'custom',
                                tokenizer: 'standard',
                                char_filter: [
                                    "html_strip"
                                ],
                                filter: [
                                    'lowercase',
                                    'ascii_folding',
                                    'word_delimiter',
                                    'trim',
                                    'unique',
                                    'stop'
                                ]
                            }
                        },
                        filter: {
                            ascii_folding: {
                                type: 'asciifolding',
                                preserve_original: true
                            },
                            word_delimiter: {
                                type: 'word_delimiter_graph',
                                generate_word_parts: true,
                                generate_number_parts: true,
                                catenate_words: true,
                                split_on_case_change: true,
                                preserve_original: true
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        id: { type: 'keyword' },
                        product_name: {
                            type: 'text',
                            analyzer: 'vietnamese_analyzer',
                            fields: {
                                keyword: { 
                                    type: 'keyword',
                                    ignore_above: 256
                                },
                                search: {
                                    type: 'text',
                                    analyzer: 'vietnamese_analyzer',
                                    term_vector: 'with_positions_offsets'
                                }
                            }
                        },
                        productColors: {
                            type: 'nested',
                            properties: {
                                id: { type: 'keyword' },
                                color: {
                                    type: 'text',
                                    analyzer: 'vietnamese_analyzer',
                                    fields: {
                                        keyword: { 
                                            type: 'keyword',
                                            ignore_above: 256
                                        },
                                        search: {
                                            type: 'text',
                                            analyzer: 'vietnamese_analyzer',
                                            term_vector: 'with_positions_offsets'
                                        }
                                    }
                                },
                                hex_code: { type: 'keyword' }
                            }
                        },
                        status: { type: 'keyword' },
                        created_at: { type: 'date' },
                        updated_at: { type: 'date' }
                    }
                }
            }
        });
        logger.info('✅ Đã tạo index products mới với cấu hình nâng cao');
    } catch (error) {
        logger.error('Lỗi khi tạo index:', error);
        throw error;
    }
}

async function indexData() {
    try {
        const products = await Product.findAll({
            include: [{
                model: Color,
                as: 'productColors',
                attributes: ['id', 'color', 'hex_code'],
                through: { attributes: [] }
            }],
            where: { status: 'available' }
        });

        if (products.length === 0) {
            logger.warn('Không có sản phẩm để index');
            return;
        }

        const operations = products.flatMap(product => [
            { index: { _index: 'products' } },
            {
                id: product.id,
                product_name: product.product_name,
                productColors: product.productColors.map(color => ({
                    id: color.id,
                    color: color.color,
                    hex_code: color.hex_code
                })),
                status: product.status,
                created_at: product.created_at,
                updated_at: product.updated_at
            }
        ]);

        const { errors, items } = await elasticClient.bulk({
            refresh: true,
            operations
        });

        if (errors) {
            const failedItems = items.filter(item => item.index.error);
            logger.error('Lỗi khi index một số items:', failedItems);
            throw new Error('Có lỗi xảy ra khi bulk index dữ liệu');
        }

        logger.info(`✅ Đã index thành công ${products.length} sản phẩm`);
    } catch (error) {
        logger.error('Lỗi khi index dữ liệu:', error);
        throw error;
    }
}

module.exports = async function setup() {
    try {
        await checkConnection();
        await setupIndex();
        await indexData();
        logger.info('✅ Setup Elasticsearch hoàn tất');
    } catch (error) {
        logger.error('❌ Lỗi setup Elasticsearch:', error);
        throw error;
    }
};
