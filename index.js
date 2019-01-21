import {
    Platform,
    Linking,
    NativeModules,
} from 'react-native';

import { zip, unzip, unzipAssets, subscribe } from 'react-native-zip-archive';
import RNFS from "react-native-fs";
import Loadding from "react-native-toast-loadding";

const HotUpdateJs = NativeModules.RNUpdateAppJs
    ?  NativeModules.RNUpdateAppJs
    :  NativeModules.UpateAppJs
        ? NativeModules.UpateAppJs
        : {};

export const packageVersion = HotUpdateJs.packageVersion;//app的静态版本(硬版本)号，即编译时设置的版本号，此发生变化就会去下载新的静态版本(硬版本)
export var currentVersion = HotUpdateJs.currentVersion;//动态版本号，即当前运行的js程序的js版本号
export var mainBundleFilePath = HotUpdateJs.mainBundleFilePath;//js代码路径 指向main.jsbundle
// export const markSuccess = HotUpdateJs.markSuccess;// 标记更新成功，若js无bug则标记成功，若有bug则回滚到前一个js版本
export const bundleJsPathCur = HotUpdateJs.bundleJsPathCur;// 当前运行js版本的相对路径
export const bundleJsPathLast = HotUpdateJs.bundleJsPathLast;// 上一个前运行js版本的相对路径
export const build = HotUpdateJs.build;// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
export const buildLast = HotUpdateJs.buildLast;// 上一个版本的构建值（数字），只可增大，不可重复，用于比对版本是否升级
export const appVersion = HotUpdateJs.appVersion;//当前app的静态版本号
// export const Loadding = require("./lib/LoaddingIndicator").default;

/**
 * 热更新，提供热更新各种方法,自己配置服务器
 * 若有bug导致应用直接崩溃，则js代码版本自动回滚到前一个版本
 * 下次
 * **/
export class HotUpdate{

    static packageVersion = packageVersion;//app的静态版本(硬版本)号，即编译时设置的版本号，此发生变化就会去下载新的静态版本(硬版本)
    static currentVersion = currentVersion;//动态版本号，即当前运行的js程序的js版本号
    static mainBundleFilePath = mainBundleFilePath;//js代码路径 指向main.jsbundle

    static host = null;//热更新配置文件地址或接口，//get请求
    static tag = "";//热更新的标志 与后台配置一致
    static downloadDir = Platform.OS == "ios"
        ? `${RNFS.DocumentDirectoryPath}/wwwDown`
        : `${RNFS.ExternalStorageDirectoryPath}/wwwDown`;//下载目录
    static WWWROOT = "/wwwRoot";
    static sourceDir = Platform.OS == "ios"
        ? `${RNFS.DocumentDirectoryPath}`
        : `${RNFS.ExternalStorageDirectoryPath}`;//js程序资源目录
    static updateInfo = {};//更新数据信息
    static configToast = true;//当重启配置js程序时，是否提示。

