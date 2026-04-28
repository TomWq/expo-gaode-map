require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::UI.puts "[expo-gaode-map] Thank you for using expo-gaode-map ❤️"
Pod::UI.puts "[expo-gaode-map] If you enjoy using expo-gaode-map, please consider sponsoring this project: https://github.com/TomWq"

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
  s.dependency 'AMap3DMap', '= 11.1.200'
  s.dependency "AMapLocation"
  s.dependency "AMapSearch", '~> 9.7.0'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"${PODS_TARGET_SRCROOT}/../shared/cpp"'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
  
  s.public_header_files = "**/*.h"
end
