package expo.modules.gaodemap.utils

object ClusterNative {
    init {
        System.loadLibrary("gaodecluster")
    }

    external fun clusterPoints(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        radiusMeters: Double
    ): IntArray
}
