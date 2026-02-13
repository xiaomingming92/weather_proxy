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

// 删除天气缓存数据（支持按时间删除，不传则全删）
router.delete('/weather-cache', async (req, res) => {
  try {
    const { before } = req.query;
    let beforeTimestamp: bigint | undefined;

    if (before) {
      let beforeTime: Date;
      const beforeStr = before as string;

      // 1. 尝试解析为纯数字时间戳（毫秒）
      const timestamp = parseInt(beforeStr, 10);
      if (!isNaN(timestamp) && beforeStr.match(/^\d+$/)) {
        beforeTime = new Date(timestamp);
      }
      // 2. 尝试解析为 ISO 格式（带时区，如 2026-02-12T10:00:00.000Z）
      else if (beforeStr.match(/T/) || beforeStr.match(/Z$/)) {
        beforeTime = new Date(beforeStr);
      }
      // 3. 尝试解析为本地时间格式（YYYY-MM-DD hh:mm:ss，默认 UTC+8）
      else {
        // 将本地时间（UTC+8）转换为 UTC 时间
        const localDate = new Date(beforeStr.replace(' ', 'T'));
        if (isNaN(localDate.getTime())) {
          res.status(400).json({
            status: 'error',
            message:
              'Invalid before parameter. Use timestamp (ms), ISO date string (with timezone), or local time (YYYY-MM-DD hh:mm:ss, UTC+8)',
          });
          return;
        }
        // 减去 8 小时，将 UTC+8 转换为 UTC
        beforeTime = new Date(localDate.getTime() - 8 * 60 * 60 * 1000);
      }

      if (isNaN(beforeTime.getTime())) {
        res.status(400).json({
          status: 'error',
          message:
            'Invalid before parameter. Use timestamp (ms), ISO date string (with timezone), or local time (YYYY-MM-DD hh:mm:ss, UTC+8)',
        });
        return;
      }
      beforeTimestamp = BigInt(beforeTime.getTime());
    }

    const result = await prismaCache.clearWeatherData(beforeTimestamp);
    res.json({
      status: 'ok',
      message: beforeTimestamp
        ? `Deleted ${result.deletedCount} weather data records before ${before}`
        : `Deleted all ${result.deletedCount} weather data records`,
      data: result,
    });
  } catch (error) {
    console.error('Error clearing weather cache:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear weather cache',
    });
  }
});

export default router;
