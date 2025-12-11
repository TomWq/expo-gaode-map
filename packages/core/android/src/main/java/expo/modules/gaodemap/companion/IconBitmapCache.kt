package expo.modules.gaodemap.companion

import android.graphics.Bitmap
import android.util.LruCache

/**
 * 简单的 Bitmap LRU 缓存。
 * key 的格式使用： "<fingerprint>|<width>x<height>"
 */
object IconBitmapCache {
    private val maxMemoryKb = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    // 使用 1/8 可用内存作为缓存容积（可按需调整）
    private val cacheSizeKb = maxMemoryKb / 8

    private val cache = object : LruCache<String, Bitmap>(cacheSizeKb) {
        override fun sizeOf(key: String, value: Bitmap): Int {
            // 以 KB 为单位
            return value.byteCount / 1024
        }
    }

    fun put(key: String, bitmap: Bitmap) {
        if (get(key) == null) {
            cache.put(key, bitmap)
        }
    }

    fun get(key: String): Bitmap? = cache.get(key)

    fun remove(key: String) {
        cache.remove(key)
    }

    fun clear() {
        cache.evictAll()
    }
}
