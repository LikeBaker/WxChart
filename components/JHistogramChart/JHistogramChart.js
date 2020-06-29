// pages/JHistogramChart/JHistogramChart.js
/**
 * 柱状图，左右两个各有一个y轴刻度
 */

 /**
  * 统计图画布
  */
 const CHART_TAG = 0

 /**
  * 提示条
  */
 const INICATOR_CHART = 1

/**
 * 统计图四周的边距
 */
const marginAround = 16

/**
 * 标题文字高度
 */
const titleTextHei = 14

/**
 * 内容文字高度
 */
const contentTextHei = 12

/**
 * 刻度线长度
 */
const SCALElINE = 5

/**
 * y轴坐标数量
 */
const Y_AXIS_VALUE_COUNT = 5

/**
 * 横坐标展示的数据个数
 */
const MAX_VALUE_COUNT = 7

/**
 * x轴数据位置大于该值时，指示器说明文字显示在指示器左边
 */
const INDICATOR_CRITICAL_VALUE = 4

/**
 * 统计图canvas
 */
let mChartCanvas

/**
 * 指示器canvas
 */
let mIndecatorContext

/**
 * 画布高度
 */
let mHeight = 0

/**
 * 画布宽度
 */
let mWidth = 0

/**
 * 屏幕密度
 */
let mDpr = 1

/**
 * x轴起点
 */
let mAxisOriginX = 0

/**
 * y轴起点
 */
let mAxisOriginY = 0

/**
 * x轴终点
 */
let mAxisOriginEndX = 0

/**
 * y轴终点
 */
let mAxisOriginEndY = 0

/**
 * x轴当前展示的数据
 */
let xAxisValue = []

/**
 * y轴当前展示的数据
 */
let yAxisValue = []

let yAxisValueOne = []

let yAxisValueTwo = []

/**
 * x轴数据
 */
let allAxisXValue = []

/**
 * y轴数据
 */
let allAxisYValue = []

/**
 * y轴数据， 数量（万棵）
 */
let allAxisYValueOne = []

/**
 * y轴数据，数量（万公斤）
 */
let allAxisYValueTwo = []

/**
 * y轴刻度名称1
 */
let mYAxisNamesOne = []

/**
 * y轴刻度名称2
 */
let mYAxisNamesTwo = []
 
/**
 * y轴最小单位，用于计算柱形图高度等
 */
let mStepOne = 0

/**
 * y轴最小单位2
 */
let mStepTwo = 0

/**
 * x轴数据间距离
 */
let mXUnit = 0

/**
 * y轴数据间距离
 */
let mYUnit = 0

/**
 * 用于计算当前需要显示的数据
 */
let mValueIndex = 0

/**
 * 上次点击/滑动的位置
 */
let lastTouchPos = 0

/**
 * 当前点击/滑动的位置
 */
let currTouchPos = 0

