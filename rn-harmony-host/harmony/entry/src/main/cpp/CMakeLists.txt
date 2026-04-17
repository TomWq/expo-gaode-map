project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_SKIP_BUILD_RPATH TRUE)
set(OH_MODULE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")

set(RNOH_CPP_DIR "${OH_MODULE_DIR}/@rnoh/react-native-openharmony/src/main/cpp")
set(RNOH_GENERATED_DIR "${CMAKE_CURRENT_SOURCE_DIR}/generated")
set(CMAKE_ASM_FLAGS "-Wno-error=unused-command-line-argument -Qunused-arguments")
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now,-z,noexecstack -s -fPIE -pie")
add_compile_definitions(WITH_HITRACE_SYSTRACE)
set(WITH_HITRACE_SYSTRACE 1) # for other CMakeLists.txt files to use

# Keep ArkTS enableCAPIArchitecture and CPP side in sync.
set(ENV{RNOH_C_API_ARCH} "1")

add_subdirectory("${RNOH_CPP_DIR}" ./rn)
add_subdirectory("${OH_MODULE_DIR}/expo-gaode-map/src/main/cpp" ./expo-gaode-map)

if(TARGET fmt)
  # Stabilize fmt archive path for OHOS Ninja link steps.
  set_target_properties(fmt PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/rn/third-party/fmt"
    ARCHIVE_OUTPUT_DIRECTORY_DEBUG "${CMAKE_BINARY_DIR}/rn/third-party/fmt"
    ARCHIVE_OUTPUT_DIRECTORY_RELEASE "${CMAKE_BINARY_DIR}/rn/third-party/fmt"
    ARCHIVE_OUTPUT_DIRECTORY_RELWITHDEBINFO "${CMAKE_BINARY_DIR}/rn/third-party/fmt"
    ARCHIVE_OUTPUT_DIRECTORY_MINSIZEREL "${CMAKE_BINARY_DIR}/rn/third-party/fmt"
  )
endif()

if(TARGET rnoh_core AND TARGET fmt)
  add_dependencies(rnoh_core fmt)
endif()
if(TARGET rnoh_core_package AND TARGET fmt)
  add_dependencies(rnoh_core_package fmt)
endif()
if(TARGET expo_gaode_map AND TARGET fmt)
  add_dependencies(expo_gaode_map fmt)
endif()

add_library(rnoh_app SHARED
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_link_libraries(rnoh_app PUBLIC rnoh)
target_link_libraries(rnoh_app PUBLIC expo_gaode_map)
if(TARGET fmt)
  add_dependencies(rnoh_app fmt)
endif()
