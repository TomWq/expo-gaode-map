require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoGaodeMapNavigation'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/TomWq/expo-gaode-map' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'AMapNavi'
  s.dependency 'AMapFoundation'
  s.dependency 'AMapLocation'
  
  s.library = 'c++'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)/map/cpp" "$(PODS_TARGET_SRCROOT)/../shared/cpp"',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'CLANG_CXX_LIBRARY' => 'libc++'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  s.exclude_files = ["**/tests/*", "**/CppBridging.mm"]
  
  # 严格只允许 .h 文件作为公共头文件，防止 .hpp 被 Swift 模块引用
  s.public_header_files = "**/*.h"
end
