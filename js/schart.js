
;(function(factory) {

    if (typeof define === 'function' && define['amd']) {
        // [2] AMD anonymous module
        // [2] AMD 规范
        define(['snap', 'jquery'], factory);
    } else {
        // [3] No module loader (plain <script> tag) - put directly in global namespace
        s=factory(Snap,$);

    }
})(function (snap, $) {
    function draw(dom, opt) {}
    var isPc = false;
    var isHome = false;
    var fontColor = '#b0b0b0';

    function _init(svg, data, nodataStr) {
        svg.clear();//清空svg   再次之前对于svg的操作都无效

        //if(window.orientation == undefined){
        //    isPc=true;
        //}

        if (isPc) {
            svg.unmousedown();
            svg.unmousemove();
            svg.unmouseup();
        } else {
            svg.untouchmove();
            svg.untouchstart();
            svg.untouchend();
        }

        if (typeof  data != "object") {
            console.log('s:非法数据');
            return _errImage(svg, nodataStr);
        } else {
            for (var i in data) {
                return true;
            }
            console.log('s:无数据');
            return _errImage(svg, nodataStr);
        }

    }

    function drawLine(dom, data, legend, fun, option, nodataStr) {
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


    }

    function drawBar(dom, data, legend, fun, option, nodataStr) {

        var svg = Snap(dom);
        var barSvg, bl = 0, bn;  //bar 的坐标系  b的数量

        var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
        var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 18, cl = 10, cr = vw - 20;   //图表区域  top  bottom  left right
        var cperv, cpery, cline = vw < 400 ? 5 : 6;  //图表横向每段值val  图表纵向每段宽度  图表横向分几段
        var iscompre, islayer;   //是否是对比,是否是2级
        var beforey = 0, transy = 0, touchy;    //原来的位移   当前的位移   本次触摸时的位移
        var bars;    //svg.g 所有的条
        var isfull = _getParam(option, 'isfull', false);
        var smpdata;   //采样数据
        var touchtime;  //触摸定时器

        var dataFix = false;//importance 新版本需要另外一种 tip的图，为了修改方便     以前程序不变， 用老字段 存新字段的值 来画图 ， 用该变量 判断花哪一种tip

        beginChart();


        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }

            if (typeof  fun != "function") {
                fun = function () {
                };
            }


            iscompre = legend.length == 2 ? true : false;
            islayer = data[0].item != undefined ? true : false;

            if (!iscompre && !islayer) {
                if (data[0].price == undefined) {
                    dataFix = true;
                }
            }

            cpery = iscompre ? 37 : 26;

            initData();  //取前100

        }

        function initData() {
            //取最大值
            //算左边边距
            //大于100阶段
            //为0 除去

            var n = 0;
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                if (n >= 100) {
                    data.splice(i, data.length - i);
                    break;
                }
                if (islayer) {
                    for (var j = 0; j < data[i].item.length; j++) {
                        var item = data[i].item[j];
                        var temp = dealData(item, max);
                        if (temp) {
                            max = temp;

                            if (bl < 84) {
                                var longs = (item.name.toString().length + 1) * 13 + 6 > 84 ? 84 : (item.name.toString().length + 1) * 13 + 6;
                                bl = bl < longs ? longs : bl;
                            }

                        } else {
                            data[i].item.splice(j, 1);
                            j--;
                        }

                        n++;
                    }
                    if (!data[i].item.length) {
                        data.splice(i, 1);
                        i--;
                    }
                } else {
                    if (dataFix) {
                        data[i].price = data[i].num;
                    }


                    var temp = dealData(data[i], max);
                    if (temp) {
                        max = temp;

                        if (bl < 84) {
                            var longs = data[i].name.toString().length * 13 + 6 > 84 ? 84 : data[i].name.toString().length * 13 + 6;
                            bl = bl < longs ? longs : bl;
                        }
                    } else {
                        data.splice(i, 1);
                        i--;
                    }
                    n++;
                }
            }
            if (!data.length) {
                console.log('s:' + n + '条数据全是0');
                return _errImage(svg);
            }

            cperv = _getPerV(max, cline);


            chartSuccess(dom, 'bar');
            drawBgLine();
            drawDataBar();
            bindEvent();

        }

        function dealData(v, max) {
            var newmax;
            if (iscompre) {
                if (parseFloat(v.k1.price) == 0 && parseFloat(v.k2.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.k1.price) > max ? parseFloat(v.k1.price) : max;
                newmax = parseFloat(v.k2.price) > newmax ? parseFloat(v.k2.price) : newmax;
                return newmax;
            } else {
                if (parseFloat(v.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.price) > max ? parseFloat(v.price) : max;
                return newmax;
            }
        }


        //todo  先计算pointx y 和画一条线
        function drawOneTip(index, tipdata, k2data) {
            if (tipdata) {
                var poionty = index * cpery + cpery / 2 + ct + beforey;
                var poiontx;
                if (!iscompre) {
                    poiontx = getDataX(tipdata.price) + bl + 8;
                } else {
                    if (parseFloat(tipdata.price) > parseFloat(k2data.price)) {
                        poiontx = getDataX(tipdata.price) + bl + 8;
                    } else {
                        poiontx = getDataX(k2data.price) + bl + 8;
                    }

                }


                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 2.5
                });
                var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 3,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb - tt, 4).attr({
                    fill: "#47a8ef"
                });


                if (!dataFix) {
                    var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, [legend[0] + ':　', "￥", _formatMoney(tipdata.price) + "　", tipdata.num, "笔"]).attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                    text.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });
                } else {
                    var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, [legend[0] + ':　', tipdata.num + '次', ""]).attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                    text.select("tspan:nth-child(3)").attr({
                        fontSize: 8
                    });

                }


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
                tip.attr('class', "svgbartip");
                tip.attr('svgbartipid', index);
                tip.add(rect, text, tipLine, tipcircel);


                if (k2data) {
                    var rect2 = svg.paper.rect(poiontx, tb + 1, 100, tb - tt, 4).attr({
                        fill: "#f5a25c"
                    });

                    var text2 = svg.paper.text(poiontx, 2 * tb - tt - (tb - tt - 14) / 2, [legend[1] + ':　', "￥", _formatMoney(k2data.price) + "　", k2data.num, "笔"]).attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                    text2.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text2.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });

                    var textw2 = text2.getBBox().width;
                    var rectw2 = textw2 + 20;
                    var rectleft2 = poiontx - rectw2 / 2;


                    if (rectleft2 < 0) {
                        rectleft2 = 0;
                    } else if (rectleft2 > vw - rectw2) {
                        rectleft2 = vw - rectw2;
                    }

                    rect2.attr({
                        width: rectw2,
                        x: rectleft2
                    });
                    text2.attr({
                        x: (rectw2 - textw2) / 2 + rectleft2
                    });

                    tip.add(rect2, text2);

                }


            } else {
                console.log('s:点击到了bar之外的区域');
            }

        }

        function drawTip(index) {
            if (islayer) {
                var layer = _getLayer(index, data);

                if (iscompre) {

                    drawOneTip(index, data[layer.parent].item[layer.child].k1, data[layer.parent].item[layer.child].k2);

                } else {
                    drawOneTip(index, data[layer.parent].item[layer.child]);
                }
                fun(data[layer.parent].item[layer.child]);
                if (isfull) {
                    drawTitle(data[layer.parent].item[layer.child].name);
                }


            } else {
                if (iscompre) {
                    drawOneTip(index, data[index].k1, data[index].k2);
                } else {
                    drawOneTip(index, data[index]);
                }
                fun(data[index]);
                if (isfull) {
                    drawTitle(data[index].name);
                }
            }

        }

        function drawTitle(name) {
            var text = svg.text(0, tt - 8, name).attr({
                'class': "svgbartip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);
        }

        function fideTip() {
            $('.svgbartip').remove();
            fun();
        }

        function moveBars(cury, e) {
            transy = beforey + cury - touchy;
            if (transy > 0) {
                transy = 0;
            } else if (transy < -cpery * (bn + 1) + (cb - ct)) {
                transy = cb - ct < cpery * (bn + 1) ? -cpery * (bn + 1) + (cb - ct) : 0;
            }

            bars.transform("translate(0," + transy + ")");
        }

        function bindEvent() {

            if (isPc) {
                svg.mousedown(function (e) {
                    touchy = e.clientY + $(document).scrollTop() - $(svg.node).offset().top;
                    touchy = touchy / 1.4;
                    if (touchy > ct && touchy < cb) {
                        touchtime = setTimeout(function () {
                            //svg.unmousemove(); // ↑
                            var cury = touchy - ct - beforey;   //  点击的元素的高度
                            var index = Math.floor(cury / cpery);
                            if (index >= 0 && index < bn) {
                                drawTip(index);
                            }

                        }, 100);

                        svg.mousemove(function (e) {

                            var y = e.clientY + $(document).scrollTop() - $(svg.node).offset().top;
                            y = y / 1.4;
                            if (y - touchy != 0) {
                                fideTip(); //  ↓
                                clearTimeout(touchtime);
                            }
                            moveBars(y, e);

                        });

                    }

                });

                svg.mouseup(function (e) {
                    svg.unmousemove();
                    fideTip();
                    clearTimeout(touchtime);

                    beforey = transy;
                });

                $(dom).mouseleave(function () {
                    svg.unmousemove();
                });


            } else {
                svg.touchstart(function (e) {
                    touchy = e.touches[0].clientY;
                    var svgy = touchy + $(document).scrollTop() - svg.node.offsetTop;  //点在svg 上的y
                    if (svgy > ct && svgy < cb) {

                        touchtime = setTimeout(function () {
                            svg.untouchmove(); // ↑
                            var cury = svgy - ct - beforey;   //  点击的元素的高度
                            var index = Math.floor(cury / cpery);
                            if (index >= 0 && index < bn) {
                                drawTip(index);
                            }

                            svg.touchmove(function (e) {
                                e.preventDefault();
                                touchy = e.touches[0].clientY;
                                var svgy = touchy + $(document).scrollTop() - svg.node.offsetTop;  //点在svg 上的y
                                if (svgy > ct && svgy < cb) {
                                    var cury = svgy - ct - beforey;   //  点击的元素的高度
                                    var index = Math.floor(cury / cpery);
                                    var lastIndex = $('.svgbartip').attr('svgbartipid');
                                    if (index >= 0 && index < bn && lastIndex != index) {
                                        fideTip();
                                        drawTip(index);
                                    }
                                }
                            });


                        }, 100);


                        svg.touchmove(function (e) {
                            clearTimeout(touchtime);

                            if (isfull) {
                                e.preventDefault();
                                var y = e.touches[0].clientY;
                                moveBars(y, e);
                            }

                        });

                    }

                });


                svg.touchend(function (e) {
                    svg.untouchmove();
                    fideTip();
                    clearTimeout(touchtime);


                    beforey = transy;
                });
            }


        }

        function drawBgLine() {

            var lineh = (cr - bl) / cline;

            for (var i = 0; i <= cline; i++) {
                var x = bl + i * lineh;

                svg.line(x, cb, x, ct).attr({
                    stroke: "#e2e2e2",
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });

                var text = svg.text(x, vh - 4, _formatMoney(cperv * i)).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                text.attr('x', x - text.getBBox().width / 2);
            }

        }

        function drawOneBar(v, name, parent) {
            //没有name  就是 k2
            //有层级  才会有parent
            if (name) {
                var text = barSvg.text(bl, iscompre ? bn * cpery + 24 : bn * cpery + 16, islayer ? _formatName(name, 5) : _formatName(name, 6)).attr({
                    fill: fontColor,
                    fontSize: 12
                });
                text.attr('x', bl - text.getBBox().width - 4);
                bars.add(text);
            }

            var color;
            if (parent % 2 && !islayer) {
                color = "#88bf57"; //绿色
            } else {
                color = "#7cb7ef"; //蓝色
            }


            var rect = barSvg.rect(bl, name ? bn * cpery + 8 : bn * cpery + cpery / 2 + 1, getDataX(v), 10).attr({
                fill: name ? color : '#f5a25c'
            });
            bars.add(rect);

        }

        function drawDoubleBar(v, parent) {
            drawOneBar(v.k1.price, v.name, parent);
            drawOneBar(v.k2.price, false, parent);
        }

        function drawDataBar() {
            barSvg = svg.svg(0, ct, vw, cb - ct);

            bars = barSvg.g();

            bn = 0;
            for (var i = 0; i < data.length; i++) {
                var item = data[i];

                if (islayer) {
                    var childn = 0;
                    $.each(item.item, function (j, v) {

                        if (iscompre) {
                            drawDoubleBar(v, i);
                        } else {
                            drawOneBar(v.price, v.name, i);
                        }

                        childn++;
                        bn++;
                    });

                    if (childn > 1) {
                        var lefttext = barSvg.text(cl, (bn - childn) * cpery + childn * cpery / 2 + 6, childn > 2 ? _formatName(item.name, 5) : _formatName(item.name, 4)).attr({
                            fill: fontColor,
                            fontSize: 10
                        });
                        lefttext.attr({
                            x: cl - lefttext.getBBox().width / 2
                        });
                        lefttext.transform('roate(-90)');
                        bars.add(lefttext);
                    }
                    var line = barSvg.line(cl, bn * cpery, bl - 4, bn * cpery).attr({
                        stroke: fontColor,
                        strokeDasharray: "5 2",
                        strokeWidth: 1
                    });
                    bars.add(line);


                } else {
                    if (iscompre) {
                        drawDoubleBar(item);
                    } else {
                        drawOneBar(item.price, item.name);
                    }
                    bn++;
                }
            }
        }

        function getDataX(v) {
            if (!v) {
                return 0;
            }
            return (parseFloat(v) / (cline * cperv)) * (cr - bl);
        }

    }

    function drawProgress(dom, data, legend, fun, option, nodataStr) {
        var svg = Snap(dom);
        var barSvg, bl = 0, bn;  //bar 的坐标系  b的数量

        var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
        var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 18, cl = 10, cr = vw - 20;   //图表区域  top  bottom  left right
        var cperv, cpery, cline = vw < 400 ? 5 : 6;  //图表横向每段值val  图表纵向每段宽度  图表横向分几段
        var iscompre, islayer;   //是否是对比,是否是2级
        var beforey = 0, transy = 0, touchy;    //原来的位移   当前的位移   本次触摸时的位移
        var bars;    //svg.g 所有的条
        var isfull = _getParam(option, 'isfull', false);
        var smpdata;   //采样数据
        var touchtime;  //触摸定时器

        var dataFix = false;//importance 新版本需要另外一种 tip的图，为了修改方便     以前程序不变， 用老字段 存新字段的值 来画图 ， 用该变量 判断花哪一种tip

        beginChart();


        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }

            if (typeof  fun != "function") {
                fun = function () {
                };
            }


            iscompre = true;
            islayer =false;


            dataFix = true;


            cpery =  26;

            initData();  //取前100

        }

        function initData() {
            //取最大值
            //算左边边距
            //大于100截断
            //为0 除去

            var n = 0;
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                if (n >= 100) {
                    data.splice(i, data.length - i);
                    break;
                }

                if (dataFix) {
                    data[i].k1.price = data[i].k1.num;
                    data[i].k2.price = data[i].k2.num;
                }


                var temp = dealData(data[i], max);
                if (temp) {
                    max = temp;

                    if (bl < 84) {
                        var longs = data[i].name.toString().length * 13 + 6 > 84 ? 84 : data[i].name.toString().length * 13 + 6;
                        bl = bl < longs ? longs : bl;
                    }
                } else {
                    data.splice(i, 1);
                    i--;
                }
                n++;
            }

            if (!data.length) {
                console.log('s:' + n + '条数据全是0');
                return _errImage(svg);
            }

            cperv = _getPerV(max, cline);


            chartSuccess(dom, 'bar');
            drawBgLine();
            drawDataBar();
            bindEvent();

        }

        function dealData(v, max) {
            var newmax;
            if (iscompre) {
                if (parseFloat(v.k1.price) == 0 && parseFloat(v.k2.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.k1.price) > max ? parseFloat(v.k1.price) : max;
                newmax = parseFloat(v.k2.price) > newmax ? parseFloat(v.k2.price) : newmax;
                return newmax;
            } else {
                if (parseFloat(v.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.price) > max ? parseFloat(v.price) : max;
                return newmax;
            }
        }



        function drawTitle(name) {
            var text = svg.text(0, tt - 8, name).attr({
                'class': "svgbartip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);
        }

        function fideTip() {
            $('.svgbartip').remove();
            fun();
        }

        function moveBars(cury, e) {
            transy = beforey + cury - touchy;
            if (transy > 0) {
                transy = 0;
            } else if (transy < -cpery * (bn + 1) + (cb - ct)) {
                transy = cb - ct < cpery * (bn + 1) ? -cpery * (bn + 1) + (cb - ct) : 0;
            }

            bars.transform("translate(0," + transy + ")");
        }

        function bindEvent() {
            svg.touchstart(function (e) {
                touchy = e.touches[0].clientY;
                var svgy = touchy + $(document).scrollTop() - svg.node.offsetTop;  //点在svg 上的y
                if (svgy > ct && svgy < cb) {



                    svg.touchmove(function (e) {
                        clearTimeout(touchtime);

                        if (isfull) {
                            e.preventDefault();
                            var y = e.touches[0].clientY;
                            moveBars(y, e);
                        }

                    });

                }

            });


            svg.touchend(function (e) {
                svg.untouchmove();
                fideTip();
                clearTimeout(touchtime);


                beforey = transy;
            });



        }

        function drawBgLine() {

            var lineh = (cr - bl) / cline;

            for (var i = 0; i <= cline; i++) {
                var x = bl + i * lineh;

                svg.line(x, cb, x, ct).attr({
                    stroke: "#e2e2e2",
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });

                var text = svg.text(x, vh - 4, _formatMoney(cperv * i)).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                text.attr('x', x - text.getBBox().width / 2);
            }

        }

        function drawOneBar(v,v2, name) {


            var text = barSvg.text(bl,  bn * cpery + 14, islayer ? _formatName(name, 5) : _formatName(name, 6)).attr({
                fill: fontColor,
                fontSize: 12
            });
            text.attr('x', bl - text.getBBox().width - 4);
            bars.add(text);


            var rect = barSvg.rect(bl,bn * cpery + 5 , getDataX(v2), 10).attr({
                fill: '#e4e4e4'
            });
            bars.add(rect);

            var rect2 = barSvg.rect(bl,bn * cpery + 5 ,getDataX(v), 10).attr({
                fill:  '#88bf57'
            });
            bars.add(rect2);



            var textProgeress = barSvg.text(bl+getDataX(v2),  bn * cpery + 14, '　('+v+'/'+v2+')').attr({
                fill: '#a3a3a3',
                fontSize: 11
            });

            var progress=v2/(cline * cperv);
            if(progress > 0.8 &&  bl + getDataX(v2) + textProgeress.getBBox().width > cr) {
                textProgeress.attr('x', bl + getDataX(v2) - textProgeress.getBBox().width - 4);
                textProgeress.attr('fill','#000');
            }

            bars.add(textProgeress);


        }


        function drawDataBar() {
            barSvg = svg.svg(0, ct, vw, cb - ct);

            bars = barSvg.g();

            bn = 0;
            for (var i = 0; i < data.length; i++) {
                var item = data[i];

                drawOneBar(item.k1.price,item.k2.price, item.name);

                bn++;

            }
        }

        function getDataX(v) {
            if (!v) {
                return 0;
            }
            return (parseFloat(v) / (cline * cperv)) * (cr - bl);
        }

    }

    function drawColumn(dom, data, legend, fun, option, nodataStr) {
        var svg = Snap(dom);

        var columnSvg, columnl, cn;  //column 的坐标系 column 左边距离 column的数量

        var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
        var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb, cl = 10, cr = vw;   //图表区域  top  bottom  left right
        var cperv, cperx, cline = 5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
        var beforex = 0, transx = 0, touchx;    //柱形图原来的位移   当前的位移   本次触摸时的位移(相对于svg 不是屏幕宽度)
        var columns;   //svg.g 所有的条
        var isfull = _getParam(option, 'isfull', false);

        var iscompre, islayer;
        var touchtime;  //触摸定时器


        beginChart();


        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }

            if (typeof  fun != "function") {
                fun = function () {
                };
            }


            iscompre = legend.length == 2 ? true : false;
            islayer = data[0].item != undefined ? true : false;

            cperx = iscompre ? 53 : 42;
//            cb=islayer?vh-40:vh-25;
            cb = islayer ? vh - 37 : vh - 25;

            initData();  //取前100


        }


        function initData() {
            //取最大值
            //算左边边距
            //大于100阶段
            //为0 除去

            var n = 0;
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                if (n >= 100) {
                    data.splice(i, data.length - i);
                    break;
                }
                if (islayer) {
                    for (var j = 0; j < data[i].item.length; j++) {
                        var item = data[i].item[j];
                        var temp = dealData(item, max);
                        if (temp) {
                            max = temp;
                        } else {
                            data[i].item.splice(j, 1);
                            j--;
                        }

                        n++;
                    }
                    if (!data[i].item.length) {
                        data.splice(i, 1);
                        i--;
                    }
                } else {
                    var temp = dealData(data[i], max);
                    if (temp) {
                        max = temp;
                    } else {
                        data.splice(i, 1);
                        i--;
                    }
                    n++;
                }
            }
            if (!data.length) {
                console.log('s:' + n + '条数据price全是0');
                return _errImage(svg, nodataStr);
            }


            cperv = _getPerV(max, cline);


            chartSuccess(dom, 'column');
            drawBgLine();
            drawDataColumn();
            bindEvent();

        }

        //todo  可以 放到 _dealData
        function dealData(v, max) {
            var newmax;
            if (iscompre) {
                if (parseFloat(v.k1.price) == 0 && parseFloat(v.k2.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.k1.price) > max ? parseFloat(v.k1.price) : max;
                newmax = parseFloat(v.k2.price) > newmax ? parseFloat(v.k2.price) : newmax;
                return newmax;
            } else {
                if (parseFloat(v.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.price) > max ? parseFloat(v.price) : max;
                return newmax;
            }
        }


        //todo  //todo  先计算pointx y 和花一条线
        function drawOneTip(index, tipdata, k2data) {
            if (tipdata) {
                var poiontx = index * cperx + cperx / 2 + columnl + beforex;
                var poionty;
                if (!iscompre) {
                    poionty = getDataY(tipdata.price) + ct - 8;
                } else {
                    if (parseFloat(tipdata.price) > parseFloat(k2data.price)) {
                        poionty = getDataY(tipdata.price) + ct - 8;
                    } else {
                        poionty = getDataY(k2data.price) + ct - 8;
                    }

                }

                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 2.5
                });
                var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 3,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb - tt, 4).attr({
                    fill: "#47a8ef"
                });

                var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, [legend[0] + ':　', "￥", _formatMoney(tipdata.price) + "　", tipdata.num, "笔"]).attr({
                    fill: "#fff",
                    fontSize: 14
                });


                text.select("tspan:nth-child(2)").attr({
                    fontSize: 8
                });
                text.select("tspan:nth-child(5)").attr({
                    fontSize: 8
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
                tip.attr('class', "svgcolumntip");
                tip.attr('svgcolumntipid', index);
                tip.add(rect, text, tipLine, tipcircel);


                if (k2data) {
                    var rect2 = svg.paper.rect(poiontx, tb + 1, 100, tb - tt, 4).attr({
                        fill: "#f5a25c"
                    });

                    var text2 = svg.paper.text(poiontx, 2 * tb - tt - (tb - tt - 14) / 2, [legend[1] + ':　', "￥", _formatMoney(k2data.price) + "　", k2data.num, "笔"]).attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                    text2.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text2.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });

                    var textw2 = text2.getBBox().width;
                    var rectw2 = textw2 + 20;
                    var rectleft2 = poiontx - rectw2 / 2;


                    if (rectleft2 < 0) {
                        rectleft2 = 0;
                    } else if (rectleft2 > vw - rectw2) {
                        rectleft2 = vw - rectw2;
                    }

                    rect2.attr({
                        width: rectw2,
                        x: rectleft2
                    });
                    text2.attr({
                        x: (rectw2 - textw2) / 2 + rectleft2
                    });

                    tip.add(rect2, text2);
                }


            } else {
                console.log('点击到了bar之外的区域');
            }

        }

        //todo  考虑放到 _touchData
        function drawTip(index) {
            if (islayer) {
                var layer = _getLayer(index, data);
                if (layer) {
                    if (iscompre) {
                        drawOneTip(index, data[layer.parent].item[layer.child].k1, data[layer.parent].item[layer.child].k2);
                    } else {
                        drawOneTip(index, data[layer.parent].item[layer.child]);
                    }
                    fun(data[layer.parent].item[layer.child]);
                    if (isfull) {
                        drawTitle(data[layer.parent].item[layer.child].name);
                    }
                }
            } else {
                if (iscompre) {
                    drawOneTip(index, data[index].k1, data[index].k2);
                } else {
                    drawOneTip(index, data[index]);


                }
                fun(data[index]);
                if (isfull) {
                    drawTitle(data[index].name);
                }
            }

        }


        function fideTip() {
            $('.svgcolumntip').remove();
            fun();
        }

        function drawTitle(name) {
            var text = svg.text(0, tt - 8, name).attr({
                'class': "svgcolumntip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);
        }

        function moveColumn(curx, e) {
            transx = beforex + curx - touchx;
            if (transx > 0) {
                transx = 0;
            } else if (transx < -cperx * (cn + 1) + vw - columnl) {
                transx = vw - columnl < cperx * (cn + 1) ? -cperx * (cn + 1) + vw - columnl : 0;
            }
            columns.transform("translate(" + transx + ",0)");


        }

        function bindEvent() {

            if (isPc) {


                svg.mousedown(function (e) {
                    svg.unmousemove();
                    touchx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                    touchx = ( touchx / $(svg.node).width()) * vw;


                    svg.mousemove(function (e) {
                        var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                        curx = ( curx / $(svg.node).width()) * vw;
                        if (curx - touchx != 0) {
                            fideTip();
                            clearTimeout(touchtime);
                        }
                        moveColumn(curx, e);
                    });


                    svg.mouseup(function (e) {
                        svg.unmousemove();

                        svg.mousemove(function (e) {
                            var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                            curx = ( curx / $(svg.node).width()) * vw;

                            curx = curx - columnl - beforex;
                            var index = Math.floor(curx / cperx);
                            var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                            if (index >= 0 && index < cn && lastIndex != index) {
                                fideTip();
                                drawTip(index);
                            }
                        });

                        beforex = transx;
                    });

                });

                svg.mousemove(function (e) {
                    var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                    curx = ( curx / $(svg.node).width()) * vw;

                    curx = curx - columnl - beforex;
                    var index = Math.floor(curx / cperx);
                    var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                    if (index >= 0 && index < cn && lastIndex != index) {
                        fideTip();
                        drawTip(index);
                    }
                });

                $(dom).mouseleave(function () {
                    fideTip();
                });


            } else {

                svg.touchstart(function (e) {
                    touchx = e.touches[0].clientX;
                    if (isfull) {
                        touchx = ( touchx / $(svg.node).width()) * vw;
                    }

                    touchtime = setTimeout(function () {
                        svg.untouchmove();
                        var curx = touchx - columnl - beforex;
                        var index = Math.floor(curx / cperx);
                        if (index >= 0 && index < cn) {
                            drawTip(index);
                        }


                        svg.touchmove(function (e) {
                            e.preventDefault();
                            touchx = e.touches[0].clientX;
                            if (isfull) {
                                touchx = ( touchx / $(svg.node).width()) * vw;
                            }

                            var curx = touchx - columnl - beforex;
                            var index = Math.floor(curx / cperx);
                            var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                            if (index >= 0 && index < cn && lastIndex != index) {
                                fideTip();
                                drawTip(index);
                            }
                        });
                    }, 100);


                    svg.touchmove(function (e) {
                        clearTimeout(touchtime);
                        if (isfull) {
                            var curx = e.touches[0].clientX;

                            e.preventDefault();

                            curx = ( curx / $(svg.node).width()) * vw;
                            moveColumn(curx, e);

                        }
                    });
                });


                svg.touchend(function (e) {
                    svg.untouchmove();
                    fideTip();
                    clearTimeout(touchtime);
                    beforex = transx;
                });


            }
        }


        function drawBgLine() {
            columnl = 0;
            var lineh = (cb - ct) / cline;

            var bgLine = svg.line(cl, cb, cr, cb).attr({
                stroke: "#e2e2e2",
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

                var text = svg.text(cl, h + 15, _formatMoney(cperv * i)).attr({
                    fill: fontColor,
                    fontSize: 12
                });

                columnl = text.getBBox().width + cl + 10 > columnl ? text.getBBox().width + cl + 10 : columnl;

            }


        }

        function getDataY(val) {
            if (!val) {
                val = 0;
            }

            val = parseFloat(val);
            return cb - ct - (val / (cperv * cline)) * (cb - ct);

        }

        function drawOneColumn(v, name) {

            var x = cperx * cn;
            var y = getDataY(v);

            var rect = columnSvg.rect(name ? x + 16 : x + 28, y, 10, cb - ct - y).attr({
                fill: name ? '#7cb7ef' : '#f5a25c'
            });


            columns.add(rect);

            if (name) {
                //todo
                name = name.toString();
                var longs = iscompre ? 8 : 6;
                if (name.length > longs) {
                    name = _formatName(name, longs);

                }
                if (name.length > longs / 2) {
                    var name1 = name.substr(0, longs / 2);
                    var name2 = name.substr(longs / 2);
                    var text1 = columnSvg.text(x, cb - ct + 11, name1).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    var text2 = columnSvg.text(x, cb - ct + 22, name2).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    text1.attr("x", x + (cperx - text1.getBBox().width) / 2);
                    text2.attr("x", x + (cperx - text1.getBBox().width) / 2);
                    columns.add(text1, text2);

                } else {
                    var text = columnSvg.text(x, cb - ct + 11, name).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    text.attr("x", x + (cperx - text.getBBox().width) / 2);
                    columns.add(text);
                }


            }

        }

        function drawDoubleColumn(v, parent) {
            drawOneColumn(v.k1.price, v.name, parent);
            drawOneColumn(v.k2.price, false, parent);
        }

        function drawDataColumn() {
            columnSvg = svg.svg(columnl, ct, vw - columnl, vh - ct);
            columns = columnSvg.g();
            cn = 0;


            for (var i = 0; i < data.length; i++) {
                if (islayer) {
                    var childn = 0;
                    $.each(data[i].item, function (j, item) {
                        if (iscompre) {
                            drawDoubleColumn(item, i);
                        } else {
                            drawOneColumn(item.price, item.name, i);
                        }
                        cn++;
                        childn++;
                    });

                    if (childn > 1) {
                        var parenttext = columnSvg.text(cn * cperx, vh - ct - 2, _formatName(data[i].name, 6)).attr({
                            fill: fontColor,
                            fontSize: 10
                        });
//                        console.log(parenttext.node.getComputedTextLength());
                        parenttext.attr({
                            x: (cn - childn) * cperx + (childn * cperx - parenttext.getBBox().width) / 2
                        });
                        columns.add(parenttext);
                    }
                    var line = columnSvg.line(cn * cperx, cb - ct + 2, cn * cperx, vh - ct - 1).attr({
                        stroke: fontColor,
                        strokeDasharray: "5 2",
                        strokeWidth: 1
                    });
                    columns.add(line);

                } else {
                    if (iscompre) {
                        drawDoubleColumn(data[i]);
                    } else {
                        drawOneColumn(data[i].price, data[i].name);

                    }
                    cn++;
                }

            }
        }

    }

    function drawPie(dom, data, legend, fun, option, nodataStr) {

        var svg = Snap(dom);

        var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
        var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 35);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', tb + 30), cb = _getParam(option, 'cb', vh - 10);  //图表区域  top  bottom
        var px = _getParam(option, 'px', vw / 3), pr = (cb - ct) / 2 < px * 0.8 ? (cb - ct) / 2 : px * 0.8, py = ct + pr;   //圆心x y 半径

        var color = ['#F27254', '#FFBE32', '#A1BB38', '#5BC45E', '#51B4D4', '#576ACD', '#A66CE2', '#FF74E0'];
        var sum = 0; //总值
        var isfull = _getParam(option, 'isfull', false);
        var fullColumn = 3;

        beginChart();  //清空svg   再次之前对于svg 的操作都无效


        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }

            if (typeof  fun != "function") {
                fun = function () {
                };
            }

            initData();  //只取 前7  其他只计数


        }

        function bindEvent() {

            if (isPc) {
                svg.mousedown(function () {
                    $('.svgpiepie').attr('transform', '');
                    removeTip();
                    fun();
                })
            } else {
                svg.touchstart(function () {
                    $('.svgpiepie').attr('transform', '');
                    removeTip();
                    fun();
                })
            }

        }

        function initData() {
            var other = {};
            other.price = 0;
            other.time = 0;
            other.num = 0;
            other._num = 0;

            var price = data[0].price;
            for (var i = 0; i < data.length; i++) {

                //importance  最开始 一直使用 金钱画图 使用 price 字段 后来有了次数  应该读取 num 字段   ，如果以后每一步都去判断 很麻烦  不如用一个私有属性来承载这个值
                if (price != undefined) {
                    data[i]._num = data[i].price;
                } else {
                    data[i]._num = data[i].num;
                }


                var val = parseFloat(data[i]._num);

                if (isfull) {
                    var text = data[i].name.toString();
                    if (text.length > 5) {
                        fullColumn = 2;
                    }
                }


                if (!val) {
                    if (i == 0) {
                        console.log('s:第一个数据数值为0');
                        return _errImage(svg, nodataStr);
                    }
                    data.splice(i, data.length - i);
                    break;
                }

                sum += val;

                if (i + 1 > 8) {   //第九个元素
                    other._num += val;
                    other.name = '其他';
                    other.num += parseFloat(data[i].num);
                }

            }
            //如果大于8个
            if (other.name) {
                other._num += parseFloat(data[7]._num);
                other.num += parseFloat(data[7].num);
                other.price += parseFloat(data[7].price);
                other.time += parseFloat(data[7].time);
                data.splice(7, data.length - 7, other);
            }

            chartSuccess(dom, 'pie');

            if (data[0]._num == sum) {
                drawDataCircle();
            } else {
                drawDataPie();
            }

            bindEvent();


        }

        function drawDataPie() {
            var cpltpercent = 0;   //完成的圆的角度
            var aimx = [], aimy = [];
            aimx[0] = px - pr;
            aimy[0] = py;

            $.each(data, function (i, v) {
                var percent = v._num / sum;

                var flag = percent > 0.5 ? 1 : 0;
                cpltpercent += percent;

                aimx[i + 1] = px - pr * Math.cos(2 * Math.PI * cpltpercent);
                aimy[i + 1] = py - pr * Math.sin(2 * Math.PI * cpltpercent);

                var midpercent = cpltpercent - percent / 2;  //中间角度
                var movex = px - 10 * Math.cos(2 * Math.PI * midpercent) - px;
                var movey = py - 10 * Math.sin(2 * Math.PI * midpercent) - py;

                var pathString = "M " + px + " " + py + "L " + aimx[i] + " " + aimy[i] + " " + "A " + pr + " " + pr + " " + 0 + " " + flag + " " + 1 + " " + aimx[i + 1] + " " + aimy[i + 1] + " " + " Z";

                var pie = svg.g().attr({
                    'class': "svgpiepie"
                });

                var random = Math.floor(Math.random() * color.length);
                var path = svg.path(pathString).attr({
                    fill: color[random],
                    stroke: "#fff",
                    strokeWidth: "1"
                });

                pie.add(path);

                if (percent > 1 / 14) {  //画文字
                    var textx = px - pr * Math.cos(2 * Math.PI * midpercent) / 1.4 - 18;
                    var texty = py - pr * Math.sin(2 * Math.PI * midpercent) / 1.4;
                    var text = svg.text(textx, texty, Math.round(v._num * 1000 / sum) / 10 + '%').attr({
                        fill: "#fff",
                        fontSize: 12
                    });
                    pie.add(text);
                }


                if (isPc) {
                    pie.mousedown(function (e) {
                        movePie(this, movex, movey, v, e);
                    });
                } else {
                    pie.touchstart(function (e) {
                        movePie(this, movex, movey, v, e);
                    });
                }


                drawOneLegend(color[random], i, v, pie, movex, movey);
                color.splice(random, 1);

            })
        }


        function drawOneLegend(color, i, v, pie, movex, movey) {
            if (isfull) {
                var row = Math.floor(i / fullColumn);
                var cloumn = i % fullColumn;
                var rect = svg.rect(vw / 10 + cloumn * (vw * 0.8) / fullColumn, cb + 30 + row * 30, 5, 5).attr({fill: color});
                var text = svg.text(vw / 10 + cloumn * (vw * 0.8) / fullColumn + 10, cb + 38 + row * 30, _formatName(v.name, fullColumn == 3 ? 5 : 8)).attr({fontSize: 14});
            } else {
                var h = ct + i * (cb - ct) / 8 + 9;
                var rect = svg.rect(vw * 2 / 3, h, 5, 5).attr({fill: color});
                var text = svg.text(vw * 2 / 3 + 10, h + 7, isPc ? v.name : _formatName(v.name, 6)).attr({fontSize: 14});
            }

            var legend = svg.g();
            legend.add(rect, text);

            if (isPc) {
                legend.mousedown(function (e) {
                    movePie(pie, movex, movey, v, e);
                });
            } else {
                legend.touchstart(function (e) {
                    movePie(pie, movex, movey, v, e);
                });
            }


        }

        function drawDataCircle() {
            var r = Math.floor(Math.random() * 8);

            var circle = svg.circle(px, py, pr).attr({
                fill: color[r]
            });

            if (isPc) {
                circle.mousedown(function (e) {
                    e.stopPropagation();
                    circle.attr('hasTip', '1');
                    drawTip(color[r], data[0]);
                    fun(data[0]);

                }).mouseup(function () {
                    circle.attr('hasTip', '0');
                    removeTip();
                    fun();
                });
            } else {
                circle.touchstart(function (e) {
                    e.stopPropagation();
                    circle.attr('hasTip', '1');
                    drawTip(color[r], data[0]);
                    if (isfull) {
                        drawTitle(data[0].name);
                    }
                    fun(data[0]);

                }).touchend(function () {
                    circle.attr('hasTip', '0');
                    removeTip();
                    fun();
                });

            }

            svg.text(px - 12, py, '100%').attr({
                fill: "#fff",
                fontSize: 12
            });

            drawOneLegend(color[r], 0, data[0], circle);

        }

        //todo
        function movePie(pie, movex, movey, v, e) {
            if (movex) {   //饼图
                if (!pie.transform().string) {   //挪动回去
                    var color = pie.select('path').attr('fill');
                    e.stopPropagation();

                    if (isPc) {
                        $('.svgpiepie').removeAttr('transform');
                        $(pie.node).attr({
                            'transform': 'translate(' + movex + ',' + movey + ')'
                        });
                    } else {
                        $('.svgpiepie').attr('transform', '');
                        pie.animate({
                            transform: 'translate(' + movex + ',' + movey + ')'
                        }, 300, mina.easein);
                    }


                    drawTip(color, v);
                    if (isfull) {
                        drawTitle(v.name);
                    }
                    fun(v);
                }
            } else {    //圆
                var color = pie.attr('fill');
                if (pie.attr('hasTip') == 1) {
                    pie.attr({hasTip: "0"});

                } else {
                    e.stopPropagation();
                    pie.attr({hasTip: "1"});
                    drawTip(color, v);
                    if (isfull) {
                        drawTitle(v.name);
                    }
                    fun(v);
                }
            }

        }

        function drawTitle(v) {
            var text = svg.text(0, tt - 17, v).attr({
                'class': "svgpietip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);

        }


        function drawTip(color, v) {
            $('.svgpietip').remove();
            var rect = svg.rect(vw / 2, tt, 0, tb - tt, 3).attr({fill: color, 'class': "svgpietip"});


            if (typeof  data[0].time == 'undefined') {
                var text = svg.text(vw / 2, tb - ((tb - tt) - 10) / 2, [legend[0] + ':　', '￥', _formatMoney(v.price) + '　', v.num, '笔']).attr({
                    fill: '#fff',
                    'class': "svgpietip",
                    fontSize: 14
                });

            } else {
                var text = svg.text(vw / 2, tb - ((tb - tt) - 10) / 2, [legend[0] + ':　', v.time, '个客户']).attr({
                    fill: '#fff',
                    'class': "svgpietip",
                    fontSize: 14
                });

            }

            rect.attr({
                width: text.getBBox().width + 20,
                x: vw / 2 - (text.getBBox().width + 20) / 2
            });
            text.attr({
                x: vw / 2 - text.getBBox().width / 2
            });


        }

        function removeTip() {
            $('.svgpietip').remove();
        }

    }

    function drawLoop(dom, data) {

        var svg = Snap(dom);

        var vw = $(dom).width(), vh = $(dom).height();  //viwebox 宽高
        var px = vw / 2, py = vh / 2, pr = px > py ? py : px;   //圆心x y 半径

        var color = ['#7ad169', '#e5e5e5'];

        beginChart();  //清空svg   再次之前对于svg 的操作都无效


        function beginChart() {
            if (typeof nodataStr == 'undefined') {
                nodataStr = '';
            }
            if (!_init(svg, data, nodataStr)) {
                return false;
            }
            initData();


        }


        function initData() {
            var percent1, percent2;
            if (data.length != 2) {

                _err(svg, '数据错误');
            } else {
                var sum = parseInt(data[0]) + parseInt(data[1]);
                if (sum == 0) {
                    percent1 = 0.5;
                    percent2 = 0.5;
                } else {
                    percent1 = parseInt(data[0]) / sum;
                    percent2 = parseInt(data[1]) / sum;
                }
            }
            drawDataLoop(percent1, percent2);

        }

        function drawDataLoop(percent1, percent2) {
            var cpltpercent = 0;   //完成的圆的角度
            var aimx = [], aimy = [];
            aimx[0] = px;
            aimy[0] = py - pr;

            $.each([percent1, percent2], function (i, percent) {
                if (percent == 1) {
                    percent = 0.9999;   //1就是个圆  这个方法画不出来
                }

                var flag = percent > 0.5 ? 1 : 0;
                cpltpercent += percent;

                aimx[i + 1] = px + pr * Math.sin(2 * Math.PI * cpltpercent);
                aimy[i + 1] = py - pr * Math.cos(2 * Math.PI * cpltpercent);

                //var midpercent = cpltpercent - percent/2;  //中间角度
                //var movex = px - 10 * Math.cos(2 * Math.PI * midpercent)-px;
                //var movey = py - 10 * Math.sin(2 * Math.PI * midpercent)-py;

                var pathString = "M " + px + " " + py + "L " + aimx[i] + " " + aimy[i] + " " + "A " + pr + " " + pr + " " + 0 + " " + flag + " " + 1 + " " + aimx[i + 1] + " " + aimy[i + 1] + " " + " Z";


                svg.path(pathString).attr({
                    fill: color[i]
                });

            });

            svg.circle(px, py, pr * 3 / 4).attr({
                fill: '#ffffff'
            });

        }
    }

    function drawMixAvgNoTip(dom, data, legend, fun, option, nodataStr){
        var svg = Snap(dom);
        var columnSvg, columnl, cn;  //column 的坐标系 column 左边距离 column的数量

        var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
        var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 25, cl = 10, cr = vw;   //图表区域  top  bottom  left right
        var cperv, cperx = 42, cline = 5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
        var beforex = 0, transx = 0, touchx;    //柱形图原来的位移   当前的位移   本次触摸时的位移(相对于svg 不是屏幕宽度)
        var columns;   //svg.g 所有的条
        var isfull = _getParam(option, 'isfull', false);

        var touchtime;  //触摸定时器
        var avg;


        beginChart();

        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }

            if (typeof  fun != "function") {
                fun = function () {
                };
            }


            initData();
        }


        function initData() {
            //取最大值
            //算左边边距
            //大于100阶段
            //为0 除去
            //平均值是否恒定

            var n = 0;
            var max = 0;

            if (data.avg != undefined) {
                avg = data.avg;
                data = data.item;
            } else {
                avg = false;
            }


            for (var i = 0; i < data.length; i++) {
                if (n >= 100) {
                    data.splice(i, data.length - i);
                    break;
                }

                var temp = dealData(data[i], max);
                if (temp) {
                    max = temp;
                } else {
                    data.splice(i, 1);
                    i--;
                }
                n++;

            }
            if (!data.length) {
                console.log('s:' + n + '条数据num全是0');
                return _errImage(svg, nodataStr);
            }


            cperv = _getPerV(max, cline);


            chartSuccess(dom, 'column');
            drawBgLine();
            drawDataColumn();
            drawDataAvgLine();
            bindEvent();
        }

        //todo  可以 放到 _dealData
        function dealData(v, max) {
            var newmax;

            if (parseFloat(v.num) == 0) {
                return false;
            }
            newmax = parseFloat(v.num) > max ? parseFloat(v.num) : max;
            return newmax;

        }


        //todo  //todo  先计算pointx y 和花一条线
        function drawOneTip(index, tipdata) {
            if (tipdata) {
                var poiontx = index * cperx + cperx / 2 + columnl + beforex;
                var poionty = getDataY(tipdata.num) + ct - 8;

                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 2.5
                });
                var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 3,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb - tt, 4).attr({
                    fill: "#47a8ef"
                });


                if (avg) {
                    var str = [legend[0] + ':　', tipdata.num + "次"];
                } else {
                    var str = [legend[0] + ':　', tipdata.num + "次　人均:　", tipdata.avg, '次'];
                }
                var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, str).attr({
                    fill: "#fff",
                    fontSize: 14
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
                tip.attr('class', "svgcolumntip");
                tip.attr('svgcolumntipid', index);
                tip.add(rect, text, tipLine, tipcircel);


            } else {
                console.log('点击到了bar之外的区域');
            }

        }

        //todo  考虑放到 _touchData
        function drawTip(index) {
            drawOneTip(index, data[index]);
            fun(data[index]);
            if (isfull) {
                drawTitle(data[index].name);
            }
        }


        function fideTip() {
            $('.svgcolumntip').remove();
            fun();
        }

        function drawTitle(name) {
            var text = svg.text(0, tt - 8, name).attr({
                'class': "svgcolumntip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);
        }

        function moveColumn(curx, e) {
            transx = beforex + curx - touchx;
            if (transx > 0) {
                transx = 0;
            } else if (transx < -cperx * (cn + 1) + vw - columnl) {
                transx = vw - columnl < cperx * (cn + 1) ? -cperx * (cn + 1) + vw - columnl : 0;
            }
            columns.transform("translate(" + transx + ",0)");


        }

        function bindEvent() {

            if (isPc) {

                svg.mousedown(function (e) {
                    svg.unmousemove();
                    touchx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                    touchx = ( touchx / $(svg.node).width()) * vw;


                    svg.mousemove(function (e) {
                        var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                        curx = ( curx / $(svg.node).width()) * vw;
                        if (curx - touchx != 0) {
                            fideTip();
                            clearTimeout(touchtime);
                        }
                        moveColumn(curx, e);
                    });


                    svg.mouseup(function (e) {
                        svg.unmousemove();

                        svg.mousemove(function (e) {
                            var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                            curx = ( curx / $(svg.node).width()) * vw;

                            curx = curx - columnl - beforex;
                            var index = Math.floor(curx / cperx);
                            var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                            if (index >= 0 && index < cn && lastIndex != index) {
                                fideTip();
                                drawTip(index);
                            }
                        });

                        beforex = transx;
                    });

                });

                svg.mousemove(function (e) {
                    var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                    curx = ( curx / $(svg.node).width()) * vw;

                    curx = curx - columnl - beforex;
                    var index = Math.floor(curx / cperx);
                    var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                    if (index >= 0 && index < cn && lastIndex != index) {
                        fideTip();
                        drawTip(index);
                    }
                });

                $(dom).mouseleave(function () {
                    fideTip();
                });


            } else {

                svg.touchstart(function (e) {
                    touchx = e.touches[0].clientX;
                    if (isfull) {
                        touchx = ( touchx / $(svg.node).width()) * vw;
                    }

                    svg.touchmove(function (e) {
                        clearTimeout(touchtime);
                        if (isfull) {
                            var curx = e.touches[0].clientX;

                            e.preventDefault();

                            curx = ( curx / $(svg.node).width()) * vw;
                            moveColumn(curx, e);

                        }
                    });
                });


                svg.touchend(function (e) {
                    svg.untouchmove();
                    beforex = transx;
                });

            }
        }


        function drawBgLine() {
            columnl = 0;
            var lineh = (cb - ct) / cline;

            var bgLine = svg.line(cl, cb, cr, cb).attr({
                stroke: "#e2e2e2",
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

                var text = svg.text(cl, h + 15, _formatMoney(cperv * i)).attr({
                    fill: fontColor,
                    fontSize: 12
                });

                columnl = text.getBBox().width + cl + 10 > columnl ? text.getBBox().width + cl + 10 : columnl;

            }


        }

        function getDataY(val) {
            if (!val) {
                val = 0;
            }

            val = parseFloat(val);
            return cb - ct - (val / (cperv * cline)) * (cb - ct);

        }

        function drawOneColumn(v, name) {

            var x = cperx * cn;
            var y = getDataY(v);

            var rect = columnSvg.rect(name ? x + 16 : x + 28, y, 10, cb - ct - y).attr({
                fill: name ? '#7cb7ef' : '#f5a25c'
            });


            columns.add(rect);


            if(name){
                var value = columnSvg.text(x, y -2, v).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                value.attr("x", x + (cperx - value.getBBox().width) / 2);
                columns.add(value);
            }


            //todo
            name = name.toString();
            var longs = 6;
            if (name.length > longs) {
                name = _formatName(name, longs);

            }
            if (name.length > longs / 2) {
                var name1 = name.substr(0, longs / 2);
                var name2 = name.substr(longs / 2);
                var text1 = columnSvg.text(x, cb - ct + 11, name1).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                var text2 = columnSvg.text(x, cb - ct + 22, name2).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                text1.attr("x", x + (cperx - text1.getBBox().width) / 2);
                text2.attr("x", x + (cperx - text1.getBBox().width) / 2);
                columns.add(text1, text2);

            } else {
                var text = columnSvg.text(x, cb - ct + 11, name).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                text.attr("x", x + (cperx - text.getBBox().width) / 2);
                columns.add(text);
            }
        }

        function drawDataAvgLine() {


            if (avg) {

                var marker = svg.circle(2, 2, 1.2).attr({
                    stroke: "#f5a25c",
                    strokeWidth: 1,
                    fill: "#ffffff"
                });
                var makerend = marker.marker(0, 0, 4, 4, 2, 2);


                var datapath = 'M' + (columnl + cperx / 5) + ' ' + (getDataY(avg) + ct) + 'L' + (cr - cperx / 5 - 5) + ' ' + (getDataY(avg) + ct);
                svg.path(datapath).attr({
                    stroke: "#f5a25c",
                    strokeWidth: 2.5,
                    fill: 'none',
                    strokeLinejoin: 'bevel',
                    markerEnd: makerend
                });


                var rect = svg.rect(vw, getDataY(avg) + ct - 20 - 13, 0, 17, 10, 10).attr({
                    fill: "#f5a25c"
                });
                var text = svg.text(vw, getDataY(avg) + ct - 20, '人均' + avg + 'Km').attr({
                    fill: "#ffffff",
                    fontSize: 12
                });
                rect.attr({
                    x: cr - text.getBBox().width - 15,
                    width: text.getBBox().width + 10
                });
                text.attr({
                    x: cr - text.getBBox().width - 10
                });

            }
        }

        function drawDataColumn() {
            columnSvg = svg.svg(columnl, ct, vw - columnl, vh - ct);
            columns = columnSvg.g();
            cn = 0;


            for (var i = 0; i < data.length; i++) {
                drawOneColumn(data[i].num, data[i].name);
                cn++;
            }
        }

    }

    function drawMixAvg(dom, data, legend, fun, option, nodataStr) {
            var svg = Snap(dom);
            var columnSvg, columnl, cn;  //column 的坐标系 column 左边距离 column的数量

            var vw = _getParam(option, 'vw', $(dom).width()), vh = _getParam(option, 'vh', $(dom).height());  //viwebox 宽高
            var tt = _getParam(option, 'tt', 0), tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
            var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 25, cl = 10, cr = vw;   //图表区域  top  bottom  left right
            var cperv, cperx = 42, cline = 5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
            var beforex = 0, transx = 0, touchx;    //柱形图原来的位移   当前的位移   本次触摸时的位移(相对于svg 不是屏幕宽度)
            var columns;   //svg.g 所有的条
            var isfull = _getParam(option, 'isfull', false);

            var touchtime;  //触摸定时器
            var avg;


            beginChart();

            function beginChart() {
                if (!_init(svg, data, nodataStr)) {
                    return false;
                }

                if (typeof  fun != "function") {
                    fun = function () {
                    };
                }


                initData();
            }


            function initData() {
                //取最大值
                //算左边边距
                //大于100阶段
                //为0 除去
                //平均值是否恒定

                var n = 0;
                var max = 0;

                if (data.avg != undefined) {
                    avg = data.avg;
                    data = data.item;
                } else {
                    avg = false;
                }


                for (var i = 0; i < data.length; i++) {
                    if (n >= 100) {
                        data.splice(i, data.length - i);
                        break;
                    }

                    var temp = dealData(data[i], max);
                    if (temp) {
                        max = temp;
                    } else {
                        data.splice(i, 1);
                        i--;
                    }
                    n++;

                }
                if (!data.length) {
                    console.log('s:' + n + '条数据num全是0');
                    return _errImage(svg, nodataStr);
                }


                cperv = _getPerV(max, cline);


                chartSuccess(dom, 'column');
                drawBgLine();
                drawDataColumn();
                drawDataAvgLine();
                bindEvent();
            }

            //todo  可以 放到 _dealData
            function dealData(v, max) {
                var newmax;

                if (parseFloat(v.num) == 0) {
                    return false;
                }
                newmax = parseFloat(v.num) > max ? parseFloat(v.num) : max;
                return newmax;

            }


            //todo  //todo  先计算pointx y 和花一条线
            function drawOneTip(index, tipdata) {
                if (tipdata) {
                    var poiontx = index * cperx + cperx / 2 + columnl + beforex;
                    var poionty = getDataY(tipdata.num) + ct - 8;

                    var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                        stroke: "#d2d2d2",
                        strokeWidth: 2.5
                    });
                    var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                        stroke: "#47a8ef",
                        strokeWidth: 3,
                        fill: "#fff"
                    });


                    var rect = svg.paper.rect(poiontx, tt, 100, tb - tt, 4).attr({
                        fill: "#47a8ef"
                    });


                    if (avg) {
                        var str = [legend[0] + ':　', tipdata.num + "次"];
                    } else {
                        var str = [legend[0] + ':　', tipdata.num + "次　人均:　", tipdata.avg, '次'];
                    }
                    var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, str).attr({
                        fill: "#fff",
                        fontSize: 14
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
                    tip.attr('class', "svgcolumntip");
                    tip.attr('svgcolumntipid', index);
                    tip.add(rect, text, tipLine, tipcircel);


                } else {
                    console.log('点击到了bar之外的区域');
                }

            }

            //todo  考虑放到 _touchData
            function drawTip(index) {
                drawOneTip(index, data[index]);
                fun(data[index]);
                if (isfull) {
                    drawTitle(data[index].name);
                }
            }


            function fideTip() {
                $('.svgcolumntip').remove();
                fun();
            }

            function drawTitle(name) {
                var text = svg.text(0, tt - 8, name).attr({
                    'class': "svgcolumntip",
                    fill: "#1978bc",
                    fontSize: 18
                });
                text.attr('x', vw / 2 - text.getBBox().width / 2);
            }

            function moveColumn(curx, e) {
                transx = beforex + curx - touchx;
                if (transx > 0) {
                    transx = 0;
                } else if (transx < -cperx * (cn + 1) + vw - columnl) {
                    transx = vw - columnl < cperx * (cn + 1) ? -cperx * (cn + 1) + vw - columnl : 0;
                }
                columns.transform("translate(" + transx + ",0)");


            }

            function bindEvent() {

                if (isPc) {

                    svg.mousedown(function (e) {
                        svg.unmousemove();
                        touchx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                        touchx = ( touchx / $(svg.node).width()) * vw;


                        svg.mousemove(function (e) {
                            var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                            curx = ( curx / $(svg.node).width()) * vw;
                            if (curx - touchx != 0) {
                                fideTip();
                                clearTimeout(touchtime);
                            }
                            moveColumn(curx, e);
                        });


                        svg.mouseup(function (e) {
                            svg.unmousemove();

                            svg.mousemove(function (e) {
                                var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                                curx = ( curx / $(svg.node).width()) * vw;

                                curx = curx - columnl - beforex;
                                var index = Math.floor(curx / cperx);
                                var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                                if (index >= 0 && index < cn && lastIndex != index) {
                                    fideTip();
                                    drawTip(index);
                                }
                            });

                            beforex = transx;
                        });

                    });

                    svg.mousemove(function (e) {
                        var curx = e.clientX + $(document).scrollLeft() - $(svg.node).offset().left;
                        curx = ( curx / $(svg.node).width()) * vw;

                        curx = curx - columnl - beforex;
                        var index = Math.floor(curx / cperx);
                        var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                        if (index >= 0 && index < cn && lastIndex != index) {
                            fideTip();
                            drawTip(index);
                        }
                    });

                    $(dom).mouseleave(function () {
                        fideTip();
                    });


                } else {

                    svg.touchstart(function (e) {
                        touchx = e.touches[0].clientX;
                        if (isfull) {
                            touchx = ( touchx / $(svg.node).width()) * vw;
                        }

                        touchtime = setTimeout(function () {
                            svg.untouchmove();
                            var curx = touchx - columnl - beforex;
                            var index = Math.floor(curx / cperx);
                            if (index >= 0 && index < cn) {
                                drawTip(index);
                            }


                            svg.touchmove(function (e) {
                                e.preventDefault();
                                touchx = e.touches[0].clientX;
                                if (isfull) {
                                    touchx = ( touchx / $(svg.node).width()) * vw;
                                }

                                var curx = touchx - columnl - beforex;
                                var index = Math.floor(curx / cperx);
                                var lastIndex = $('.svgcolumntip').attr('svgcolumntipid');
                                if (index >= 0 && index < cn && lastIndex != index) {
                                    fideTip();
                                    drawTip(index);
                                }
                            });
                        }, 100);


                        svg.touchmove(function (e) {
                            clearTimeout(touchtime);
                            if (isfull) {
                                var curx = e.touches[0].clientX;

                                e.preventDefault();

                                curx = ( curx / $(svg.node).width()) * vw;
                                moveColumn(curx, e);

                            }
                        });
                    });


                    svg.touchend(function (e) {
                        svg.untouchmove();
                        fideTip();
                        clearTimeout(touchtime);
                        beforex = transx;
                    });

                }
            }


            function drawBgLine() {
                columnl = 0;
                var lineh = (cb - ct) / cline;

                var bgLine = svg.line(cl, cb, cr, cb).attr({
                    stroke: "#e2e2e2",
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

                    var text = svg.text(cl, h + 15, _formatMoney(cperv * i)).attr({
                        fill: fontColor,
                        fontSize: 12
                    });

                    columnl = text.getBBox().width + cl + 10 > columnl ? text.getBBox().width + cl + 10 : columnl;

                }


            }

            function getDataY(val) {
                if (!val) {
                    val = 0;
                }

                val = parseFloat(val);
                return cb - ct - (val / (cperv * cline)) * (cb - ct);

            }

            function drawOneColumn(v, name) {

                var x = cperx * cn;
                var y = getDataY(v);

                var rect = columnSvg.rect(name ? x + 16 : x + 28, y, 10, cb - ct - y).attr({
                    fill: name ? '#7cb7ef' : '#f5a25c'
                });


                columns.add(rect);

                //todo
                name = name.toString();
                var longs = 6;
                if (name.length > longs) {
                    name = _formatName(name, longs);

                }
                if (name.length > longs / 2) {
                    var name1 = name.substr(0, longs / 2);
                    var name2 = name.substr(longs / 2);
                    var text1 = columnSvg.text(x, cb - ct + 11, name1).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    var text2 = columnSvg.text(x, cb - ct + 22, name2).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    text1.attr("x", x + (cperx - text1.getBBox().width) / 2);
                    text2.attr("x", x + (cperx - text1.getBBox().width) / 2);
                    columns.add(text1, text2);

                } else {
                    var text = columnSvg.text(x, cb - ct + 11, name).attr({
                        fill: fontColor,
                        fontSize: 10
                    });
                    text.attr("x", x + (cperx - text.getBBox().width) / 2);
                    columns.add(text);
                }
            }

            function drawDataAvgLine() {


                if (avg) {

                    var marker = svg.circle(2, 2, 1.2).attr({
                        stroke: "#f5a25c",
                        strokeWidth: 1,
                        fill: "#ffffff"
                    });
                    var makerend = marker.marker(0, 0, 4, 4, 2, 2);


                    var datapath = 'M' + (columnl + cperx / 5) + ' ' + (getDataY(avg) + ct) + 'L' + (cr - cperx / 5 - 5) + ' ' + (getDataY(avg) + ct);
                    svg.path(datapath).attr({
                        stroke: "#f5a25c",
                        strokeWidth: 2.5,
                        fill: 'none',
                        strokeLinejoin: 'bevel',
                        markerEnd: makerend
                    });


                    var rect = svg.rect(vw, getDataY(avg) + ct - 20 - 13, 0, 17, 10, 10).attr({
                        fill: "#f5a25c"
                    });
                    var text = svg.text(vw, getDataY(avg) + ct - 20, '人均' + avg + '次').attr({
                        fill: "#ffffff",
                        fontSize: 12
                    });
                    rect.attr({
                        x: cr - text.getBBox().width - 15,
                        width: text.getBBox().width + 10
                    });
                    text.attr({
                        x: cr - text.getBBox().width - 10
                    });

                } else {
                    var datapath = 'M' + (cperx / 2) + ' ' + getDataY(data[0].avg);


                    //中间节点
                    for (var i = 1; i < data.length; i++) {
                        if (data[i] != undefined) {
                            datapath += 'L' + (cperx * i + cperx / 2) + ' ' + getDataY(data[i].avg);
                        }
                    }
                    if (data.length == 1) {   //只有一个点 。。 就画一个小圆
                        var dataPoint = columnSvg.circle(cperx / 2, getDataY(data[0].avg), 4).attr({
                            stroke: "#f5a25c",
                            strokeWidth: 2,
                            fill: "#ffffff"
                        });

                        columns.add(dataPoint);
                    } else {
                        var dataline = columnSvg.path(datapath).attr({
                            stroke: "#f5a25c",
                            strokeWidth: 2.5,
                            fill: 'none',
                            strokeLinejoin: 'bevel'
                        });
                        columns.add(dataline);
                    }


                }
            }

            function drawDataColumn() {
                columnSvg = svg.svg(columnl, ct, vw - columnl, vh - ct);
                columns = columnSvg.g();
                cn = 0;


                for (var i = 0; i < data.length; i++) {
                    drawOneColumn(data[i].num, data[i].name);
                    cn++;
                }
            }

        }

    //3条数据，对比，重叠
    function drawProgress3(dom, data, legend, fun, tip, option, nodataStr) {
        var svg = Snap(dom);//svg元素
        var barSvg, bl = 0, bn;  //bar 的坐标系  b的数量

        var vw = _getParam(option, 'vw', $(dom).width());  //viewbox 宽
        var vh = _getParam(option, 'vh', $(dom).height());  //viewbox 高
        var tt = _getParam(option, 'tt', 0);   //提示框离头部距离
        var tb = _getParam(option, 'tb', 30);  //提示框离头部距离 提示框底部
        var ct = _getParam(option, 'ct', 2 * (tb - tt) + tt + 10), cb = vh - 18, cl = 10, cr = vw - 20;   //图表区域  top  bottom  left right
        var cperv, cpery, cline = vw < 400 ? 5 : 6;  //图表横向每段值val  图表纵向每段宽度  图表横向分几段
        var iscompre, islayer;   //是否是对比,是否是2级
        var beforey = 0, transy = 0, touchy;    //原来的位移   当前的位移   本次触摸时的位移
        var bars;    //svg.g 所有的条
        var isfull = _getParam(option, 'isfull', false);
        var smpdata;   //采样数据
        var touchtime;  //触摸定时器

        var dataFix = false;//importance 新版本需要另外一种 tip的图，为了修改方便     以前程序不变， 用老字段 存新字段的值 来画图 ， 用该变量 判断花哪一种tip

        beginChart();

        function beginChart() {
            if (!_init(svg, data, nodataStr)) {
                return false;
            }
            if (typeof  fun != "function") {
                fun = function () {
                };
            }

            iscompre = true;
            islayer =false;
            dataFix = true;
            cpery =  26;

            initData();  //取前100
        }

        function initData() {
            //取最大值
            //算左边边距
            //大于100截断
            //为0 除去

            var n = 0;
            var max = 0;
            for (var i = 0; i < data.length; i++) {
                if (n >= 100) {
                    data.splice(i, data.length - i);
                    break;
                }

                if (dataFix) {
                    data[i].k1.price = data[i].k1.num;
                    data[i].k2.price = data[i].k2.num;
                    data[i].k3.price = data[i].k3.num;
                }


                var temp = dealData(data[i], max);
                if (temp) {
                    max = temp;

                    if (bl < 84) {
                        var longs = data[i].name.toString().length * 13 + 6 > 84 ? 84 : data[i].name.toString().length * 13 + 6;
                        bl = bl < longs ? longs : bl;
                    }
                } else {
                    data.splice(i, 1);
                    i--;
                }
                n++;
            }

            if (!data.length) {
                console.log('s:' + n + '条数据全是0');
                return _errImage(svg);
            }

            cperv = _getPerV(max, cline);


            chartSuccess(dom, 'bar');
            drawBgLine();
            drawDataBar();
            bindEvent();

        }

        function dealData(v, max) {
            var newmax;
            if (iscompre) {
                if (parseFloat(v.k1.price) == 0 && parseFloat(v.k2.price) == 0 && parseFloat(v.k3.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.k1.price) > max ? parseFloat(v.k1.price) : max;
                newmax = parseFloat(v.k2.price) > newmax ? parseFloat(v.k2.price) : newmax;
                if(v.k3){
                    newmax = parseFloat(v.k2.price) + parseFloat(v.k3.price) > newmax ? parseFloat(v.k2.price) + parseFloat(v.k3.price) : newmax;
                }
                return newmax;
            } else {
                if (parseFloat(v.price) == 0) {
                    return false;
                }
                newmax = parseFloat(v.price) > max ? parseFloat(v.price) : max;
                return newmax;
            }
        }

        function drawBgLine() {

            var lineh = (cr - bl) / cline;

            for (var i = 0; i <= cline; i++) {
                var x = bl + i * lineh;

                svg.line(x, cb, x, ct).attr({
                    stroke: "#e2e2e2",
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });

                var text = svg.text(x, vh - 4, _formatMoney(cperv * i)).attr({
                    fill: fontColor,
                    fontSize: 10
                });
                text.attr('x', x - text.getBBox().width / 2);
            }

        }

        function drawOneBar(v,v2,v3,name) {
            var text = barSvg.text(bl,  bn * cpery + 14, islayer ? _formatName(name, 5) : _formatName(name, 6)).attr({
                fill: fontColor,
                fontSize: 12
            });
            text.attr('x', bl - text.getBBox().width - 4);
            bars.add(text);

            var xv = getDataX(v);
            var xv2 = getDataX(v2);
            var v4;
            if(xv > xv2){
                v4 = parseFloat(v)+parseFloat(v3);
            }else{
                v4 = parseFloat(v2)+parseFloat(v3);
            }

            var xv3 = getDataX(v4);

            var rect = barSvg.rect(bl,bn * cpery + 5 , xv3, 10).attr({
                fill: '#e4e4e4'
            });
            bars.add(rect);

            var rect2 = barSvg.rect(bl,bn * cpery + 5 ,xv2, 10).attr({
                fill:  '#88bf57'
            });
            bars.add(rect2);

            var rect3 = barSvg.rect(bl,bn * cpery + 5 ,xv, 10).attr({
                fill:  '#31B2E6'
            });
            bars.add(rect3);

            var completeness;
            var v5 = parseFloat(v)+parseFloat(v3);
            if(0!=v2 && parseFloat(v)<=parseFloat(v2)){
                completeness = Number(Math.round(v5/v2*10000)/100).toFixed(2)+'%';
            }else if(0==v2 && 0==v){
                completeness = v5 + '家';
            }else{
                console.log("出错了，请检查数据。",'v:' + v, 'v2:' + v2,'v3:' + v3);
                completeness = '非法数据';
            }

            var textProgeress = barSvg.text(bl+xv3,  bn * cpery + 14, '　('+completeness+')').attr({
                fill: '#a3a3a3',
                fontSize: 11,
                'class':"completeness"
            });

            var progress = v4/(cline * cperv);
            if(progress > 0.8 &&  bl + getDataX(v4) + textProgeress.getBBox().width > cr) {
                textProgeress.attr('x', bl + getDataX(v4) - textProgeress.getBBox().width - 4);
                textProgeress.attr('fill','#000');
            }
            bars.add(textProgeress);
        }

        function drawDataBar() {
            barSvg = svg.svg(0, ct, vw, cb - ct);

            bars = barSvg.g();

            bn = 0;
            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                drawOneBar(item.k1.price,item.k2.price,item.k3.price, item.name);
                bn++;
            }
        }

        function getDataX(v) {
            if (!v) {
                return 0;
            }
            return (parseFloat(v) / (cline * cperv)) * (cr - bl);
        }

        function bindEvent() {
            if (isPc) {
                svg.mousedown(function (e) {
                    touchy = e.clientY + $(document).scrollTop() - $(svg.node).offset().top;
                    touchy = touchy / 1.4;
                    if (touchy > ct && touchy < cb) {
                        touchtime = setTimeout(function () {
                            //svg.unmousemove(); // ↑
                            var cury = touchy - ct - beforey;   //  点击的元素的高度
                            var index = Math.floor(cury / cpery);
                            if (index >= 0 && index < bn) {
                                drawTip(index);
                            }

                        }, 100);

                        svg.mousemove(function (e) {

                            var y = e.clientY + $(document).scrollTop() - $(svg.node).offset().top;
                            y = y / 1.4;
                            if (y - touchy != 0) {
                                fideTip(); //  ↓
                                clearTimeout(touchtime);
                            }
                            moveBars(y, e);

                        });

                    }

                });

                svg.mouseup(function (e) {
                    svg.unmousemove();
                    fideTip();
                    clearTimeout(touchtime);

                    beforey = transy;
                });

                $(dom).mouseleave(function () {
                    svg.unmousemove();
                });


            } else {
                svg.touchstart(function (e) {
                    touchy = e.touches[0].clientY;
                    var svgy = touchy + $(document).scrollTop() - svg.node.offsetTop;  //点在svg 上的y
                    if (svgy > ct && svgy < cb) {

                        touchtime = setTimeout(function () {
                            svg.untouchmove(); // ↑
                            var cury = svgy - ct - beforey;   //  点击的元素的高度
                            var index = Math.floor(cury / cpery);
                            if (index >= 0 && index < bn) {
                                drawTip(index);
                            }

                            svg.touchmove(function (e) {
                                e.preventDefault();
                                touchy = e.touches[0].clientY;
                                var svgy = touchy + $(document).scrollTop() - svg.node.offsetTop;  //点在svg 上的y
                                if (svgy > ct && svgy < cb) {
                                    var cury = svgy - ct - beforey;   //  点击的元素的高度
                                    var index = Math.floor(cury / cpery);
                                    var lastIndex = $('.svgbartip').attr('svgbartipid');
                                    if (index >= 0 && index < bn && lastIndex != index) {
                                        fideTip();
                                        drawTip(index);
                                    }
                                }
                            });


                        }, 100);


                        svg.touchmove(function (e) {
                            clearTimeout(touchtime);

                            if (isfull) {
                                e.preventDefault();
                                var y = e.touches[0].clientY;
                                moveBars(y, e);
                            }

                        });

                    }

                });


                svg.touchend(function (e) {
                    svg.untouchmove();
                    fideTip();
                    clearTimeout(touchtime);


                    beforey = transy;
                });
            }


        }

        function moveBars(cury, e) {
            transy = beforey + cury - touchy;
            if (transy > 0) {
                transy = 0;
            } else if (transy < -cpery * (bn + 1) + (cb - ct)) {
                transy = cb - ct < cpery * (bn + 1) ? -cpery * (bn + 1) + (cb - ct) : 0;
            }

            bars.transform("translate(0," + transy + ")");
        }

        //todo  先计算pointx y 和画一条线
        function drawOneTip(index, tipdata, k2data, k3data) {
            if (tipdata) {
                var poionty = index * cpery + cpery / 2 + ct + beforey-3;
                var poiontx;
                if (!iscompre) {
                    poiontx = getDataX(tipdata.price) + bl + 8;
                }else if(parseFloat(tipdata.price)>parseFloat(k2data.price)) {
                    poiontx = getDataX(tipdata.price)+ getDataX(k3data.price) + bl + 8;
                }else{
                    poiontx = getDataX(k2data.price)+ getDataX(k3data.price) + bl + 8;
                }

                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 2.5
                });
                var tipcircel = svg.circle(poiontx, poionty, 3).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 3,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb - tt, 4).attr({
                    fill: "#47a8ef"
                });


                if (!dataFix) {
                    var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, [legend[0] + ':　', "￥", _formatMoney(tipdata.price) + "　", tipdata.num, "笔"]).attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                    text.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });
                } else {
                    var text = svg.paper.text(poiontx, tb - (tb - tt - 14) / 2, '已完成计划 ' + tipdata.num + ' 家/计划 ' + k2data.num + ' 家，计划外 ' + k3data.num + ' 家').attr({
                        fill: "#fff",
                        fontSize: 14
                    });

                }

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
                tip.attr('class', "svgbartip");
                tip.attr('svgbartipid', index);
                tip.add(rect, text, tipLine, tipcircel);

            } else {
                console.log('s:点击到了bar之外的区域');
            }

        }

        function drawTip(index) {
            if (tip){
                if (islayer) {
                    var layer = _getLayer(index, data);

                    if (iscompre) {

                        drawOneTip(index, data[layer.parent].item[layer.child].k1, data[layer.parent].item[layer.child].k2, data[layer.parent].item[layer.child].k3);

                    } else {
                        drawOneTip(index, data[layer.parent].item[layer.child]);
                    }
                    fun(data[layer.parent].item[layer.child]);
                    if (isfull) {
                        drawTitle(data[layer.parent].item[layer.child].name);
                    }


                } else {
                    if (iscompre) {
                        drawOneTip(index, data[index].k1, data[index].k2, data[index].k3);
                    } else {
                        drawOneTip(index, data[index]);
                    }
                    fun(data[index]);
                    if (isfull) {
                        drawTitle(data[index].name);
                    }
                }
                $('.completeness').hide();
            }
        }

        function drawTitle(name) {
            var text = svg.text(0, tt - 8, name).attr({
                'class': "svgbartip",
                fill: "#1978bc",
                fontSize: 18
            });
            text.attr('x', vw / 2 - text.getBBox().width / 2);
        }

        function fideTip() {
            $('.svgbartip').remove();
            $('.completeness').show();
            fun();
        }

    }


    function drawFullColumn(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom, 340);
        var vw = v.width;
        var vh = v.height;

        var tb = 55;
        var tt = 30;
        var option = {
            tb: tb,
            tt: tt,
            ct: 2 * (tb - tt) + tt + 3,
            vw: vw,
            vh: vh,
            isfull: true

        };

        drawColumn(dom, data, legend, fun, option, nodataStr);
    }

    function drawFullMixAvg(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom, 340);
        var vw = v.width;
        var vh = v.height;

        var tb = 55;
        var tt = 30;
        var option = {
            tb: tb,
            tt: tt,
            ct: 2 * (tb - tt) + tt + 3,
            vw: vw,
            vh: vh,
            isfull: true

        };

        drawMixAvg(dom, data, legend, fun, option, nodataStr);
    }

    function drawFullLine(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom, 300);
        var vw = v.width;
        var vh = v.height;

        var tb = 40;
        var tt = 10;
        var option = {
            tb: tb,
            tt: tt,
            ct: 2 * (tb - tt) + tt + 3,
            vw: vw,
            vh: vh,
            isfull: true
        };

        drawLine(dom, data, legend, fun, option, nodataStr);
    }

    function drawFullBar(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom);
        var vw = v.width;
        var vh = v.height;


        var option = {
            vw: vw,
            vh: vh - 80,
            tt: 30,
            tb: 60,
            isfull: true

        };

        drawBar(dom, data, legend, fun, option, nodataStr);
    }

    function drawFullProgress(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom);
        var vw = v.width;
        var vh = v.height;


        var option = {
            vw: vw,
            vh: vh - 80,
            tt: 30,
            tb: 60,
            isfull: true

        };

        drawProgress(dom, data, legend, fun, option, nodataStr);
    }

    function drawFullPie(dom, data, legend, fun, nodataStr) {
        var v = _fullScreen(dom);
        var vw = v.width;
        var vh = v.height;

        var cb = vh - 220;

        var option = {
            cb: cb,
            tb: 85,
            tt: 50,

            px: vw / 2,
            vw: vw,
            vh: vh,
            isfull: true
        };

        drawPie(dom, data, legend, fun, option, nodataStr);
    }

    function drawHomeLine(dom, data, legend, fun, nodataStr) {
        isHome = true;
        var option = {
            isHome: true,
            tt: 20,
            tb: 55,
            ct: 70
        };
        drawLine(dom, data, legend, fun, option, nodataStr);
    }

    function _err(svg, str) {
        //todo 全屏画不出来  vw   vh
        var text = svg.text($(svg.node).width() / 2, $(svg.node).height() / 2 + 20, str).attr({
            fontSize: 24
        });
        text.attr({
            x: $(svg.node).width() / 2 - text.getBBox().width / 2
        });
        return false;
    }

    function _errImage(svg, nodataStr) {
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
        var str1 = '暂无经营数据';
        var str2 = '赶快使用订单系统，公司经营各项数据轻松在手！';
        if (nodataStr) {
            str1 = nodataStr.split('|')[0];
            str2 = nodataStr.split('|')[1];
        }
        var text = svg.text(svgw / 2, img.getBBox().y2 + 24, str1).attr({
            fontSize: 16,
            fill: isHome ? '#67b7ed' : '#bbbbbb'
        });
        var text2 = svg.text(svgw / 2, img.getBBox().y2 + 46, str2).attr({
            fontSize: 14,
            fill: isHome ? '#67b7ed' : '#bbbbbb'
        });
        text.attr({
            x: svgw / 2 - text.getBBox().width / 2
        });
        text2.attr({
            x: svgw / 2 - text2.getBBox().width / 2
        });
        return false
    }

    function _formatName(str, i) {
        return str.substr(0, i);
    }

    function _getParam(option, name, def) {
        if (option) {
            return option[name] != undefined ? option[name] : def;
        } else {
            return def;
        }

    }

    function _fullScreen(dom, height) {
        var svg = Snap(dom);
        svg.attr('height', '100%');

        var v = {};

        if (!height) {
            v.width = $(window).width();
            v.height = $(window).height();
        } else {
            v.height = height;
            v.width = v.height * $(window).width() / $(window).height();

        }


        svg.attr("viewBox", '0 0 ' + v.width + ' ' + v.height);
        return v;
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

    function _getLayer(index, data) {
        var parent = 0;
        var child = 0;
        var curn = 0;

        for (var i = 0; i < data.length; i++) {
            if (index < data[i].item.length + curn) {
                parent = i;
                child = index - curn;
                return {parent: parent, child: child};
            } else {
                curn = data[i].item.length + curn;
            }

        }
        return false;

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

    return {
        draw: draw,

        drawBar: drawBar,
        drawLine: drawLine,
        drawColumn: drawColumn,
        drawPie: drawPie,
        drawLoop: drawLoop,
        drawMixAvg: drawMixAvg,
        drawMixAvgNoTip: drawMixAvgNoTip,
        drawHomeLine: drawHomeLine,
        drawProgress: drawProgress,
        drawProgress3: drawProgress3,
        drawFullBar: drawFullBar,
        drawFullLine: drawFullLine,
        drawFullMixAvg: drawFullMixAvg,
        drawFullPie: drawFullPie,
        drawFullColumn: drawFullColumn,
        drawFullProgress: drawFullProgress

    };

});



