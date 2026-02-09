import NodeCache from 'node-cache';
import { config } from '../config/index.js';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({ stdTTL: config.cache.ttl });
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || config.cache.ttl);
  }

  delete(key: string): void {
    this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }
}

export default new CacheService();
