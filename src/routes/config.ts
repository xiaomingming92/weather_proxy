import express from 'express';
import prismaCache from '../services/prisma-cache.js';

const router = express.Router();

// 获取所有缓存配置
router.get('/cache', async (req, res) => {
  try {
    // 获取所有缓存配置项
    const configs = await prismaCache.getAllCacheConfigs();
    res.json({
      status: 'ok',
      data: configs,
    });
  } catch (error) {
    console.error('Error getting cache configs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cache configs',
    });
  }
});

// 获取单个缓存配置
router.get('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const config = await prismaCache.getCacheConfig(key);

    if (config) {
      res.json({
        status: 'ok',
        data: config,
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Cache config not found',
      });
    }
  } catch (error) {
    console.error('Error getting cache config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cache config',
    });
  }
});

// 更新缓存配置
router.put('/cache/:key', async (req, res): Promise<void> => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required field: value',
      });
      return;
    }

    const config = await prismaCache.setCacheConfig(key, value, description);
    res.json({
      status: 'ok',
      data: config,
    });
  } catch (error) {
    console.error('Error updating cache config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cache config',
    });
  }
});

// 创建缓存配置
router.post('/cache', async (req, res): Promise<void> => {
  try {
    const { key, value, description } = req.body;

    if (!key || !value) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: key and value',
      });
      return;
    }

    const config = await prismaCache.setCacheConfig(key, value, description);
    res.json({
      status: 'ok',
      data: config,
    });
  } catch (error) {
    console.error('Error creating cache config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create cache config',
    });
  }
});

// 删除缓存配置
router.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    await prismaCache.deleteCacheConfig(key);
    res.json({
      status: 'ok',
      message: 'Cache config deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting cache config:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete cache config',
    });
  }
});

export default router;
