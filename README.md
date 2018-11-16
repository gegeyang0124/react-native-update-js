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