Component({

  properties:{

    //组件高
    height:{
      type:Number,
      value:0
    },

    //组件宽
    width:{
      type:Number,
      value:0
    },

    title:{
      type:String,
      value:'果树详情统计'
    },

    xAxisName:{
      type:String,
      value:''
    },

    yAxisNameLeft:{
      type:String,
      value:'数量（万棵）'
    },

    yAxisNameRight:{
      type:String,
      value:'产量（万公斤）'
    },

    //todo 待传入的数据
    xAxisValues:{
      type:Array,
      value:[]
    },

    yAxisValue:{
      type:Array,
      value:[]
    }
  },

  methods:{
    //bindTouch方法必须写在methods下

    /**
     * 滑动
     */
    touchmove(e){

      // console.log(e)
      currTouchPos = e.changedTouches[0].x

      let _touchY = e.changedTouches[0].y
      if(currTouchPos > mAxisOriginX && currTouchPos < mAxisOriginEndX &&
        _touchY < mAxisOriginY && _touchY > mAxisOriginEndY){
        let diff = currTouchPos - lastTouchPos

        if(Math.abs(diff) > 10){//滑动距离超过10时，触发一次刷新
          touchRefresh(diff<0)
          lastTouchPos = currTouchPos
        }  

      } else {
        console.log('不在有效区')
      }
    },

    /**
     * 开始触摸的位置
     */
    touchstart(e){
      lastTouchPos = e.changedTouches[0].x
      showIndicator(e.changedTouches[0].x)
    },

    /**
     * 触摸事件结束
     * @param {*} e 
     */
    touchend(e){

      lastTouchPos = 0
      currTouchPos = 0

      setTimeout(()=>{
        if(mIndecatorContext != undefined) {
          clearArea(mIndecatorContext, mAxisOriginX, mAxisOriginY, 
            mAxisOriginEndX - mAxisOriginX,
            mAxisOriginEndY - mAxisOriginY)
        }
    }, 100)
      
    },

    /**
     * 设置x轴、y轴数据
     * @param {*} x x轴数据
     * @param {*} y1 y轴左边数据
     * @param {*} y2 y轴右边数据
     */
    setAxisValue(x, y1, y2){

      allAxisXValue = x

      intiDualYAxisValue(y1, y2)

      clearArea(mChartCanvas, 0, 0, mWidth, mHeight)

      //绘制标题
      drawTitle(mChartCanvas, this.properties.title)

      //绘制x、y轴
      drawAxises(mChartCanvas)

      //绘制图例
      drawLegend(mChartCanvas)

      drawAxisScale(mChartCanvas, this)

      // drawAxises(mChartCanvas)

      refresh(0) 

    }
  },

  lifetimes:{

    attached(){

      // wx.showModal({
      //   title:'attached'
      // })
      
      var _this = this

      //初始化统计图canvas
      initCanvas(this, 'scatterCanvas', CHART_TAG, (canvas)=>{

        //绘制标题
        // drawTitle(canvas, _this.properties.title)

        //绘制x、y轴
        // drawAxises(canvas)

        //绘制图例
        // drawLegend(canvas)
      })

      //初始化初始化指示器canvas
      initCanvas(this, 'IndacatorCanvas', INICATOR_CHART, null) 
    }
  }
})

/**
 * 初始化双y轴坐标
 * @param {*} y1 y轴坐标1
 * @param {*} y2 y轴坐标2
 */
function intiDualYAxisValue(y1, y2) {
  allAxisYValueOne = y1
  allAxisYValueTwo = y2
  //初始化y轴坐标(服务器已排序)
  let maxOne = Math.max.apply(null, allAxisYValueOne)
  let maxValue = Math.ceil(maxOne)
  mStepOne = parseFloat((Math.ceil(maxOne) / Y_AXIS_VALUE_COUNT).toFixed(1))


  mYAxisNamesOne.length = 0
  mYAxisNamesOne.push('0')
  mYAxisNamesOne.push((mStepOne * 1).toFixed(1))
  mYAxisNamesOne.push((mStepOne * 2).toFixed(1))
  mYAxisNamesOne.push((mStepOne * 3).toFixed(1))
  mYAxisNamesOne.push((mStepOne * 4).toFixed(1))
  mYAxisNamesOne.push(maxValue.toFixed(1))
  let maxTwo = Math.max.apply(null, allAxisYValueTwo)
  let maxValueTwo = Math.ceil(maxTwo)
  mStepTwo = parseFloat((Math.ceil(maxTwo) / Y_AXIS_VALUE_COUNT).toFixed(1))
  mYAxisNamesTwo.length = 0
  mYAxisNamesTwo.push('0')
  mYAxisNamesTwo.push((mStepTwo * 1).toFixed(1))
  mYAxisNamesTwo.push((mStepTwo * 2).toFixed(1))
  mYAxisNamesTwo.push((mStepTwo * 3).toFixed(1))
  mYAxisNamesTwo.push((mStepTwo * 4).toFixed(1))
  mYAxisNamesTwo.push(maxValueTwo.toFixed(1))
}

/**
 * 测量text宽度
 * @param {*} context 
 * @param {*} text 
 */
function measureText(context, text){
  var dimension = context.measureText(text); 
  return dimension.width
}

/** 
 * 初始化 canvas
 * tag : IndacatorCanvas-初始化提示条，
 */
