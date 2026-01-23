package expo.modules.gaodemap.map.utils

object ClusterNative {
    init {
        System.loadLibrary("gaodecluster_nav")
    }

    external fun clusterPoints(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        radiusMeters: Double
    ): IntArray
}
