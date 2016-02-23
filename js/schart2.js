;(function(){
    window.sChartDraw = function (option, callback) {
        //判断是否可图
        if(!drawAble()){
            return false;
        }

        //初始化参数，赋默认值等。
        initParameter();

        //定义Draw函数的局部变量
        var svg = Snap(option.svg);//snap对象
        var svgDom = $(option.svg);//jQuery对象
        var svgData ={};//svg画图数据
        console.log("svg",svg);
        console.log("svgDom",svgDom);
        console.log("svgData",svgData);

        //计算画图信息
        initSvgData();

        //开始画图
        beginDrawing();

//------------------ Functions ---------------------//
        //旧函数，参考
        function drawLine0(dom, data, legend, fun, option, nodataStr) {
            var svg = Snap(dom);
            var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
            var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
            var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 23, cl = 10, cr = vw - 10;   //图表区域  top  bottom  left right
            var cperv, cperx, cline = 5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
            var isHome = _getParam(option, 'isHome', false);
            var isfull = _getParam(option, 'isfull', false);
            var iscompre;   //是否是比较  画双线
            var smpdata;   //采样数据  画背景线
            var touchtime;

            beginChart();

            function beginChart() {
                if (!_init(svg, data, nodataStr)) {
                    return false;
                }
                if (typeof  fun != "function") {
                    fun = function () {
                    };
                }
                iscompre = legend.length == 2;
                //取 长度长的线条为  采样
                if (iscompre) {
                    smpdata = data.k1.length > data.k2.length ? data.k1 : data.k2;
                } else {
                    smpdata = data;
                }
                if (smpdata.length > 1) {
                    cperx = (cr - cl) / (smpdata.length - 1);
                } else {
                    cperx = cr - cl;
                }
                initData();
            }

            function initData() {
                var max = 0;
                $.each(data, function (i, v) {
                    if (iscompre) {
                        $.each(v, function (j, w) {
                            max = dealData(w.price, max);
                        })
                    } else {
                        max = dealData(v.price, max);
                    }
                });


                if (!max) {
                    return _errImage(svg, nodataStr);
                }


                cperv = _getPerV(max, cline);


                chartSuccess(dom, 'line');
                drawBgLine();
                drawDataLine();
                bindEvent();

            }


            function dealData(v, max) {
                var val = parseFloat(v);
                return val > max ? val : max;
            }


            function bindEvent() {
                if (isPc) {
                    svg.mousemove(function (e) {
                        var x = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                        popTip(x);

                    });

                    $(svg.node).mouseleave(function () {
                        fadeTip();
                    });

                } else {
                    svg.touchstart(function (e) {
                        var x = e.touches[0].clientX;

                        touchtime = setTimeout(function () {
                            popTip(x);
                            svg.touchmove(function (e) {
                                e.preventDefault();
                                var x = e.touches[0].clientX;
                                popTip(x);

                            });
                        }, 100);

                        svg.touchmove(function (e) {
                            clearTimeout(touchtime);
                        });

                    });


                    svg.touchend(function () {
                        svg.untouchmove();
                        fadeTip();
                        clearTimeout(touchtime);

                    });
                }
            }

            function popTip(x) {

                var index = getCurIndex(x);

                var lastIndex = $('.svglinetip').attr('svglineid');
                if (lastIndex != index) {
                    $('.svglinetip').remove();
                    $('.svglinemaker').hide();
                    drawTip(index);
                }


            }

            function fadeTip() {
                $('.svglinetip').remove();
                $('.svglinemaker').show();
                fun();
            }

            function drawOneTip(index, tipdata, isK2) {
                var poiontx = index * cperx + cl;
                var poionty = getDataY(tipdata.price);

                if (!isK2) {
                    var tipLine = svg.line(poiontx, cb, poiontx, tb).attr({
                        stroke: isHome ? "#6ba8e1" : "#d2d2d2",
                        strokeWidth: 2.5
                    });
                }

                var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                    stroke: isHome ? "#fff" : isK2 ? "#f5a25c" : "#2484ce",
                    strokeWidth: 2,
                    fill: isHome ? "#47a8ef" : "#fff"
                });
                var rect = svg.paper.rect(poiontx, isK2 ? tb + 1 : tt, 100, tb - tt, 4).attr({
                    fill: isHome ? "#fff" : isK2 ? "#f5a25c" : "#47a8ef"
                });

                var text = svg.paper.text(poiontx, isK2 ? 2 * tb - tt - (tb - tt - 14) / 2 : tb - (tb - tt - 14) / 2, [tipdata.name + ':　', "￥", _formatMoney(tipdata.price) + "　", tipdata.num, "笔"]).attr({
                    fill: isHome ? "#2484ce" : "#fff",
                    fontSize: 14
                });


                text.select("tspan:nth-child(2)").attr({
                    fontSize: isHome ? 12 : 10
                });
                text.select("tspan:nth-child(5)").attr({
                    fontSize: isHome ? 12 : 10
                });
                var textw = text.getBBox().width;
                var rectw = textw + 20;
                var rectleft = poiontx - rectw / 2;


                if (rectleft < 0) {
                    rectleft = 0;
                } else if (rectleft > vw - rectw) {
                    rectleft = vw - rectw;
                }

                rect.attr({
                    width: rectw,
                    x: rectleft
                });
                text.attr({
                    x: (rectw - textw) / 2 + rectleft
                });

                var tip = svg.paper.g();
                if (!isK2) {
                    tip.add(tipLine);
                }
                tip.add(tipcircel, rect, text);
                tip.attr('class', "svglinetip");
                tip.attr('svglineid', index);
            }

            function drawDoubleTip(index) {
                if (data.k1[index] != undefined) {
                    drawOneTip(index, data.k1[index]);
                }
                if (data.k2[index] != undefined) {
                    drawOneTip(index, data.k2[index], true);
                }
            }

            function drawTip(index) {
                if (iscompre) {
                    fun([data.k1[index], data.k2[index]]);
                    drawDoubleTip(index);
                } else {
                    fun(data[index]);
                    drawOneTip(index, data[index]);

                }
            }


            function getCurIndex(x) {
                var cx = (x / $(svg.node).width()) * vw;//对于图表 在viewbox中的x

                if (cx <= cl) {
                    cx = cl;
                }
                if (cx >= cr) {
                    cx = cr - 1;
                }

                var index = Math.floor((cx - cl) / cperx);
                if ((cx - cl) % cperx > cperx / 2 && smpdata.length != 1) {
                    index++;
                }
                return index;
            }

            function drawDataLine() {
                var initpath = 'M' + cl + ' ' + cb;
                var init2path = 'M' + cl + ' ' + cb;     //最初底部一条直线
                var datapath;
                var data2path;

                //起点
                if (!iscompre) {
                    var marker = svg.circle(2, 2, 1.2).attr({
                        stroke: isHome ? "#ffffff" : "#2484ce", //深蓝
                        strokeWidth: 1,
                        fill: isHome ? "#2484ce" : "#ffffff",
                        'class': "svglinemaker"
                    });
                    var makerend = marker.marker(0, 0, 4, 4, 2, 2);

                    datapath = 'M' + cl + ' ' + getDataY(data[0].price);

                    //只有一个点的时候
                    if (smpdata.length == 1) {
                        datapath += 'L' + (cperx + cl) + ' ' + getDataY(data[0].price);
                        initpath += 'L' + (cperx + cl) + ' ' + cb;
                    }

                } else {

                    datapath = 'M' + cl + ' ' + getDataY(data.k1[0].price);
                    data2path = 'M' + cl + ' ' + getDataY(data.k2[0].price);
                }


                //中间节点
                for (var i = 1; i < smpdata.length; i++) {
                    if (iscompre) {
                        if (data.k1[i] != undefined) {
                            datapath += 'L' + (cperx * i + cl) + ' ' + getDataY(data.k1[i].price);
                            initpath += 'L' + (cperx * i + cl) + ' ' + cb;
                        }
                        if (data.k2[i] != undefined) {
                            data2path += 'L' + (cperx * i + cl) + ' ' + getDataY(data.k2[i].price);
                            init2path += 'L' + (cperx * i + cl) + ' ' + cb;
                        }

                    } else {
                        if (data[i] != undefined) {
                            datapath += 'L' + (cperx * i + cl) + ' ' + getDataY(data[i].price);
                            initpath += 'L' + (cperx * i + cl) + ' ' + cb;
                        }
                    }
                }


                //画线
                _drawDataShandow(initpath, datapath);

                var dataLine = svg.path(initpath).attr({
                    stroke: isHome ? "#fffbcb" : "#47a8ef", // 浅黄 浅蓝
                    strokeWidth: 2.5,
                    fill: 'none',
                    strokeLinejoin: 'bevel',
                    markerEnd: makerend
                });
                if (iscompre) {
                    var data2Line = svg.path(init2path).attr({
                        stroke: isHome ? "#ffffff" : "#f5a25c",   //黄色
                        strokeWidth: 2.5,
                        fill: 'none',
                        strokeLinejoin: 'bevel'
                    });
                }


                //动画
                var endText = svg.g().attr({
                    'class': "svglinemaker"
                });   //在外部声明  可以放在 clear 清除不了
                dataLine.animate({
                    path: datapath
                }, 800, mina.easeinout, function () {
                    if (!iscompre) {
                        _drawDateEndText(endText);
                    }
                });
                if (iscompre) {
                    data2Line.animate({
                        path: data2path
                    }, 800, mina.easeinout);
                }

            }

            function _drawDateEndText(endText) {
                //这里 data是 无对比的
                var val = data[data.length - 1].price;
                var endpointY = parseFloat(data[data.length - 1].price);
                var offsetText = endpointY > (cperv * cline) / 1.3 ? 24 : -18;
                var rect = svg.rect(vw, getDataY(val) + offsetText - 13, 0, 17, 10, 10).attr({
                    fill: isHome ? "#ffffff" : "#89c058"
                });
                var text = svg.text(vw, getDataY(val) + offsetText, ["￥", _formatMoney(val)]).attr({
                    fill: isHome ? "#2f81d6" : "#ffffff",
                    fontSize: 12
                });
                text.select('tspan').attr('font-size', '11');
                rect.attr({
                    x: cr - text.getBBox().width - 5,
                    width: text.getBBox().width + 10
                });
                text.attr({
                    x: cr - text.getBBox().width
                });
                endText.add(rect, text);
            }

            function _drawDataShandow(initpath, datapath) {
                var initPath = initpath + 'V' + cb + 'H' + cl;
                var shandowPath = datapath + 'V' + cb + 'H' + cl;
                var path = svg.path(initPath).attr({
                    stroke: 'none',
                    fill: isHome ? svg.paper.gradient("l(0, 0, 0,1 )#ffffff-#2884D3") : '#47a8ef',
                    fillOpacity: isHome ? '0.3' : '0.1',
                    strokeLinejoin: 'bevel',
                    strokeLinecap: 'round'
                });
                path.animate({
                    path: shandowPath
                }, 800, mina.easeinout);
            }

            function _drawBgLeft() {
                var lineh = (cb - ct) / cline;
                var bgLine = svg.line(cl, cb, cr, cb).attr({
                    stroke: isHome ? '#519ddb' : '#e2e2e2',
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });
                for (var i = 1; i <= cline; i++) {
                    var h = cb - i * lineh;

                    bgLine.clone().attr({
                        x1: cl,
                        y1: h,
                        x2: cr,
                        y2: h
                    });

                    svg.text(cl, h + 13, _formatMoney(cperv * i)).attr({
                        fill: isHome ? '#7abfe9' : fontColor,
                        fontSize: 10
                    });
                }
            }

            function _drawBgBottom() {
                var style = svg.paper.g().attr({
                    fill: isHome ? '#7abfe9' : fontColor,
                    fontSize: 10
                });

                //画底部 总是 取 被比较的数据
                var curdata = iscompre ? data.k1 : data;

                if (!curdata.length) {
                    console.log('s:k1无数据,画不出底部刻度');
                    return false;
                }

                var longs = curdata[0].name.indexOf('~') + 1;
                var showarr = _getBgShowTime();
                //todo
                if (longs != 0 && showarr.length > 4 && vw < 660) {
                    var firsttext1 = svg.text(0, cb + 12, curdata[0].name.substr(0, longs));
                    var firsttext2 = svg.text(0, cb + 22, curdata[0].name.substr(longs));
                    var lasttext1 = svg.text(vw, cb + 12, curdata[curdata.length - 1].name.substr(0, longs));
                    var lasttext2 = svg.text(vw, cb + 22, curdata[curdata.length - 1].name.substr(longs));
                    style.add(firsttext1, lasttext1, firsttext2, lasttext2);

                    lasttext1.attr({
                        x: vw - lasttext1.getBBox().width
                    });
                    lasttext2.attr({
                        x: vw - lasttext1.getBBox().width
                    });
                    //中间要显示出来日期的点
                    for (var i = 1; i < showarr.length - 1; i++) {
                        var midtext1 = svg.text(cperx * showarr[i] + cl, cb + 12, curdata[showarr[i]].name.substr(0, longs));
                        var midtext2 = svg.text(cperx * showarr[i] + cl, cb + 22, curdata[showarr[i]].name.substr(longs));
                        midtext1.attr({
                            x: cperx * showarr[i] + cl - midtext1.getBBox().width / 2
                        });
                        midtext2.attr({
                            x: cperx * showarr[i] + cl - midtext1.getBBox().width / 2
                        });
                        style.add(midtext1, midtext2);
                    }

                } else {
                    var firsttext = svg.text(0, cb + 12, curdata[0].name);
                    var lasttext = svg.text(vw, cb + 12, curdata[curdata.length - 1].name);
                    style.add(firsttext, lasttext);

                    lasttext.attr({
                        x: vw - lasttext.getBBox().width
                    });

                    //中间要显示出来日期的点

                    for (var j = 1; j < showarr.length - 1; j++) {
                        var midtext = svg.text(cperx * showarr[j] + cl, cb + 12, curdata[showarr[j]].name);
                        midtext.attr({
                            x: cperx * showarr[j] + cl - midtext.getBBox().width / 2
                        });
                        style.add(midtext);
                    }
                }
            }

            function drawBgLine() {
                _drawBgLeft();
                _drawBgBottom();
            }

            function _getBgShowTime() {
                var show = [];
                var per = smpdata.length - 1;
                var offset;   //几个为一段
                var avg;  //分成几段

                if (!per || !(per - 1)) {
                    avg = 1;
                } else if (!(per % 5)) {
                    avg = 5;
                } else if (!(per % 4)) {
                    avg = 4;
                } else if (!(per % 3)) {
                    avg = 3;
                } else if (!((per - 1) % 5)) {
                    avg = 5;
                } else if (!((per - 1) % 4)) {
                    avg = 4;
                } else if (!((per - 1) % 3)) {
                    avg = 3;
                } else if (!(per % 2)) {
                    avg = 2;
                } else if (!((per - 1) % 2)) {
                    avg = 2;
                } else {
                    console.log('s:均分日期未成功');
                    return _err(svg, '数据异常');
                }


                offset = Math.floor(per / avg);
                for (var i = 0; i < avg; i++) {
                    show.push(offset * i);
                }
                //如果不能均分  最后一段 多分配一个
                var last = offset * avg;
                if ((per % avg)) {
                    last++;
                }
                show.push(last);

                return show;
            }

            function getDataY(val) {
                if (val) {
                    val = parseFloat(val);
                    return cb - (val / (cperv * cline)) * (cb - ct);
                }
                return cb;
            }

            function _getPerV(max, cline) {
                if (max == 0) {
                    return 1;
                }

                var per = max / cline;   //每条线的间隔
                var mod;   //取整系数
                if (per > 10000) {
                    mod = 5000;
                } else if (per > 5000) {
                    mod = 1000;
                } else if (per > 2000) {
                    mod = 500;
                } else if (per > 500) {
                    mod = 100;
                } else if (per > 100) {
                    mod = 20;
                } else if (per > cline) {
                    mod = 10;
                } else {
                    mod = 1;
                }
                return Math.ceil(per / mod) * mod;
            }

            function _formatNumber(v) {
                var fmtv;
                if (v >= 100000) { //10w
                    if (v >= 100000000) {  //亿
                        if (v >= 10000000000) {  //百亿
                            fmtv = Math.round(v / 100000000);
                            return [fmtv.toString(), '亿'];
                        }
                        fmtv = Math.round(v / 10000000);
                        return [fmtv.toString().slice(0, -1), '亿', fmtv.toString().slice(-1)];
                    }
                    if (v >= 1000000) {  //百万
                        fmtv = Math.round(v / 10000);
                        return [fmtv.toString(), '万'];
                    }
                    fmtv = Math.round(v / 1000);
                    return [fmtv.toString().slice(0, -1), '万', fmtv.toString().slice(-1)];
                }
                return [v.toString()];
            }

            function _formatMoney(num) {
                var numArr = _formatNumber(parseInt(num));
                var money;
                if (numArr[0].length > 3) {
                    for (var i = 3; i < numArr[0].length; i += 4) {
                        money = numArr[0].slice(0, -i) + ',' + numArr[0].slice(-i);
                    }
                } else {
                    money = numArr[0];
                }
                if (numArr[2]) {
                    money += '.' + numArr[2];
                }
                if (numArr[1]) {
                    money += numArr[1];
                }
                return money;
            }

        }

        //判断是否可图
        function drawAble(){
            if (!option.svg || !(option.data || option.noDataMsg)) {
                return false;
            }else{
                return true;
            }
        }

        //初始化参数，赋默认值等。
        function initParameter(){
            callback = (typeof callback == "function") ? callback : function(){};
            option.legend = (option.legend) ? option.legend : ['呵呵','嘻嘻哈哈嘿嘿'];
            option.noDataMsg = (option.noDataMsg) ? option.noDataMsg : ['呵呵','嘻嘻哈哈嘿嘿'];
        }

        //计算画图信息
        function initSvgData(){
            //提示框顶部到头部距离 提示框底部到头部距离
            svgData.tipTop = 0;
            svgData.tipBottom = 60;

            //图表区域
            svgData.chartLeft = 10;
            svgData.chartRight = svgDom.width() - 10;
            svgData.chartTop = svgData.tipBottom + 10;
            svgData.chartBottom =  svgDom.height() - 10;

            //坐标系
            svgData.valueAmount = 5;
            svgData.valuePer = 0;
            svgData.ratio = 1;
            svgData.dataLength = option.value.length;


            svgData.xAxis = getAxisName(option.name);
            svgData.xAxisHeight = 0;//x轴内容高度
            svgData.xAxisPer = 0;//x轴每段值

            svgData.yAxis = getAxisValue(option.value);
            svgData.yAxisWidth = 0;//y轴内容宽度
            svgData.yAxisPer = 0;//y轴每段值

            svgData.xCoordinate = [];
            svgData.yCoordinate = [];

        }


        //提取Data中的Name
        function getName(array){
            var name = [];
            for(var i=0; i<array.length; i++){
                name.push(array[i].name);
            }
            return name;
        }

        //提取Data中的Value
        function getValue(array){
            var value = [];
            for(var i=0; i<array.length; i++){
                value.push(array[i].value);
            }
            return value;
        }

        //获取坐标轴Name数据
        function getAxisName(array){
            var axisName = [];
            for(var i=0; i<array.length; i++){
                axisName.push(array[i]);
            }
            return axisName;
        }

        //获取坐标轴Value数据
        function getAxisValue(array){
            var valueMax = getMax(array);
            svgData.valuePer = Math.ceil(valueMax/svgData.valueAmount);

            var axisValue = [];
            for (var i=0; i<svgData.valueAmount+1; i++){
                axisValue.push(String(svgData.valuePer*i));
            }
            return axisValue;
        }

        function getMax(array){
            var max=0;
            for (var i=0; i<array.length; i++){
                max = max>array[i] ? max : array[i];
            }
            return max;
        }

        function getCoordinate(value,ratio,base){
            return base - value*ratio;
        }

        function setCoordinateData(){
            svgData.ratio = svgData.yAxisPer/svgData.valuePer;
            for(var i=0; i<svgData.dataLength; i++){
                svgData.xCoordinate[i] = svgData.chartLeft + svgData.yAxisWidth + svgData.xAxisPer*(i+1/2);
                svgData.yCoordinate[i] = getCoordinate(option.value[i],svgData.ratio,svgData.chartBottom-(svgData.xAxisHeight));
            }
        }

        //开始画图，根据option选择画何种图、如何画。
        function beginDrawing(){
            //svgClear();
            switch(option.type){
                case "line": drawLine();break;
                case "bar": drawBar();break;
                case "progress": drawBar();break;
                case "column": drawBar();break;
                case "pie": drawPie();break;
                case "loop": drawPie();break;
                default : drawDefault();
            }
            callback(option);
        }

        //初始化svg
        function svgClear(){
            svg.clear();
        }

        //画默认图
        function drawDefault(){
            drawBox();
            var svgw, svgh;
            if (svg.attr('viewBox')) {
                svgw = svg.attr('viewBox').width;
                svgh = svg.attr('viewBox').height;
            } else {
                svgw = $(svg.node).width();
                svgh = $(svg.node).height();
            }
            var img = svg.paper.image(svgnodataurl, 10, 10, 168, 90);
            img.attr({
                x: svgw / 2 - img.getBBox().width / 2,
                y: svgh / 2 - img.getBBox().height / 2
            });
            var str = [];
            str[0] = '暂无经营数据';
            str[1] = '赶快使用订单系统，公司经营各项数据轻松在手！';
            if (option.noDataMsg) {
                str = option.noDataMsg;
            }
            console.log("str:",str);

            var text = [];
            //循环输出Msg
            for (var i=0; i<str.length; i++){
                text[i] = svg.text(svgw / 2, img.getBBox().y2 + 24*(i+1), str[i]).attr({
                    fontSize: 16,
                    fill: '#67b7ed'
                });
                text[i].attr({
                    x: svgw / 2 - text[i].getBBox().width / 2
                });
            }

            return false;
        }

        //画折线图
        function drawLine(){
            drawAxes(svgData.xAxis,svgData.yAxis);
            setCoordinateData();
            drawOneLine(svgData.xCoordinate,svgData.yCoordinate);
            bindEvent();
        }

        //画条形图
        function drawBar(){
            drawOneBar();

            bindEvent();
        }

        //画饼图
        function drawPie(){


            drawOnePie();

            bindEvent();
        }

        //function drawProgress(){};
        //function drawColumn(){};
        //function drawLoop(){}


        function drawAxes(xAxisData,yAxisData){
            var i=0;//循环计数

            //画x轴
            var xText = [];
            var xHeight = [];
            for (i=0; i<xAxisData.length; i++){
                xText[i] = svg.text(0, 0, xAxisData[i]).attr({
                    fontSize: 12,
                    fill: '#67b7ed'
                });
                xHeight.push(xText[i].getBBox().height);
            }
            svgData.xAxisHeight = getMax(xHeight);//x轴高度

            //画y轴
            var yText = [];
            var yWidth = [];
            for (i=0; i<yAxisData.length; i++){
                yText[i] = svg.text(0, 0, yAxisData[i]).attr({
                    fontSize: 12,
                    fill: '#67b7ed'
                });
                yWidth.push(yText[i].getBBox().width);
            }
            svgData.yAxisWidth = getMax(yWidth);//y轴宽度


            svgData.xAxisPer = Math.ceil((svgData.chartRight-svgData.yAxisWidth-svgData.chartLeft)/xAxisData.length);
            svgData.yAxisPer = Math.ceil((svgData.chartBottom-(svgData.xAxisHeight+10)-svgData.chartTop)/yAxisData.length);


            //重新定位x轴
            for (i=0; i<xAxisData.length; i++){
                xText[i].attr({
                    x: svgData.chartLeft + svgData.yAxisWidth + svgData.xAxisPer*i + (svgData.xAxisPer - xText[i].getBBox().width)/2,
                    y: svgData.chartBottom
                });
            }

            //重新定位y轴
            for (i=0; i<yAxisData.length; i++){
                yText[i].attr({
                    x: svgData.chartLeft + (svgData.yAxisWidth-yWidth[i]),
                    y: (svgData.chartBottom-svgData.xAxisHeight) - svgData.yAxisPer*i
                });

                svg.line(svgData.chartLeft + svgData.yAxisWidth + 5, (svgData.chartBottom-svgData.xAxisHeight) - svgData.yAxisPer*i, svgData.chartRight, (svgData.chartBottom-svgData.xAxisHeight) - svgData.yAxisPer*i).attr({
                    stroke: "#31B2E6",
                    strokeWidth: 1
                });
            }

            ////画其他线
            //for (i=0;i<yAxisData.length-1; i++){
            //    svg.line(svgData.chartLeft + svgData.yAxisWidth + svgData.xAxisPer*(i+1), svgData.chartBottom, 10 + svgData.yAxisWidth + svgData.xAxisPer*(i+1), svgData.chartBottom-svgData.xAxisHeight).attr({
            //        stroke: "#31B2E6",
            //        strokeWidth: 1
            //    });
            //}

            //y轴线,间隙5
            svg.line(svgData.chartLeft + svgData.yAxisWidth + 5, svgData.chartTop, svgData.chartLeft + svgData.yAxisWidth + 5, svgData.chartBottom-svgData.xAxisHeight).attr({
                stroke: "#31B2E6",
                strokeWidth: 1
            });

            //x轴线
            svg.line(svgData.chartLeft + svgData.yAxisWidth + 5, svgData.chartBottom-svgData.xAxisHeight, svgData.chartRight, svgData.chartBottom-svgData.xAxisHeight).attr({
                stroke: "#31B2E6",
                strokeWidth: 1
            });


            return false;
        }

        //画一个折线
        function drawOneLine(xArray,yArray){
            for (var i=0; i<svgData.dataLength-1; i++){
                svg.line(xArray[i], yArray[i], xArray[i+1], yArray[i+1]).attr({
                    stroke: "#88BF57",
                    strokeWidth: 3
                });
            }
        }

        //画一个条形
        function drawOneBar(){}

        //画一个饼
        function drawOnePie(){}

        //绑定事件
        function bindEvent(){}

        //画Tip
        function drawTip(){}
        //清除Tip
        function fadeTip(){}

        //this.opt = $.extend(true,{},defOpt,opt);
        return false;
    };
})();

