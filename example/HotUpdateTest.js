import {
    Platform,
} from 'react-native';

import {Tools} from "./Tools";
import {Alert} from "./Alert";
import RNFS from "react-native-fs";

import {
    packageVersion,
    currentVersion,
    mainBundleFilePath,
    HotUpdate,
} from "react-native-update-js";
import DeviceInfo from "react-native-device-info";
import {LocalStorage} from "./LocalStorage";
import {ProgressPerApi} from "./ProgressPerApi";

HotUpdate.tag = "lx_yyt";//热更新的标志 与后台配置一致
HotUpdate.host = "http://yyt.yyy.com:8081/XXX/XXX.json";//数据请求接口或配置文件（get请求）

/**
 * 热更新，提供热更新各种方法,自己配置服务器
 * **/
export class HotUpdateCus{

    static appID = null;//当前给app指定（分配）的id

    static wwwDownloadDir = Platform.OS == "ios"
        ? `${RNFS.DocumentDirectoryPath}/wwwRoot`
        : `${RNFS.ExternalStorageDirectoryPath}/wwwRoot`;//下载目录

    static update = {
        code1:777,//777、立刻更新；888、立刻强制更新；999、立刻静默更新
        code2:888,//777、立刻更新；888、立刻强制更新；999、立刻静默更新
        code3:999,//777、立刻更新；888、立刻强制更新；999、立刻静默更新
        reboot1:555,//666、强制使用更新；555、用户决定是否使用更新;333、下次启用更新 默认是555
        reboot2:666,//666、强制使用更新；555、用户决定是否使用更新;333、下次启用更新 默认是555
        reboot3:333,//666、强制使用更新；555、用户决定是否使用更新;333、下次启用更新 默认是555
        execute:false,//是否监听更新
        version:currentVersion,//当前已更新的版本号
    }
    static timer = null;

    /**
     * 持续检测是否有更新
     * **/
    static checkUpdateLoop(){
        setInterval(()=>{
            if(HotUpdateCus.update.execute){
                // console.info("HotUpdate","HotUpdate");
                HotUpdateCus.checkUpdate();
            }
        },10000);
    }

    /**
     * 检查更新
     * @Param cd func,//回调函数
     * @Param cdUpdate func,//更新回调函数
     * **/
    static checkUpdate = (cd,cdUpdate) => {
        if(true){

            HotUpdate.checkUpdate()
                .then(info=>{

                    // alert(JSON.stringify(info))
                    info.metaInfo.code = typeof info.metaInfo.code == 'number'
                        ? info.metaInfo.code
                        : HotUpdateCus.update.code1;
                    info.metaInfo.reboot = typeof info.metaInfo.reboot == 'number'
                        ? info.metaInfo.reboot
                        : HotUpdateCus.update.reboot1;

                    if(!HotUpdateCus.appID || !Tools.isCurStruct){
                        // info.metaInfo.code = 888;
                        // info.metaInfo.reboot = 666;
                    }

                    if (info.expired) {
                        cdUpdate&&cdUpdate();
                        if(HotUpdateCus.isHasUpdate(info)){
                            HotUpdateCus.update.execute = false;
                            switch (info.metaInfo.code)
                            {
                                case HotUpdateCus.update.reboot1:{

                                    Alert.alert('检查到新的静态版本'+info.packageVersion+'\n是否下载?',
                                        info.description, [
                                            {text: '确定', onPress: ()=>{
                                                    HotUpdateCus.updateDelay(false);
                                                    HotUpdate.downloadUpdate();
                                                }
                                            },
                                            {text: '取消', onPress: ()=>{
                                                    cd&&cd();
                                                    HotUpdateCus.updateDelay();
                                                }
                                            },
                                        ]);

                                    break;
                                }
                                default:{
                                    HotUpdateCus.updateDelay(false);
                                    HotUpdate.downloadUpdate();
                                    break;
                                }
                            }
                        }

                    }
                    else if(info.update){
                        HotUpdateCus.checkHasUpate(info,(info)=>{
                            HotUpdateCus.update.execute = false;

                            switch (info.metaInfo.code)
                            {
                                case HotUpdateCus.update.code1: {
                                    cdUpdate&&cdUpdate();
                                    if(HotUpdateCus.update.version !== info.version){
                                        Alert.alert('检查到新的版本'+info.version+'\n是否下载?',
                                            info.description, [
                                                {text: '是', onPress: ()=>{

                                                        HotUpdateCus.doUpdate(info,cd,info.metaInfo.reboot);
                                                    }},
                                                {text: '否', onPress:()=>{
                                                        HotUpdateCus.updateDelay();
                                                        cd&&cd();
                                                    }
                                                },
                                            ]);
                                    }

                                    break;
                                }
                                case HotUpdateCus.update.code2:{
                                    cdUpdate&&cdUpdate();
                                    HotUpdateCus.doUpdate(info,cd,info.metaInfo.reboot);
                                    break;
                                }
                                case HotUpdateCus.update.code3:{
                                    if(info.metaInfo.reboot !== HotUpdateCus.update.reboot3){
                                        cdUpdate&&cdUpdate();
                                    }
                                    HotUpdateCus.doUpdate(info,cd,info.metaInfo.reboot);
                                    break;
                                }
                            }
                        },cd);
                    }
                });
        }
    };

