#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <AMapFoundationKit/AMapFoundationKit.h>
#import <AMapLocationKit/AMapLocationKit.h>

@interface RNAMapGeolocation : RCTEventEmitter <RCTBridgeModule, AMapLocationManagerDelegate>

@end