function initCanvas(context, canvas, tag, response){
  wx.createSelectorQuery().in(context)
  .select('#' + canvas)
  .fields({
    node: true,
    size: true,
  }).exec(function(res){
    mDpr = wx.getSystemInfoSync().pixelRatio

    let canvas = res[0].node
    let width = res[0].width
    let height = res[0].height
    
    canvas.width = width * mDpr
    canvas.height = height * mDpr

    let ctx = canvas.getContext('2d') 
    ctx.scale(mDpr, mDpr)

    if(tag == CHART_TAG){

      //chart canvas
      mChartCanvas = ctx

      //初始化布局参数
      mHeight = canvas.height
      mWidth = canvas.width

      mAxisOriginX = marginAround + 28 //原点x坐标 todo 28提取
      mAxisOriginY = canvas.height/mDpr - marginAround - contentTextHei - marginAround - measureText(ctx, '北京北')//原点y坐标
      mAxisOriginEndX = canvas.width/mDpr - marginAround - measureText(ctx, '9999.9')//9999.9 右侧坐标文字的最大长度
      mAxisOriginEndY = marginAround + titleTextHei + marginAround + contentTextHei + marginAround

    } else if (tag == INICATOR_CHART){
      //提示条 canvas
      mIndecatorContext = ctx
    }

    if(response != null){
      response(ctx)
    }
  })
}

/**
 * 绘制标题
 * @param {*} title 标题
 */
function drawTitle(canvas, title) {
  canvas.textBaseline = 'top'
  canvas.fillStyle = '#666666'
  canvas.font = '14px Arial'//todo 同意字体、大小
  canvas.textAlign = 'left'
  canvas.fillText(title, marginAround, marginAround)
}

/**
 * 绘制图例
 */
function drawLegend(canvas){

  //todo 统一样式，提取间距
  canvas.fillStyle = '#38c8fe'
  canvas.font = '11px CourierNewPSMT'
  canvas.fillRect(mWidth/2/mDpr - marginAround/mDpr - measureText(canvas, '果树数量') - 8 - 4, mHeight/mDpr-15 , 8, 8)
  canvas.fillStyle = '#666666'
  canvas.fillText('果树数量', mWidth/2/mDpr - marginAround/mDpr - measureText(canvas, '果树数量') , mHeight/mDpr-15)

  canvas.fillStyle = '#fe9a38'
  canvas.fillRect(mWidth/2/mDpr + marginAround/mDpr, mHeight/mDpr-15 , 8, 8)
  canvas.fillStyle = '#666666'
  canvas.font = '11px CourierNewPSMT'
  canvas.fillText('果树产量', mWidth/2/mDpr + marginAround/mDpr + 8 + 4, mHeight/mDpr-15)
}

/**
 * 绘制坐标轴
 * @param {*} ctx canvas
 */
function drawAxises(ctx) {
    ctx.strokeStyle = "#999999"
    ctx.beginPath()
    ctx.moveTo(mAxisOriginX, mAxisOriginY)
    ctx.lineTo(mAxisOriginEndX, mAxisOriginY)
    // ctx.moveTo(mAxisOriginX, mAxisOriginY)
    // ctx.lineTo(mAxisOriginX, mAxisOriginEndY)
    ctx.stroke()
}

/**
 * 绘制坐标轴刻度
 * @param {*} canvas canvas
 * @param {*} that 上下文环境，用于获取自定组件的属性（坐标轴名称）
 */