    /**
     * 是否有更新版本
     * @prama info json;//后台返回的数据
     * @prama resolve func;//有更新时的回调函数 回传与info一样的数据格式
     * @prama reject func;//没有更新时的回调函数 回传与info一样的数据格式
     * @prama index int;info.publishJS的下标 可不传
     * **/
    static checkHasUpate(info,resolve:Function,reject:Function,index=0){
        if(info.version > HotUpdateCus.update.version){

            if(this.isHasUpdate(info)){
                resolve&&resolve(info);
            }
            else
            {
                if(++index < info.publishJS.length){
                    let updateInfo = Object.assign({},info,info.publishJS[index]);
                    this.checkHasUpate(updateInfo,resolve,reject,index);
                }
                else
                {
                    reject&&reject();
                }
            }

        }
        else
        {
            reject&&reject();
        }
    }

    /**
     * 是否有更新版本
     * @prama info json;//后台返回的数据
     * return boolean;//有:返回true,反之false
     * **/
    static isHasUpdate(info){
        let update = false;
        if(info.metaInfo.updateList){
            info.metaInfo.updateList.forEach((v)=>{
                if(this.appID == v){
                    update = true;
                }
            });
        }
        else {
            //更新全部
            update = true;
        }

        if(info.metaInfo.updateNoList){
            info.metaInfo.updateNoList.forEach((v)=>{
                if(this.appID == v){
                    update = false;
                }
            });
        }

        return update;
    }

    /**
     * 更新延迟
     * @parma toast bool,//是否提示信息
     * **/
    static updateDelay(toast=true){
        if(!HotUpdateCus.timer){
            toast?Tools.toast("更新询问延迟1分钟！"):null;
            HotUpdateCus.timer = setTimeout(()=>{
                HotUpdateCus.update.execute = true;
                HotUpdateCus.timer = null;
            },60000);
        }
    }

    /**
     * 更新应用
     * @Param cd func,//回调函数
     * **/
    static doUpdate = (info,cd,reboot) =>{

        HotUpdate.downloadUpdate(info,(per)=>{
            ProgressPerApi.show(per);
        })
            .then(info => {
                ProgressPerApi.hide();
                LocalStorage.save(Tools.app_config.versionkey,
                    info.version).then((dataSave)=>{

                    switch (reboot)
                    {
                        case HotUpdateCus.update.reboot1:{
                            Alert.alert('提示', '下载完毕,是否重启应用?', [
                                {text: '是', onPress: ()=>{
                                        Tools.cutLogin = true;
                                        if(!Tools.isCurStruct){
                                            LocalStorage.save(DeviceInfo.getVersion(),
                                                DeviceInfo.getVersion())
                                                .then((dataSave)=>{
                                                    HotUpdate.doUpdate(info);
                                                });
                                        }
                                        else
                                        {
                                            HotUpdate.doUpdate(info);
                                        }
                                    }},
                                {text: '否', onPress:()=>{
                                        LocalStorage.save(Tools.app_config.versionkey,
                                            Tools.app_config.version);
                                        HotUpdateCus.updateDelay();
                                        cd&&cd();

                                    }
                                },
                                {text: '下次启动时更新', onPress: ()=>{

                                        HotUpdateCus.update.version = info.version;
                                        HotUpdateCus.update.execute = true;
                                        if(!Tools.isCurStruct){
                                            LocalStorage.save(DeviceInfo.getVersion(),
                                                DeviceInfo.getVersion())
                                                .then((dataSave)=>{
                                                    HotUpdate.doUpdate(info,false);
                                                    cd&&cd();
                                                });
                                        }
                                        else
                                        {
                                            HotUpdate.doUpdate(info,false);
                                            cd&&cd();
                                        }
                                    }
                                },
                            ]);
                            break;
                        }
                        case HotUpdateCus.update.reboot2:{
                            Tools.cutLogin = true;
                            if(!Tools.isCurStruct){
                                LocalStorage.save(DeviceInfo.getVersion(),
                                    DeviceInfo.getVersion())
                                    .then((dataSave)=>{
                                        HotUpdate.doUpdate(info);
                                    });
                            }
                            else
                            {
                                HotUpdate.doUpdate(info);
                            }

                            break;
                        }
                        case HotUpdateCus.update.reboot3:{
                            if(info.metaInfo.finishInfo){
                                Alert.alert("更新完成",info.metaInfo.finishInfo+"");
                            }
                            HotUpdateCus.update.version = info.version;
                            HotUpdateCus.update.execute = true;
                            if(!Tools.isCurStruct){
                                LocalStorage.save(DeviceInfo.getVersion(),
                                    DeviceInfo.getVersion())
                                    .then((dataSave)=>{
                                        cd&&cd();
                                        HotUpdate.doUpdate(info,false);
                                    });
                            }
                            else
                            {
                                cd&&cd();
                                HotUpdate.doUpdate(info,false);
                            }

                            break;
                        }
                    }
                });



            }).catch(err => {
            // Tools.toast('更新失败!');
            cd&&cd();
        });
    }



}

// RNFS.mkdir(HotUpdateCus.wwwDownloadDir);