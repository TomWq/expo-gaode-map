cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB expo_gaode_map_SRC CONFIGURE_DEPENDS *.cpp)
add_library(expo_gaode_map SHARED ${expo_gaode_map_SRC})
target_include_directories(expo_gaode_map PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(expo_gaode_map PUBLIC rnoh)
