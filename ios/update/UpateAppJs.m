//
//  UpateAppJs.m
//  lx_yyt
//
//  Created by zy on 2018/11/14.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "UpateAppJs.h"

//更新app的js代码及资源的类
@interface UpateAppJs() {
  NSString *packageVersion;//app的静态版本号，即硬版本号
}
@end

static NSString *const paramLastVersionCode = @"APP_VERSION_CODE";
static NSString *const paramVersionCode = @"CFBundleVersion";
static NSString *const paramBundleJsPath = @"BundleJsPath";
static NSString *mainBundleFilePath;//js代码路径
static NSString *currentVersion;//动态版本号，即js版本号

@implementation UpateAppJs

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (id)init{
  packageVersion = [[self class] packageVersion];
  
  return self;
}

//获取js代码打包压缩的bundle文件的url
+ (NSURL*)bundleURL{
  NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
  NSString *lastVersionCode = [userDefaults objectForKey:paramLastVersionCode];
  NSString *versionCode = [userDefaults objectForKey:paramVersionCode];
  NSString *bundleJsPath = [userDefaults objectForKey:paramBundleJsPath];
  NSURL *bundle = nil;
  
  if(versionCode && ![lastVersionCode isEqualToString:versionCode]){
    [userDefaults setObject:versionCode forKey:paramLastVersionCode];
    [userDefaults synchronize];
  }
  
  if(bundleJsPath){
    NSFileManager *fileMgr = [NSFileManager defaultManager];
    if([fileMgr fileExistsAtPath:bundleJsPath]){
      bundleJsPath = [bundleJsPath stringByAppendingString:@"/main.jsbundle"];
      
      bundle = [NSURL fileURLWithPath:bundleJsPath];
    }
    else
    {
      bundle = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    }
  }
  else
  {
    bundle = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  }
  
  mainBundleFilePath = bundleJsPath;
  currentVersion = versionCode;
  
  NSLog(@"=========use asserts:%@", bundle);
  NSLog(@"lastVersionCode:%@", lastVersionCode);
  NSLog(@"versionCode:%@", versionCode);
  
  return bundle;
}

/**
 设置js版本
 @param versionCode NSString,//js版本号
 @param bundleJsPath NSString,//js代码路径
 **/
RCT_EXPORT_METHOD(setVersion:(NSString *)versionCode
                  bundleJsPath:(NSString *)bundleJsPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
  if(versionCode && bundleJsPath){
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:versionCode forKey:paramVersionCode];
    [userDefaults setObject:bundleJsPath forKey:paramBundleJsPath];
     resolve(nil);
  }
  else
  {
    reject(nil,nil,nil);
  }
 
}

/**
  重载，会使用立即使用新的js代码
 **/
RCT_EXPORT_METHOD(reload){
  dispatch_async(dispatch_get_main_queue(), ^{
    [_bridge setValue:[UpateAppJs bundleURL] forKey:@"bundleURL"];
    [_bridge reload];
  });
}

/**
  导出变量
 **/
- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *ret = [NSMutableDictionary new];
  ret[@"currentVersion"] = currentVersion;
  ret[@"packageVersion"] = packageVersion;
  ret[@"mainBundleFilePath"] = mainBundleFilePath;
  
  return ret;
}

/**
 app的静态版本号，即硬版本号
 **/
+ (NSString *)packageVersion
{
  static NSString *version = nil;
  
  //dispatch_once_t用于判定是否执行，0或-1，0未执行，-1已执行，-1后就不再执行
  static dispatch_once_t onceToken;
  //dispatch_once在运行周期内只运行一次
  dispatch_once(&onceToken, ^{
    NSDictionary *infoDictionary = [[NSBundle mainBundle] infoDictionary];
    version = [infoDictionary objectForKey:@"CFBundleShortVersionString"];
  });
  return version;
}

+ (NSString *)DocumentFilePath{
  return [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0] stringByAppendingString:@"/"];
}

+ (NSString *)MainBundleFilePath {
  return [[UpateAppJs DocumentFilePath] stringByAppendingString:@"www/index.ios.bundle"];
}

@end