function drawAxisScale(canvas, that){
 
  if(canvas == undefined) return

  //x轴
  for(let i=0; i<MAX_VALUE_COUNT; i++) {
    if(allAxisXValue[i] != undefined){
      xAxisValue.push(allAxisXValue[i])
    } else {
      xAxisValue.push('')
    }
  }
  
  //x轴数据间的宽度
  mXUnit = (mAxisOriginEndX - mAxisOriginX)/(MAX_VALUE_COUNT+1)
  //y轴数据间的宽度
  mYUnit = (mAxisOriginEndY - mAxisOriginY)/(mYAxisNamesOne.length-1)

  canvas.font = '12px CourierNewPSMT'//todo y轴 字体设置
  canvas.strokeStyle = "#999999"
  
  canvas.beginPath()
  
  //x轴名称
  // ctx.fillText(_this.properties.xAxisName, x_axis_end, axis_origin_y)
  //x轴刻度
  for(let i=0; i<MAX_VALUE_COUNT; i++) {
    canvas.moveTo(mAxisOriginX + mXUnit*(i+1),mAxisOriginY)
    canvas.lineTo(mAxisOriginX + mXUnit*(i+1),mAxisOriginY+SCALElINE)
  } 

  //y轴名称
  //todo 这里再onshow时重复绘制了
  canvas.fillStyle = '#666666'
  canvas.textAlign = 'left'
  canvas.fillText(that.properties.yAxisNameLeft, marginAround, marginAround + titleTextHei + marginAround)//todo 此处计算不完全准确
  canvas.textAlign = 'right'
  canvas.fillText(that.properties.yAxisNameRight, mWidth/mDpr - marginAround, marginAround + titleTextHei + marginAround)//todo 此处计算不完全准确
  //y轴刻度
  canvas.textAlign = 'center'
  clearArea(canvas, 0, marginAround + titleTextHei + marginAround + titleTextHei, mAxisOriginX, mAxisOriginY - mAxisOriginEndY)
  for(let i=0; i<mYAxisNamesOne.length; i++) {
    canvas.fillText(mYAxisNamesOne[i], marginAround + measureText(canvas, '月'), mAxisOriginY + (mYUnit * (i)) - measureText(canvas, '1')/2)
    canvas.fillText(mYAxisNamesTwo[i], mAxisOriginEndX + marginAround, mAxisOriginY + (mYUnit * (i)) - measureText(canvas, '1')/2)
  }
  
  canvas.stroke()
}

/**
 * 刷新统计图
 */
function refresh(index) {

  xAxisValue = allAxisXValue.slice(index, index + MAX_VALUE_COUNT)
  yAxisValueOne = allAxisYValueOne.slice(index, index + MAX_VALUE_COUNT)
  yAxisValueTwo = allAxisYValueTwo.slice(index, index + MAX_VALUE_COUNT)

  //todo 提取刷新方法
  if (mChartCanvas != undefined) {

    //重新绘制x数据
    clearArea(mChartCanvas, mAxisOriginX - SCALElINE, //清空的起始x坐标向前补偿一段距离，防止类似'京许黄毛蟠'等名字特别长的种类
      mAxisOriginY + SCALElINE, mAxisOriginEndX - mAxisOriginX, mHeight/mDpr - mAxisOriginY - SCALElINE - 20)

    //刷新x轴坐标
    for (let i = 0; i < xAxisValue.length; i++) {
      mChartCanvas.save()
      mChartCanvas.translate(mAxisOriginX + mXUnit * (i+1), mAxisOriginY)
      mChartCanvas.textAlign = 'right'
      mChartCanvas.font = '12px CourierNewPSMT'
      mChartCanvas.rotate(-45 * Math.PI / 180)
      mChartCanvas.fillStyle = '#666666'
      mChartCanvas.fillText(xAxisValue[i], 0, 0 + measureText(mChartCanvas, "北京") / 2)
      mChartCanvas.restore()
    }

    clearArea(mChartCanvas, mAxisOriginX, mAxisOriginEndY ,
       mAxisOriginEndX - mAxisOriginX, mAxisOriginY - mAxisOriginEndY)

    //y轴横线
    mChartCanvas.beginPath()
    mChartCanvas.strokeStyle='#999999'
    mChartCanvas.lineWidth = 0.5
    for(let i=1; i<mYAxisNamesOne.length; i++) {
      mChartCanvas.moveTo(mAxisOriginX, mAxisOriginY + (mYUnit * (i)))
      mChartCanvas.lineTo(mAxisOriginEndX, mAxisOriginY + (mYUnit * (i)))
    }
    mChartCanvas.stroke()

      
    //刷新y轴的值
    //数量（万棵）
    mChartCanvas.fillStyle = '#38c8fe'
    for (let i = 0; i < yAxisValueOne.length; i++) {
      mChartCanvas.fillRect(mAxisOriginX + mXUnit * (i + 1)-10, mAxisOriginY, 10, mYUnit * yAxisValueOne[i]/mStepOne)
    }

    // 产量（万公斤）
    mChartCanvas.fillStyle = '#fe9a38'
    for (let i = 0; i < yAxisValueTwo.length; i++) {
      mChartCanvas.fillRect(mAxisOriginX + mXUnit * (i + 1), mAxisOriginY, 10, mYUnit * yAxisValueTwo[i]/mStepTwo)
    }

  } else{
    console.log('chartCanvas is undefined')
  }
}

