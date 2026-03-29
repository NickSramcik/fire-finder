class FireCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttl = 300000) {
        // 5 minutes default
        this.cache.set(key, {
            value,
            expiry: Date.now() + ttl,
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    // Accepts a string key or a RegExp to delete all matching keys
    delete(key) {
        if (key instanceof RegExp) {
            for (const k of this.cache.keys()) {
                if (key.test(k)) this.cache.delete(k);
            }
        } else {
            this.cache.delete(key);
        }
    }
}

export const cache = new FireCache();