    /**
     * 检查更新
     * return Promise
     Promise成功后的回传数据
     若app的静态版本(硬版本)更新则返回：
     resolve({
         expired:true,//{expired: true}：该应用包(原生部分)已过期，需要前往应用市场下载新的版本；反之false
         downloadUrl:"",//更新版本下载地址
         packageVersion:"2.0.7",//app的静态版本(硬版本)号，即编译时设置的版本号，此发生变化就会去下载新的静态版本(硬版本)
         description:"yyy",//静态版本(硬版本)描述
         metaInfo:{}//元信息可在里面自定义一些数据,app的静态版本(硬版本)，更新时回传
     });
     若只是js动态版本更新则返回：
     resolve({
         expired:flase,//{expired: true}：该应用包(原生部分)已过期，需要前往应用市场下载新的版本；反之false
         packageVersion:"2.0.7",//app的静态版本(硬版本)号，即编译时设置的版本号，此发生变化就会去下载新的静态版本(硬版本)
         update:true,//{update: true}：当前有新版本可以更新
         metaInfo:{},//元信息可在里面自定义一些数据，js的版本，更新时回传
         publishJS:[]//发布的js所有版本,默认第一个是最新发布的的js版本
         description: "asdfsa",//js描述
         version: "2.0.140",//js的版本号
         "build": 12,// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
         updateUrl: "http://yyt.lexin580.com:8081/app_config/lx_yyt_app.zip" //js包
     });
     * **/
    static checkUpdate = () => {
        return new Promise((resolve, reject) => {
            if(HotUpdate.host){
                HotUpdate.requestAjax("GET",HotUpdate.host)
                    .then(info=> {
                        info = info ? info : {};
                        if(typeof info == "string"){
                            info = JSON.parse(info);
                        }
                        let plat = Platform.OS ? "ios" : "android";
                        let key = plat + "-" + HotUpdate.tag + "-" + packageVersion;
                        info = info[key];
                        info = info ? info : {};

                        if(info.packageVersion){

                            if(info.packageVersion === packageVersion){
                                if(info.publishJS && info.publishJS.length > 0){
                                    let update = false;
                                    if(build != null){
                                        if(info.publishJS[0].build > build){
                                            update = true;
                                        }
                                    }
                                    else
                                    {
                                        update = true;
                                    }

                                    HotUpdate.updateInfo = {
                                        expired:false,//{expired: false}：该应用包(原生部分)已过期，需要前往应用市场下载新的版本；反之false
                                        packageVersion:info.packageVersion,
                                        metaInfoPkg:info.metaInfoPkg, //元信息可在里面自定义一些数据,app的静态版本(硬版本)，更新时回传
                                        update:update,//{update: true}：当前有新版本可以更新
                                        publishJS:info.publishJS//发布的js所有版本,默认第一个是最新发布的的js版本
                                    };
                                    HotUpdate.updateInfo = Object.assign({},HotUpdate.updateInfo, info.publishJS[0]);
                                    console.info("updateInfo:",HotUpdate.updateInfo);
                                    resolve&&resolve(HotUpdate.updateInfo);
                                }
                                else
                                {
                                    reject&&reject();
                                }
                            }
                            else
                            {
                                HotUpdate.updateInfo = {
                                    expired:true,//{expired: true}：该应用包(原生部分)已过期，需要前往应用市场下载新的版本；反之false
                                    downloadUrl:info.downloadUrl,//更新版本下载地址
                                    packageVersion:info.packageVersion,
                                    description:info.description,
                                    metaInfoPkg:info.metaInfoPkg //元信息可在里面自定义一些数据,app的静态版本(硬版本)，更新时回传
                                };
                                console.info("updateInfo:",HotUpdate.updateInfo);
                                resolve&&resolve(HotUpdate.updateInfo);
                            }
                        }
                        else
                        {
                            reject&&reject();
                        }
                    });
            }
        });
    };

    /**
     * 下载更新
     * @param info json;//更新信息，checkUpdate成功后返回的数据 ，可不传
     * @param progressCallback func;//进程回调函数，回传三位小数 可不传
     * @param configToast bool,//当重启配置js程序时，是否提示,默认true，提示。
     * return Promise;
     * resolve(info)有数据返回 成功回传数据，在info中增加字段filePath，{filePath:"下载文件路径"}
     * **/
    static downloadUpdate(info=HotUpdate.updateInfo,progressCallback,cfgToast=true){
        return new Promise((resolve, reject) => {
            HotUpdate.configToast = cfgToast;
            if(HotUpdate.updateInfo.expired){
                HotUpdate.updateInfo.downloadUrl && Linking.openURL(HotUpdate.updateInfo.downloadUrl);
            }
            else
            {
                this.downloadJs(info,progressCallback,resolve, reject);
            }
        });
    }

    /**
     * 更新重载应用
     * @param info Json;//downloadUpdate成功后返回的数据
     * @param isReload bool;//是否立即重载;默认true,立即重载；false,下次启动加载
     * **/
    static doUpdate(info,isReload=true){
        if(HotUpdate.configToast){
            Loadding.show(true,"正在配置...");
        }

        let www = this.WWWROOT + "/" + new Date().getTime();
        let unzipPath = this.sourceDir + www;
        RNFS.mkdir(unzipPath).then(()=>{
            unzip(info.filePath, unzipPath)
                .then((path) => {
                    console.info('info:',info);
                    console.info('unzip completed:',path);

                    /*  let srcDir = "/" + info.filePath.substring(
                          info.filePath.lastIndexOf("/") + 1,
                          info.filePath.lastIndexOf(".")
                      );
                      www = www + srcDir;*/

                    this.setVersion(info.version,www,info.build)
                        .then(()=>{
                            if(__DEV__){
                                setTimeout(()=>{
                                    if(HotUpdate.configToast){
                                        Loadding.hide();
                                    }

                                    if(isReload){
                                        this.reload();
                                    }
                                },1500);
                            }
                            else
                            {
                                if(HotUpdate.configToast){
                                    Loadding.hide();
                                }
                                if(isReload){
                                    this.reload();
                                }
                            }

                        })
                        .catch(()=>{
                            if(HotUpdate.configToast){
                                Loadding.hide();
                            }
                        });
                })
                .catch((error) => {
                    console.log("error:" + error);
                });
        });
    }

