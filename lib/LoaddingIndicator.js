import React,{Component} from 'react';
import PropTypes  from 'prop-types';
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Modal,
    Dimensions,
    Animated,
    Easing,
    Text
} from 'react-native';
import RootSiblings from 'react-native-root-siblings'
var {width, height} = Dimensions.get('window');

export default class LoaddingIndicator extends Component{
    static animated = true
    static message = '数据加载中 ..';
    static loadding = false;
    static countShow = 0;
    static countHide = 0;
    static showingDialog = null;

    /**
     * 显示菊花
     * @param animated 是否显示出现和消失动画
     * @param message 菊花底部文字
     * @returns {SiblingsManager}
     */
    static show(animated=true, message){
        this.countShow++;
        if(this.loadding && this.showingDialog != null){
            return this.showingDialog;
        }

        this.loadding = true;
        LoaddingIndicator.animated = animated;
        LoaddingIndicator.message = message !=null? message: LoaddingIndicator.message;

        this.showingDialog = new RootSiblings(<IndicatorActivity
            animated={LoaddingIndicator.animated}
            message={LoaddingIndicator.message}
        />)


        return this.showingDialog;
    }

    /**
     * 隐藏菊花
     * @param AIV 需要隐藏的菊花
     */
    static hide(AIV){

        if (this.showingDialog != null && this.showingDialog instanceof RootSiblings) {

            // console.info("this.countHide=" + this.countHide + ",this.countShow=",this.countShow);

            if(++this.countHide == this.countShow){
                this.loadding = false;
                // showingDialog.update(<IndicatorActivity
                //     animated={LoaddingIndicator.animated}
                //     message={LoaddingIndicator.message}
                //     isHide={true}
                //
                // />)
                //
                // showingDialog = null;
                this.showingDialog.destroy();
                this.showingDialog = null;
            }

            // if (AIV instanceof RootSiblings) {
            //
            //     AIV.update(<IndicatorActivity
            //         animated={LoaddingIndicator.animated}
            //         message={LoaddingIndicator.message}
            //         isHide={true}
            //     />)
            // }
        }
    }

    /**
     * 更新菊花文字
     * @param AIV 需要更新文字的菊花
     * @param message 文字内容
     */
    static  updateMessage(AIV,message){
        AIV.update(<IndicatorActivity
            animated={KActivityIndicator.animated}
            message={message}
        />)
    }

};

/**
 * 菊花内部模块
 */
class IndicatorActivity extends Component{
    static ANIMATED_DURATION = 250;

    constructor(props) {
        super(props);
        this.state = {
            opacity:new Animated.Value(0)
        };
    }

    static defaultProps={
        animated:true,
        isHide:false

    }
    static propTypes={
        animated:PropTypes.bool,
        message:PropTypes.string,
        updateMessage:PropTypes.func,
        isHide:PropTypes.bool
    }
    render(){
        return(
            <View style={[styles.background,this.props.styles]}>
                <Animated.View style={[styles.activeBg,{opacity:this.state.opacity}]}>
                    {
                        this.props.animated&&<ActivityIndicator
                            animating={this.props.animated}
                            size="large"
                        />
                    }
                    {this._messageView()}
                </Animated.View>
            </View>
        )

    }
    _messageView(){
        if (this.props.message){
            return(
                <Text style={styles.message}>
                    {this.props.message}
                </Text>
            )
        }
    }
    componentDidMount() {
        this._show();

    }

    componentDidUpdate() {
        if (this.props.isHide) {
            this._hide()
        }
    }
    componentWillUnmount(){
        this._hide();
    };
    _show(){
        Animated.timing(this.state.opacity,{
            toValue: 1,
            duration: this.props.animated ? IndicatorActivity.ANIMATED_DURATION : 0,
            easing: Easing.out(Easing.ease)
        }).start()

    }
    _hide(){
        Animated.timing(this.state.opacity, {
            toValue: 0,
            duration: this.props.animated ? IndicatorActivity.ANIMATED_DURATION : 0,
            easing: Easing.in(Easing.ease)
        }).start(({finished})=>{
            if(finished){
                this.props.siblingManager.destroy()
            }
        });
    };
}




const styles = StyleSheet.create({
    background:{
        backgroundColor:'rgba(0,0,0,0.05)',
        justifyContent:'center',
        alignItems:'center',
        position:'absolute',
        width:width,
        height:height,
        left:0,
        top:0
    },
    activeBg:{
        padding:15,
        backgroundColor:'black',
        borderRadius:7,
        justifyContent:'center',
        alignItems:'center'
    },
    message:{
        color:'white',
        fontSize:15,
        marginTop:5,
        opacity:0.8
    }

});
