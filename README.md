# schartjs
>moblie charts js by svg

## todo list

 
### 属性
======
 * type string 图表类型
 * is_full bool 是否全屏
 * data object 数据
 * data.legend array 图例
 * data.avg int 平均值
 * data.item array 每一个数据
 * data.item.name string 每一个数据的名字
 * data.item.compare array 每一个数据的对比数据
 * data.item.num|data.item.compare.num string 每一个数据的值
 * data.item.extra|data.item.compare.extra string 每一个数据附带的信息
 * msg string|array 无数据提示语    

### 事件
=======
 * onFinish   图像绘制好之后

### 方法
=========
 * drawTip  画tip
 * clear  清除图像
 
 
## feature

* touchEvent
* tip
* fluency
* 图形种类

==============
 * 条形图   bar
 * bar Progress
 * 数据超出屏幕

==============
 * 柱状图 cloum
 * column mixavg(单独一个方法)
 * 数据单独一个svg
 * 数据超出屏幕
 * 全屏后只延长数据
 
 
==============
 * 扇形图
 * pie  Loop
 * 没有背景
 
 
==============
 * 折线图
 * line
 
 test
 
 
 