    /**------------------------------------------------------------------------------------------------------------------**/

    /**
     * 下载Js
     * @param info json;//更新信息，checkUpdate成功后返回的数据 ，
     * @param progressCallback func;//进程回调函数
     * @param resolve func;//成功回调函数,成功回传数据，在info中增加字段filePath，{filePath:"下载文件路径"}
     * @param reject func;//失败回调函数
     * **/
    static downloadJs(info,progressCallback,resolve,reject){

        this.deleteDirOrFile(this.downloadDir)
            .then(()=>{
                this.downloadFile(info.updateUrl,this.downloadDir,
                    true,progressCallback)
                    .then(result=>{
                        info = Object.assign({},info, result);
                        resolve&&resolve(info);
                    })
                    .catch(()=>{
                        reject&&reject()
                    });
            });

    }

    /**
     * 下载文件
     * @param fileAddress string,//文件地址
     * @param downloadPath string,//下载存放文件目录路径 默认null,使用默认下载目录
     * @param isReDownload bool,//是否重新下载，默认false，false:若存在则不再下载，反之下载
     * @param progressCallback func;//进程回调函数 ，回传三位小数 可不传
     * return Promise
     *  resolve func;//成功回调函数 回传数据{filePath:"下载文件路径"}
     *  reject func;//失败回调函数
     * **/
    static downloadFile(fileAddress,downloadPath=this.downloadDir,
                        isReDownload=false,progressCallback) {
        return  new Promise((resolve,reject)=>{

            let downloadDest = downloadPath + `/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;

            RNFS.mkdir&&RNFS.mkdir(downloadPath)
                .then(()=>{
                    RNFS.exists(downloadDest)
                        .then((exist) =>{
                            if(!exist || isReDownload){
                                if(fileAddress == undefined)
                                {
                                    reject&&reject();
                                }

                                // 音频
                                //const downloadDest = `${RNFS.MainBundlePath}/${((Math.random() * 1000) | 0)}.mp3`;
                                // let downloadDest = `${RNFS.MainBundlePath}/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;
                                // let downloadDest = `${RNFS.DocumentDirectoryPath}/${fileAddress.substring(fileAddress.lastIndexOf('/') + 1)}`;
                                // http://wvoice.spriteapp.cn/voice/2015/0902/55e6fc6e4f7b9.mp3
                                //const formUrl = 'http://wvoice.spriteapp.cn/voice/2015/0818/55d2248309b09.mp3';VideoView_android.js

                                let options = {
                                    fromUrl: fileAddress,
                                    toFile: downloadDest,
                                    background: true,
                                    headers: {
                                        // 'Cookie': cookie //需要添加验证到接口要设置cookie
                                    },
                                    begin: (res) => {
                                        /*console.log('begin', res);
                                         console.log('contentLength:', res.contentLength / 1024 / 1024, 'M');*/
                                        // alert(JSON.stringify(res));
                                    },
                                    progress: (res) => {

                                        //let per = (res.bytesWritten / res.contentLength).toFixed(3);
                                        let per = (res.bytesWritten / res.contentLength);
                                        // per = per * 1000;
                                        // per = parseInt(per);
                                        // per = per / 1000;
                                        progressCallback&&progressCallback(per);
                                    }
                                };

                                try {
                                    let ret = RNFS.downloadFile(options);
                                    ret.promise.then(retJson => {
                                        console.log("-----------------------------------------downloadFile " + fileAddress + " success start-------------------------------------");
                                        console.info("response:",retJson);
                                        console.log("-----------------------------------------downloadFile " + fileAddress + " success end-------------------------------------");

                                        RNFS.stopDownload(retJson.jobId);
                                        if(retJson.statusCode == 200){
                                            retJson["filePath"] = downloadDest;
                                            resolve&&resolve(retJson);
                                        }
                                        else
                                        {
                                            if(HotUpdate.configToast){
                                                Loadding.show(false,"升级包不存在");
                                            }
                                            setTimeout(()=>{
                                                if(HotUpdate.configToast){
                                                    Loadding.hide();
                                                }
                                            },2000);
                                        }



                                    }).catch(err => {
                                        //console.log('err', err);
                                        reject&&reject(err);
                                    });
                                }
                                catch (e) {
                                    //console.log(error);
                                    reject&&reject(e);
                                }
                            }
                            else
                            {
                                // Tools.toast("文件已存在");
                                resolve&&resolve({
                                    filePath:downloadDest
                                });
                            }
                        });
                });

        });

    }

    /**
     * 设置js版本
     * @param versionCode NSString,//js版本号
     * @param bundleJsPath NSString,//js代码路径
     * @param build int,//构建值
     **/
    static setVersion(versionCode:string,bundleJsPath:string,build:number){
        console.info("option",{
            versionCode,
            bundleJsPath,
            build
        });
        return HotUpdateJs.setVersion({
            versionCode,
            bundleJsPath,
            build
        });
    }

    /**
     * 重载，会使用立即使用新的js代码
     **/
    static reload(){
        // switchVersion("lqFWlHE8uY6JIzqBQrQj8vJxxlOo");
        HotUpdateJs.reload();
    }

    /**
     * 删除目录或文件
     * @param path string;//文件或文件夹目录
     * return Promise;
     resolve(path);
     * **/
    static deleteDirOrFile (path) {
        return new Promise((resolve, reject) => {
            if(path){
                RNFS.unlink(path).then(() => {
                    console.info('FILE DELETED success',path);
                    resolve&&resolve(path);
                }).catch((err) => {
                    console.info('FILE DELETED err',path);
                    resolve&&resolve(path);
                });
            }
            else
            {
                resolve&&resolve(path);
            }
        });
    }

    /**
     * 基于 ajax 封装的 网络请求
     * @param type strng; //请求类型GET或POST
     * @param url string; //请求地址
     */
    static requestAjax(type,url){
        let timeout = true;

        //Tools.toast(isProgress ? "T" : "F")
        let fetchTimeout = new Promise((resolve,reject)=>{
            setTimeout(()=>{
                    if(timeout){
                        console.log("-----------------------------------------httpAjax " + url + " Timeout start-------------------------------------");
                        console.log("-----------------------------------------httpAjax " + url + " Timeout end-------------------------------------");

                        // TalkingData.trackEventHttp("Timeout",url,type);
                        reject&&reject({status:"Timeout"});
                    }
                },
                15000);
        });

        // alert(JSON.stringify(fetchOptions))
        let fetchPromise =  new Promise((resolve, reject)=>{

            var request = new XMLHttpRequest();

            request.onreadystatechange = (e) => {
                if (request.readyState !== 4) {
                    return;
                }
                timeout = false;
                if (request.status === 200) {
                    console.log("-----------------------------------------httpAjax " + url + " success start-------------------------------------");
                    console.info('success', request.responseText);
                    console.log("-----------------------------------------httpAjax " + url + " success end-------------------------------------");
                    resolve&&resolve(request.responseText);
                    //alert(request.responseText)
                } else {
                    console.log("-----------------------------------------httpAjax " + url + " err start-------------------------------------");
                    console.log('err');
                    console.log("-----------------------------------------httpAjax " + url + " err end-------------------------------------");
                    reject&&reject({status:-1});
                }
            };

            request.open(type, url);
            request.send();
        });

        /**
         * 其中一个谁先执行，其他的会被舍弃
         * **/
        return Promise.race([fetchPromise,fetchTimeout]);
    }

    /**
     * 标记更新成功
     * 删除目录下得一级目录和文件
     * **/
    static markSuccess(){
        this.setMarkSuccess().then(()=>{
            if(RNFS.readDir){
                let dir = this.sourceDir + this.WWWROOT;
                RNFS.exists(dir)
                    .then((exist) =>{
                        if(exist)
                        {
                            RNFS.readDir(dir)
                                .then((files)=>{
                                    console.info("files:",files);

                                    let path = null;
                                    let pathLast = null;
                                    if(bundleJsPathCur)
                                    {
                                        path = this.sourceDir + bundleJsPathCur;

                                    }
                                    else if(mainBundleFilePath){
                                        path = mainBundleFilePath.substring(0,mainBundleFilePath.lastIndexOf("/"));
                                    }

                                    if(bundleJsPathLast){
                                        pathLast = this.sourceDir + bundleJsPathLast;
                                    }

                                    // let l = [];

                                    files.forEach((v,i,a)=>{
                                        if(v.path != path
                                            && v.path != pathLast){
                                            this.deleteDirOrFile(v.path);
                                        }
                                        /*else
                                        {
                                            l.push(v.path);
                                        }

                                        if(i == (files.length) - 1){
                                            Loadding.show(false,JSON.stringify(l) + "  | "
                                                + l.length
                                                + " |  " + bundleJsPathLast);
                                            setTimeout(()=>{Loadding.hide();},3000);
                                        }*/
                                    });

                                });
                        }


                    });

            }
        });
    }

    /**
     * 设置用户偏好值
     * @prama key stirng;//偏好值的键key
     * @prama value stirng;//偏好值的值value
     * **/
    static setPreferData(key:string,value:string){
        return HotUpdateJs.setPreferData && HotUpdateJs.setPreferData(key,value);
    }

    /**
     * 设置用户偏好值
     * @prama key stirng;//偏好值的键key
     * **/
    static getPreferData(key:string){
        return HotUpdateJs.getPreferData && HotUpdateJs.getPreferData(key);
    }

    /**
     *  获取即时版本信息
     *  回传数据 {
           currentVersion，
           packageVersion，
           bundleJsPathCur，
           bundleJsPathLast，
           mainBundleFilePath，
     *  }
     * **/
    static  getAppInfo(){
        /* return new Promise(resolve => {
             // console.info("mainBundleFilePath:",mainBundleFilePath);
             if(HotUpdateJs.getAppInfo){
                 HotUpdateJs.getAppInfo((info)=>{
                     // console.info("app info",info)
                     resolve(info);
                 });
             }
         });*/

    }

    /**
     *  设置更新成功标志
     *  回传数据 {
           currentVersion，
           packageVersion，
           bundleJsPathCur，
           bundleJsPathLast，
           mainBundleFilePath，
     *  }
     * **/
    static setMarkSuccess(){
        return new Promise(resolve => {
            if(HotUpdateJs.markSuccess){
                // Loadding.show(false,"MarkSuccess");
                setTimeout(()=>{
                    // Loadding.hide();
                    HotUpdateJs.markSuccess()
                        .then(info=>{
                            resolve(info);
                        });
                },1000);

            }
            else
            {
                resolve({});
            }

        });

    }

    /**
     * 后台配置json
     * **/
    service(){
        let json = {
            "ios-lx_yyt-2.0.7":{
                "tag":"lx_yyt",
                "packageVersion":"2.0.7",
                "downloadUrl":"https://itunes.apple.com/cn/app/id1438062830?l=en&mt=8",
                "description":"yyy",
                "metaInfoPkg":{},
                "publishJS":[
                    {
                        "description": "asdfsa",
                        "version": "2.0.140",
                        "build": 12,
                        "metaInfo":{},
                        "updateUrl": "http://yyt.lexin580.com:8081/app_config/lx_yyt_app.zip"
                    }
                ]
            }
        }

        let jsonTest = {
            "ios-lx_yyt-2.0.7":{//这key是这样设置,ios："ios-" + HotUpdate.tag + "-" + packageVersion = "lx_yyt-2.0.7";android："android-" + HotUpdate.tag + "-" + packageVersion = "lx_yyt-2.0.7";
                "tag":"lx_yyt",//app设置的标识 ，HotUpdate.tag="lx_yyt"设置的一致
                "packageVersion":"2.0.7",//app的静态版本(硬版本)号，即编译时设置的版本号，此发生变化就会去下载新的静态版本(硬版本)
                "downloadUrl":"https://itunes.apple.com/cn/app/id1438062830?l=en&mt=8",//静态版本(硬版本)下载地址
                "description":"yyy",//静态版本(硬版本)描述
                "metaInfoPkg":{//元信息可在里面自定义一些数据,app的静态版本(硬版本)，更新时回传
                    "rnUpdate":true//此字段是我测试项目自定义的，是否开启react-native-update热更新，默认false关闭，使用自定义热更新；true开启，使用react-native-update热更新，只能选择一种
                },
                "publishJS":[//发布的js所有版本,默认第一个是最新发布的的js版本,可任选一个更新
                    {
                        "description": "asdfsa",//js描述
                        "version": "2.0.140",//js的版本号
                        "build": 12,// 构建值（数字），只可增大，不可重复，用于比对版本是否升级
                        "metaInfo":{//元信息可在里面自定义一些数据，js的版本，更新时回传
                        },
                        "updateUrl": "http://yyt.lexin580.com:8081/app_config/lx_yyt_app.zip" //js包
                    }
                ]

            }
        }

    }
}

// console.info("yyy","yyy");
HotUpdate.markSuccess();

// RNFS.mkdir(HotUpdateCus.wwwDownloadDir);