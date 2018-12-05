//
//  RNUpdateAppJs.h
//  RNUpdateAppJs
//
//  Created by Mac on 2018/12/4.
//  Copyright © 2018年 Mac. All rights reserved.
//

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

@interface RNUpdateAppJs : NSObject <RCTBridgeModule>
+ (NSURL*)bundleURL;
@end