/**
 * 清空一个canvas区域
 */
function clearArea(canvas, left, top, width, height){
  canvas.clearRect(left, top, width, height)
}

/**
 * 左右滑动刷新页面
 * @param {} isLeft 滑动方向,向左/右
 */
function touchRefresh(isLeft){
  if(isLeft){
    //向左滑动
    if(mValueIndex >= (allAxisXValue.length - MAX_VALUE_COUNT)){return}

      ++mValueIndex
  } else {
    //向右滑动
    if (mValueIndex <= 0) {return}

    --mValueIndex
  }

  refresh(mValueIndex)
}

/**
 * 显示提示条
 */
function showIndicator(x){
  
  if(x>mAxisOriginX + mXUnit/2 && x<mAxisOriginEndX - mXUnit/2) {
    let _index = (x - mAxisOriginX - mXUnit/2)/mXUnit

    if(mIndecatorContext != undefined) {
      let ctx = mIndecatorContext
      
      //绘制指示器
      ctx.beginPath()
      ctx.moveTo(mAxisOriginX + mXUnit*(parseInt(_index)+1), mAxisOriginY)
      ctx.lineTo(mAxisOriginX + mXUnit*(parseInt(_index)+1), mAxisOriginEndY)
      ctx.strokeStyle = 'red'
      ctx.stroke()

      //如果点击位置大于INDICATOR_CRITICAL_VALUE，则说明内容显示在左侧
      let _indicatorStart, _indicatorWidth, _indecatorTextStart
      if(_index < INDICATOR_CRITICAL_VALUE) {
        //todo 指示器尺寸、边距提取
        _indicatorStart = mAxisOriginX + mXUnit*(parseInt(_index)+1) + 8
        _indicatorWidth = 100
        _indecatorTextStart = mAxisOriginX + mXUnit*(parseInt(_index)+1) + 8 + 4
      } else {
        //todo 同上
        _indicatorStart = mAxisOriginX + mXUnit*(parseInt(_index)+1) - 8
        _indicatorWidth = -100
        _indecatorTextStart = mAxisOriginX + mXUnit*(parseInt(_index)+1) + 8 - 4 - 100
      }

      ctx.beginPath()
      ctx.fillStyle= "#00000066"
      ctx.fillRect(_indicatorStart,  mAxisOriginEndY + 8 ,_indicatorWidth,60)

      // ctx.rect(_indicatorStart, mAxisOriginEndY + 8 ,_indicatorWidth,60);
      ctx.strokeStyle="#00000066"
      ctx.stroke()
      
      ctx.font = "12px Arial";
      ctx.fillStyle='white'

      ctx.fillText(xAxisValue[parseInt(_index)], _indecatorTextStart, mAxisOriginEndY + 8 + 14)
      ctx.font = "10px Arial";
      let _quantity = yAxisValueOne[parseInt(_index)]
      let _output = yAxisValueTwo[parseInt(_index)]

      //todo toFixed 貌似没有四舍五入
      ctx.fillText('果树数量:' + _quantity.toFixed(2), _indecatorTextStart, mAxisOriginEndY + 8 + 32)
      ctx.fillText('果树产量:' + _output.toFixed(2), _indecatorTextStart, mAxisOriginEndY + 8 + 32 + 8 + measureText(ctx, '果'))

    } else {
      console.log('mIndecatorContext == undefined')
    }  
  } else {
    console.log('无效区域')
  }
}


