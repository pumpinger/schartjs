# schartjs
>moblie charts js by svg

## 2.0 todo list

 
###属性
======
 * type string 图表类型
 * is_full bool 是否全屏
 * data object 数据
 * data.legend array 图例
 * data.avg int 平均线
 * data.item array 每一个数据
 * data.item.name string 每一个数据的名字
 * data.item.compare array 每一个数据的对比数据
 * data.item.num|data.item.compare.num string 每一个数据的值
 * data.item.extra|data.item.compare.extra string 每一个数据附带的信息
 * msg string|array 无数据提示语    
 * img string 无数据图片    

###事件
=======
 * onFinish   图像绘制好之后

###方法
=========
 * drawTip  画tip
 * clear  清除图像
 
 
## feature
* touchEvent
* tip
* fluency
