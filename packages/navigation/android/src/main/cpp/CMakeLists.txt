cmake_minimum_required(VERSION 3.22.1)

project(gaodecluster_nav)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(gaodecluster_nav SHARED
    cluster_jni.cpp
    ../../../../shared/cpp/ClusterEngine.cpp
    ../../../../shared/cpp/QuadTree.cpp
    ../../../../shared/cpp/GeometryEngine.cpp
    ../../../../shared/cpp/ColorParser.cpp
)

target_include_directories(gaodecluster_nav PRIVATE
    ../../../../shared/cpp
)

find_library(log-lib log)

target_link_libraries(gaodecluster_nav
    ${log-lib}
)
