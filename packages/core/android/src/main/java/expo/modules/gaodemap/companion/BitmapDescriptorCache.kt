package expo.modules.gaodemap.companion

import com.amap.api.maps.model.BitmapDescriptor
import com.amap.api.maps.model.BitmapDescriptorFactory
import android.graphics.Bitmap
import java.util.concurrent.ConcurrentHashMap

object BitmapDescriptorCache {

    private val cache = ConcurrentHashMap<String, BitmapDescriptor>()

    fun get(key: String): BitmapDescriptor? = cache[key]

    fun put(key: String, bitmap: Bitmap) {
        val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
        cache[key] = descriptor
    }

    fun putDescriptor(key: String, descriptor: BitmapDescriptor) {
        cache[key] = descriptor
    }

    fun clear() {
        cache.clear()
    }

    fun remove(key: String) {
        cache.remove(key)
    }
}
