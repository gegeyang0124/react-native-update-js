//
//  RNUpdateAppJs.m
//  lx_yyt
//
//  Created by zy on 2018/11/14.
//  Copyright © 2018年 Facebook. All rights reserved.
//

#import "RNUpdateAppJs.h"

#import <React/RCTConvert.h>

//更新app的js代码及资源的类
@interface RNUpdateAppJs() {
    NSString *packageVersion;//app的静态版本号，即硬版本号
}
@end

static NSString *const paramVersionCode = @"bundleVersion";
static NSString *const paramVersionCodeLast = @"bundleVersionLast";
static NSString *const paramBundleJsPath = @"BundleJsPath";
static NSString *const paramBundleJsPathLast = @"BundleJsPathLast";
static NSString *const paramBundleJsBuild = @"BundleJsBuild";//构建值（数字），只可增大，不可重复，用于比对版本是否升级
static NSString *const paramBundleJsBuildLast = @"BundleJsBuildLast";//构建值（数字），只可增大，不可重复，用于比对版本是否升级
static NSString *const paramBundleJsRefresh = @"isRefresh";//是否更新key
static NSString *const paramUpdateInfo = @"updateInfo";

//static NSString *mainBundleFilePath;//js代码路径
//static NSString *currentVersion;//当前动态版本号，即当前js版本号
//static NSString *lastVersion;//上一个动态版本号，即上一个js版本号
//static NSString *bundleJsPathCur;//当前运行js版本的相对路径
//static NSString *bundleJsPathLast;//上一个前运行js版本的相对路径
//static NSUserDefaults *userPrefer;

/**
 热更新模块，若有bug导致应用直接崩溃，则js代码版本自动回滚到前一个版本
 **/
@implementation RNUpdateAppJs
/**
 1.@synthesize 的作用:是为属性添加一个实例变量名，或者说别名。同时会为该属性生成 setter/getter 方法。
 2.禁止@synthesize:如果某属性已经在某处实现了自己的 setter/getter ,可以使用 @dynamic 来阻止 @synthesize 自动生成新的 setter/getter 覆盖。
 3.内存管理：@synthesize 和 ARC 无关。
 4.使用：一般情况下无需对属性添加 @synthesize ，但一些特殊情形仍然需要，例如protocol中声明的属性。
 **/
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (id)init{
    
    return self;
}

//获取js代码打包压缩的bundle文件的url
+ (NSURL*)bundleURL{
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSDictionary *updateInfo  = [userDefaults dictionaryForKey:paramUpdateInfo];
    
    NSURL *bundle = nil;
    
    if(updateInfo){
        BOOL isRefresh = [updateInfo[paramBundleJsRefresh] boolValue];
        NSString *currentVersion = [updateInfo objectForKey:paramVersionCode];
        NSString *lastVersion = [updateInfo objectForKey:paramVersionCodeLast];
        NSString *bundleJsPath = [updateInfo objectForKey:paramBundleJsPath];//当前运行js的相对路径
        NSString *bundleJsPathLast = [updateInfo objectForKey:paramBundleJsPathLast];//上一个前运行js版本的相对路径
        NSNumber *build = [updateInfo objectForKey:paramBundleJsBuild];// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
        NSNumber *buildLast = [updateInfo objectForKey:paramBundleJsBuildLast];// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
        
        if(isRefresh == YES){
            
            NSMutableDictionary *ret = [NSMutableDictionary new];
            ret[paramBundleJsRefresh] = @(NO);
            ret[paramVersionCode] = currentVersion;
            ret[paramVersionCodeLast] = lastVersion;
            ret[paramBundleJsPath] = bundleJsPath;
            ret[paramBundleJsPathLast] = bundleJsPathLast;
            ret[paramBundleJsBuild] = build;
            ret[paramBundleJsBuildLast] = buildLast;
            [userDefaults setObject:ret forKey:paramUpdateInfo];
            [userDefaults synchronize];
            
            if(bundleJsPath){
                NSString *bundleJs = [[self DocumentFilePath] stringByAppendingString:bundleJsPath];
                bundleJs = [bundleJs stringByAppendingString:@"/main.jsbundle"];
                
                NSFileManager *fileMgr = [NSFileManager defaultManager];
                if([fileMgr fileExistsAtPath:bundleJs]){
                    bundle = [NSURL fileURLWithPath:bundleJs];
                }
                else
                {
                    bundle = [self bundleURL];
                }
            }
            else
            {
                bundle = [self bundleURL];
            }
        }
        else
        {
            NSMutableDictionary *ret = [NSMutableDictionary new];
            ret[paramBundleJsRefresh] = @(NO);
            ret[paramVersionCode] = lastVersion;
            ret[paramVersionCodeLast] = lastVersion;
            ret[paramBundleJsPath] = bundleJsPathLast;
            ret[paramBundleJsPathLast] = bundleJsPathLast;
            ret[paramBundleJsBuild] = buildLast;
            ret[paramBundleJsBuildLast] = buildLast;
            [userDefaults setObject:ret forKey:paramUpdateInfo];
            [userDefaults synchronize];
            
            //      [userDefaults setObject:@{
            //                                paramBundleJsRefresh:@(NO),
            //                                paramVersionCode:lastVersion,
            //                                paramVersionCodeLast:lastVersion,
            //                                paramBundleJsPath:bundleJsPathLast,
            //                                paramBundleJsPathLast:bundleJsPathLast
            //                                }
            //                       forKey:paramUpdateInfo];
            //      [userDefaults synchronize];
            
            if(bundleJsPathLast)
            {
                NSString *bundleJs = [[self DocumentFilePath] stringByAppendingString:bundleJsPathLast];
                bundleJs = [bundleJs stringByAppendingString:@"/main.jsbundle"];
                
                NSFileManager *fileMgr = [NSFileManager defaultManager];
                if([fileMgr fileExistsAtPath:bundleJs]){
                    bundle = [NSURL fileURLWithPath:bundleJs];
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
        }
    }
    else
    {
        bundle = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
    }
    
    NSLog(@"=========use asserts:%@", bundle);
    
    return bundle;
}

/**
 设置偏好值
 **/
RCT_EXPORT_METHOD(setPreferData:(NSString *)key
                  value:(NSString *)value
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setObject:value forKey:key];
    resolve(nil);
}

/**
 获取偏好值
 **/
RCT_EXPORT_METHOD(getPreferData:(NSString *)key
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    resolve([userDefaults objectForKey:key]);
}

/**
 设置js版本
 @param options NSDictionary,//设置js版本相关数据
 options : {
 versionCode : '', //NSString,//js版本号
 bundleJsPath : '', //NSString,//js代码路径
 build : 122, //int,//构建值（数字），只可增大，不可重复，用于比对版本是否升级
 }
 **/
RCT_EXPORT_METHOD(setVersion:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject){
    NSString *versionCode = [RCTConvert NSString:options[@"versionCode"]];
    NSString *bundleJsPath = [RCTConvert NSString:options[@"bundleJsPath"]];
    NSNumber *build = [RCTConvert NSNumber:options[@"build"]];
    
//    resolve(@{
//              @"versionCode":versionCode,
//              @"bundleJsPath":bundleJsPath,
//              @"build":build
//              });

    if(versionCode && bundleJsPath && build != nil){
        NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
        NSDictionary *updateInfo  = [userDefaults dictionaryForKey:paramUpdateInfo];

        NSMutableDictionary *ret = [NSMutableDictionary new];
        ret[paramBundleJsRefresh] = @(YES);
        ret[paramVersionCode] = versionCode;
        ret[paramVersionCodeLast] = updateInfo[paramVersionCodeLast];
        ret[paramBundleJsPath] = bundleJsPath;
        ret[paramBundleJsPathLast] = updateInfo[paramBundleJsPathLast];
        ret[paramBundleJsBuild] = build;
        ret[paramBundleJsBuildLast] = updateInfo[paramBundleJsBuildLast];

        [userDefaults setObject:ret forKey:paramUpdateInfo];
        [userDefaults synchronize];

        resolve([userDefaults dictionaryForKey:paramUpdateInfo]);
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
        [_bridge setValue:[RNUpdateAppJs bundleURL] forKey:@"bundleURL"];
        [_bridge reload];
    });
}

