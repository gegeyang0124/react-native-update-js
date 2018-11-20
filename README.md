# react-native-update-js
热更新组件，可自行配置服务，只需在后台放个配置文件即可，也可以自写一个接口
##### 支持平台：目前只支持ios
### 安装
npm i --save react-native-update-js
### 安装依赖（必须）：
[npm i --save react-native-fs 文件操作组件](https://github.com/itinance/react-native-fs)<BR/>
[npm i --save react-native-zip-archive 解压缩组件](https://github.com/plrthink/react-native-zip-archive)<BR/>

##### HotUpdate 热更新，以下以下方法详细参数请看源文件
```
import {HotUpdate} from "react-native-update-js";
HotUpdate.host="http://....";//热更新配置文件地址或接口，//get请求
HotUpdate.checkUpdate();//检查更新
HotUpdate.downloadUpdate();//下载更新
HotUpdate.doUpdate();//更新重载应用
```

##### HotUpdate 的后台配置，（配置后台文件或接口，自由选择）例如下列示例
```
{
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
                        "version": "2.0.140",//js的版本号，只能增大
                        "metaInfo":{//元信息可在里面自定义一些数据，js的版本，更新时回传
                        },
                        "updateUrl": "http://yyt.lexin580.com:8081/app_config/lx_yyt_app.zip" //js包
                    }
                ]

        }
}
```
