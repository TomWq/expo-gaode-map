package expo.modules.gaodemap.map.utils

import com.amap.api.maps.model.BitmapDescriptor
import java.util.concurrent.ConcurrentHashMap

object BitmapDescriptorCache {
    private val cache = ConcurrentHashMap<String, BitmapDescriptor>()

    fun get(key: String): BitmapDescriptor? {
        return cache[key]
    }

    fun put(key: String, descriptor: BitmapDescriptor) {
        cache[key] = descriptor
    }
    
    fun clear() {
        cache.clear()
    }
}