/**
 导出变量
 **/
- (NSDictionary *)constantsToExport
{
    //  [[self class] bundleURL];
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSDictionary *updateInfo  = [userDefaults dictionaryForKey:paramUpdateInfo];
    
    NSString *currentVersion = [updateInfo objectForKey:paramVersionCode];
    NSString *lastVersion = [updateInfo objectForKey:paramVersionCodeLast];
    NSString *bundleJsPath = [updateInfo objectForKey:paramBundleJsPath];//当前运行js的相对路径
    NSString *bundleJsPathLast = [updateInfo objectForKey:paramBundleJsPathLast];//上一个前运行js版本的相对路径
    NSNumber *build = [updateInfo objectForKey:paramBundleJsBuild];// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
    NSNumber *buildLast = [updateInfo objectForKey:paramBundleJsBuildLast];// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
    
    NSMutableDictionary *ret = [NSMutableDictionary new];
    ret[@"currentVersion"] = currentVersion;
    ret[@"lastVersion"] = lastVersion;
    ret[@"packageVersion"] = [[self class] packageVersion];
    ret[@"bundleJsPathCur"] = bundleJsPath;
    ret[@"bundleJsPathLast"] = bundleJsPathLast;
    ret[@"build"] = build;
    ret[@"buildLast"] = buildLast;
    
    
    return ret;
}

/**
 标记更新成功，若js无bug则标记成功，若有bug则回滚到前一个js版本
 **/
RCT_EXPORT_METHOD(markSuccess:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    NSDictionary *updateInfo  = [userDefaults dictionaryForKey:paramUpdateInfo];
    
    NSString *currentVersion = [updateInfo objectForKey:paramVersionCode];
    //    NSString *lastVersion = [updateInfo objectForKey:paramVersionCodeLast];
    NSString *bundleJsPath = [updateInfo objectForKey:paramBundleJsPath];//当前运行js的相对路径
    //    NSString *bundleJsPathLast = [updateInfo objectForKey:paramBundleJsPathLast];//上一个前运行js版本的相对路径
    NSNumber *build = [updateInfo objectForKey:paramBundleJsBuild];// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
    
    NSMutableDictionary *ret = [NSMutableDictionary new];
    ret[paramBundleJsRefresh] = @(NO);
    ret[paramVersionCode] = currentVersion;
    ret[paramVersionCodeLast] = currentVersion;
    ret[paramBundleJsPath] = bundleJsPath;
    ret[paramBundleJsPathLast] = bundleJsPath;
    ret[paramBundleJsBuild] = build;
    ret[paramBundleJsBuildLast] = build;
    
    [userDefaults setObject:ret forKey:paramUpdateInfo];
    [userDefaults synchronize];
    
    NSDictionary *ret1 = [userDefaults dictionaryForKey:paramUpdateInfo];
    resolve(ret1);
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
    return [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
    //  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    //  return [paths firstObject];
}

+ (NSString *)MainBundleFilePath {
    return [[RNUpdateAppJs DocumentFilePath] stringByAppendingString:@"/www/index.ios.bundle"];
}

@end
