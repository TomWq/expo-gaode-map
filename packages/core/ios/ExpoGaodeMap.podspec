require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoGaodeMap'
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
  s.dependency 'AMapFoundation'
  s.dependency 'AMapLocation'
  s.dependency 'AMap3DMap'

  s.library = 'c++'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/../shared/cpp"'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  
  s.public_header_files = "**/*.h"
end
