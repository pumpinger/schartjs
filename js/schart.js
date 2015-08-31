var s={
    isPc:false,
    _init:function(svg,data){
        svg.clear();//清空svg   再次之前对于svg的操作都无效


        //if(window.orientation == undefined){
        //    s.isPc=true;
        //}

        var ua = navigator.userAgent;
        var ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
            isIphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
            isAndroid = ua.match(/(Android)\s+([\d.]+)/),
            isMobile = isIphone || isAndroid;
        if( !isMobile) {
            s.isPc=true;
        }

        if(s.isPc){
            svg.unmousedown();
            svg.unmousemove();
            svg.unmouseup();
            svg.unmouseout();
        }else{
            svg.untouchmove();
            svg.untouchstart();
            svg.untouchend();
        }




        if ( typeof  data !="object" ) {
            console.log('s:非法数据');
            return s._err(svg,'暂无数据');
        }else{
            for(var i in data){
                return true;
            }
            console.log('s:无数据');
            return s._err(svg,'暂无数据');
        }

    },

    drawLine:function(dom,data,legend,fun,option) {
        var svg = Snap(dom);

        var vw = s._getParam(option,'vw',$(dom).width()), vh = s._getParam(option,'vh',$(dom).height());  //viwebox 宽高
        //$('svg').attr('height',$(window).width()*(vh/vw));    //viewbox 下 android 不能自适应hight
        var tt = s._getParam(option,'tt',0),tb = s._getParam(option,'tb',30);  //提示框离头部距离 提示框底部
        var ct =s._getParam(option,'ct',2*(tb-tt)+tt+10), cb = vh-23,cl = 10, cr = vw-10;   //图表区域  top  bottom  left right
        var cperv, cperx, cline=5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
        var isHome=s._getParam(option,'isHome',false);
        var isfull=s._getParam(option,'isfull',false);
        var iscompre;   //是否是比较  画双线
        var smpdata;   //采样数据  画背景线
        var touchtime;

        beginChart();

        function beginChart() {
            if(! s._init(svg,data)){
                return false;
            }

            if(typeof  fun  != "function"){
                fun=function(){};
            }


            iscompre=legend.length==2?true:false;
            //取 长度长的线条为  采样
            if(iscompre){
                smpdata=data.k1.length >data.k2.length?data.k1:data.k2;
            }else{
                smpdata=data;
            }

            if(smpdata.length>1){
                cperx = (cr - cl) / (smpdata.length - 1);
            }else{
                cperx = cr - cl;
            }
            cperv = _setPerLineH();


            drawBgLine();
            drawDataLine();
            bindEvent();
        }


        function bindEvent(){
            if(s.isPc){
                svg.mousemove(function (e) {
                    var x = e.clientX+$(document).scrollLeft()-$(svg.node).offset().left;
                    popTip(x);

                });

                svg.mouseout(function () {
                    fadeTip();
                });

            }else{
                svg.touchstart(function (e) {
                    var x = e.touches[0].clientX;

                    touchtime=setTimeout(function (){
                        popTip(x);
                        svg.touchmove(function (e) {
                            e.preventDefault();
                            var x = e.touches[0].clientX;
                            popTip(x);

                        });
                    },100);

                    svg.touchmove(function (e) {
                        clearTimeout(touchtime);
                    });

                });



                svg.touchend(function () {
                    setTimeout(function (){
                        svg.untouchmove();
                        fadeTip();
                    },100);

                });
            }
        }

        function popTip(x){
            $('.svglinetip').remove();
            $('.svglinemaker').hide();
            var index = getCurIndex(x);
            drawTip(index);


        }

        function fadeTip(){
            $('.svglinetip').remove();
            $('.svglinemaker').show();
            fun();
        }

        function drawOneTip(index,tipdata,isK2){
            var poiontx = index * cperx + cl;
            var poionty = getDataY(tipdata.price);

            if(!isK2 ){
                var tipLine = svg.line(poiontx, cb, poiontx, tb).attr({
                    stroke: isHome?"#6ba8e1":"#d2d2d2",
                    strokeWidth: 2.5
                });
            }

            var tipcircel = svg.circle(poiontx, poionty,3).attr({
                stroke: isHome?"#fff":isK2?"#f5a25c":"#2484ce",
                strokeWidth: 2,
                fill: isHome?"#47a8ef":"#fff"
            });
            var rect = svg.paper.rect(poiontx, isK2?tb+1:tt, 100, tb-tt, 4).attr({
                fill: isHome?"#fff":isK2?"#f5a25c":"#47a8ef"
            });

            var text=svg.paper.text(poiontx,isK2?isHome?2*tb-tt-(tb-tt-12)/ 2:2*tb-tt-(tb-tt-10)/ 2:isHome?tb-(tb-tt-12)/2:tb-(tb-tt-10)/2, [tipdata.name+':　',"￥",s._formatMoney(tipdata.price)+"　",tipdata.num,"笔"]).attr({
                fill: isHome?"#2484ce":"#fff",
                fontSize: isHome?14:12
            });


            text.select("tspan:nth-child(2)").attr({
                fontSize: isHome?12:10
            });
            text.select("tspan:nth-child(5)").attr({
                fontSize: isHome?12:10
            });
            var textw=text.getBBox().width;
            var rectw=textw+20;
            var rectleft=poiontx-rectw/2;


            if(rectleft<0){
                rectleft=0;
            }else if(rectleft>vw-rectw){
                rectleft=vw-rectw;
            }

            rect.attr({
                width: rectw,
                x: rectleft
            });
            text.attr({
                x:(rectw-textw)/2+rectleft
            });

            var tip=svg.paper.g();
            if(!isK2){
                tip.add(tipLine);
            }
            tip.add(tipcircel,rect,text);
            tip.attr('class',"svglinetip");
        }

        function drawDoubleTip(index){
            if(data.k1[index] !=undefined){
                drawOneTip(index,data.k1[index]);
            }
            if(data.k2[index] !=undefined){
                drawOneTip(index,data.k2[index],true);
            }
        }

        function drawTip(index){
            if(iscompre){
                fun([data.k1[index],data.k2[index]]);
                drawDoubleTip(index);
            }else{
                fun(data[index]);
                drawOneTip(index,data[index]);

            }

        }


        function getCurIndex(x) {
            var cx = (x / $(svg.node).width()) * vw;//对于图表 在viewbox中的x

            if(cx<=cl){
                cx=cl;
            }
            if(cx>cr){
                cx=cr-1;
            }

            var index = Math.floor((cx - cl) / cperx);
            if ((cx - cl) % cperx > cperx / 2 && smpdata.length !=1) {
                index++;
            }
            return index;
        }

        function drawDataLine() {
            var initpath = 'M' + cl + ' ' + cb;
            var init2path='M' + cl + ' ' + cb;     //最初底部一条直线
            var datapath;
            var data2path;

            //起点
            if( ! iscompre){
                var marker = svg.circle(2, 2, 1.2).attr({
                    stroke: isHome?"#ffffff":"#2484ce", //深蓝
                    strokeWidth: 1,
                    fill: isHome?"#2484ce":"#ffffff",
                    class:"svglinemaker"
                });
                var makerend = marker.marker(0, 0, 4, 4, 2, 2);

                datapath= 'M' + cl + ' ' + getDataY(data[0].price);

                //只有一个点的时候
                if(smpdata.length==1){
                    datapath += 'L' + (cperx  + cl) + ' ' + getDataY(data[0].price);
                    initpath += 'L' + (cperx  + cl) + ' ' + cb;
                }

            }else{

                datapath = 'M' + cl + ' ' + getDataY(data.k1[0].price);
                data2path = 'M' + cl + ' ' + getDataY(data.k2[0].price);
            }


            //中间节点
            for (var i = 1; i < smpdata.length; i++) {
                if(iscompre){
                    if(data.k1[i] !=undefined){
                        datapath += 'L' + (cperx * i + cl) + ' ' + getDataY(data.k1[i].price);
                        initpath += 'L' + (cperx * i + cl) + ' ' + cb;
                    }
                    if(data.k2[i] !=undefined){
                        data2path += 'L' + (cperx * i + cl) + ' ' + getDataY(data.k2[i].price);
                        init2path += 'L' + (cperx * i + cl) + ' ' + cb;
                    }

                }else{
                    if(data[i] != undefined ){
                        datapath += 'L' + (cperx * i + cl) + ' ' + getDataY(data[i].price);
                        initpath += 'L' + (cperx * i + cl) + ' ' + cb;
                    }
                }
            }


            //画线
            _drawDataShandow(initpath,datapath);

            var dataLine = svg.path(initpath).attr({
                stroke: isHome?"#fffbcb":"#47a8ef", // 浅黄 浅蓝
                strokeWidth: 2.5,
                fill: 'none',
                strokeLinejoin: 'bevel',
                markerEnd: makerend
            });
            if(iscompre){
                var data2Line = svg.path(init2path).attr({
                    stroke: isHome?"#ffffff":"#f5a25c",   //黄色
                    strokeWidth: 2.5,
                    fill: 'none',
                    strokeLinejoin: 'bevel'
                });
            }


            //动画
            var endText=svg.g().attr({
                class:"svglinemaker"
            });   //在外部声明  可以放在 clear 清除不了
            dataLine.animate({
                path: datapath
            }, 800, mina.easeinout, function () {
                if(!iscompre){
                    _drawDateEndText(endText);
                }
            });
            if(iscompre) {
                data2Line.animate({
                    path: data2path
                }, 800,mina.easeinout);
            }

        }

        function _drawDateEndText(endText){
            //这里 data是 无对比的

            var val=data[data.length - 1].price;
            var endpointY = parseFloat(data[data.length - 1].price);

            var offsetText = endpointY > (cperv * cline) / 1.3?24:-18;


            var rect =svg.rect(vw,getDataY(val) + offsetText - 13 ,0,17,10,10).attr({
                fill:isHome?"#ffffff":"#89c058"
            });
            var text = svg.text(vw, getDataY(val) + offsetText, ["￥",s._formatMoney(val)]).attr({
                fill:isHome?"#2f81d6":"#ffffff",
                fontSize: 12
            });
            text.select('tspan').attr('font-size','11');
            rect.attr({
                x:cr-text.getBBox().width-5,
                width:text.getBBox().width+10
            });
            text.attr({
                x:cr-text.getBBox().width
            });
            endText.add(rect,text);

        }

        function _drawDataShandow(initpath,datapath) {
            var initPath = initpath+ 'V'+ cb + 'H' + cl;
            var shandowPath = datapath + 'V'+ cb + 'H' + cl;
            var path=svg.path(initPath).attr({
                stroke: 'none',
                fill: isHome?svg.paper.gradient("l(0, 0, 0,1 )#ffffff-#2884D3"):'#47a8ef',
                fillOpacity: isHome?'0.3':'0.1',
                strokeLinejoin: 'bevel',
                strokeLinecap: 'round'
            });
            path.animate({
                path: shandowPath
            }, 800, mina.easeinout);
        }

        function _drawBgLeft(){
            var lineh = (cb-ct) / cline;

            var bgLine = svg.line(cl ,cb , cr, cb).attr({
                stroke: isHome?'#519ddb':'#e2e2e2',
                strokeDasharray: "10 2",
                strokeWidth: 0.5
            });
            for (var i = 1; i <= cline; i++) {
                var h = cb - i * lineh;

                bgLine.clone().attr({
                    x1:cl,
                    y1:h,
                    x2:cr,
                    y2:h
                });

                svg.text(cl, h + 13, s._formatMoney(cperv * i)).attr({
                    fill:isHome?'#7abfe9':'#b0b0b0',
                    fontSize: 10
                });
            }
        }

        function _drawBgBottom(){

            var style = svg.paper.g().attr({
                fill: isHome?'#7abfe9':'#b0b0b0',
                fontSize: 10
            });

            //画底部 总是 取 被比较的数据
            var curdata=iscompre?data.k1:data;

            if( ! curdata.length){
                console.log('s:k1无数据,画不出底部刻度');
                return false;
            }

            var long=curdata[0].name.indexOf('~')+1;
            var showarr=_getBgShowTime();
            //todo
            if(long != 0  && showarr.length >4   &&  !isfull){
                var firsttext1=svg.text(0, cb+12, curdata[0].name.substr(0,long)  );
                var firsttext2=svg.text(0, cb+22, curdata[0].name.substr(long)  );
                var lasttext1=svg.text(vw, cb+12, curdata[curdata.length-1].name.substr(0,long));
                var lasttext2=svg.text(vw, cb+22, curdata[curdata.length-1].name.substr(long));
                style.add(firsttext1, lasttext1,firsttext2, lasttext2);

                lasttext1.attr({
                    x:vw-lasttext1.getBBox().width
                });
                lasttext2.attr({
                    x:vw-lasttext1.getBBox().width
                });

                //中间要显示出来日期的点


                for(var i=1;i<showarr.length-1;i++){
                    var midtext1=svg.text(cperx*showarr[i]+cl, cb+12, curdata[showarr[i]].name.substr(0,long));
                    var midtext2=svg.text(cperx*showarr[i]+cl, cb+22, curdata[showarr[i]].name.substr(long));
                    midtext1.attr({
                        x:cperx*showarr[i]+cl-midtext1.getBBox().width/2
                    });
                    midtext2.attr({
                        x:cperx*showarr[i]+cl-midtext1.getBBox().width/2
                    });
                    style.add(midtext1,midtext2);
                }

            }else{
                var firsttext=svg.text(0, cb+12, curdata[0].name);
                var lasttext=svg.text(vw, cb+12, curdata[curdata.length-1].name);
                style.add(firsttext, lasttext);

                lasttext.attr({
                    x:vw-lasttext.getBBox().width
                });

                //中间要显示出来日期的点

                for(var j=1;j<showarr.length-1;j++){
                    var midtext=svg.text(cperx*showarr[j]+cl, cb+12, curdata[showarr[j]].name);
                    midtext.attr({
                        x:cperx*showarr[j]+cl-midtext.getBBox().width/2
                    });
                    style.add(midtext);
                }
            }
        }

        function drawBgLine() {
            _drawBgLeft();
            _drawBgBottom();
        }

        function _getBgShowTime(){
            var show=[];
            var per=smpdata.length-1;
            var offset;   //几个为一段
            var avg;  //分成几段

            if( ! per || !(per-1) ){
                avg=1;
            }else if( !(per%5) ){
                avg=5;
            }else if( !(per%4) ){
                avg=4;
            }else if( !(per%3) ){
                avg=3;
            }else if( !((per-1)%5) ){
                avg=5;
            }else if( !((per-1)%4) ){
                avg=4;
            }else if( !((per-1)%3) ){
                avg=3;
            }else if( !(per%2) ){
                avg=2;
            }else if( !((per-1)%2) ){
                avg=2;
            }else{
                console.log('s:均分日期未成功');
                return s._err(svg,'数据异常');
            }


            offset=Math.floor(per/avg);
            for(var i=0;i<avg;i++){
                show.push( offset*i );
            }
            //如果不能均分  最后一段 多分配一个
            var last=offset*avg;
            if( (per%avg)){
                last++;
            }
            show.push( last);

            return show;
        }

        function getDataY(val) {
            if(val){
                val=parseFloat(val);
                return cb - (val / (cperv * cline)) * (cb-ct);
            }
            return cb;
        }


        function _setPerLineH() {
            var max = 0;
            $.each(data, function (i, v) {
                if(iscompre){
                    $.each(v,function(j,w){
                        max=dealData(w.price,max);
                    })
                }else{
                    max=dealData(v.price,max);
                }
            });
            return s._getPerV(max,cline);
        }

        function dealData(v,max){
            var val = parseFloat(v);
            return val>max?val:max;
        }
    },
    drawBar:function(dom,data,legend,fun,option){

        var svg = Snap(dom);
        var barSvg,bl=0,bn;  //bar 的坐标系  b的数量

        var vw = s._getParam(option,'vw',$(dom).width()), vh = s._getParam(option,'vh',$(dom).height());  //viwebox 宽高
        var tt = s._getParam(option,'tt',0),tb = s._getParam(option,'tb',30);  //提示框离头部距离 提示框底部
        var ct =s._getParam(option,'ct',2*(tb-tt)+tt+10), cb = vh-18,cl = 10, cr = vw-20;   //图表区域  top  bottom  left right
        var cperv, cpery, cline=6;  //图表横向每段值val  图表纵向每段宽度  图表横向分几段
        var iscompre,islayer;   //是否是对比,是否是2级
        var beforey= 0,transy=0,touchy;    //原来的位移   当前的位移   本次触摸时的位移
        var bars;    //svg.g 所有的条
        var isfull=s._getParam(option,'isfull',false);
        var smpdata;   //采样数据
        var touchtime;  //触摸定时器


        beginChart();


        function beginChart() {
            if(! s._init(svg,data)){
                return false;
            }

            if(typeof  fun  != "function"){
                fun=function(){};
            }


            iscompre=legend.length==2?true:false;
            islayer=data[0].item !=undefined?true:false;

            cpery=iscompre?37:26;

            initData();  //取前100

        }

        function initData(){
            //取最大值
            //算左边边距
            //大于100阶段
            //为0 除去

            var n=0;
            var max=0;
            for(var i=0;i<data.length;i++){
                if(n>=100){
                    data.splice(i,data.length-i);
                    break;
                }
                if(islayer){
                    for(var j=0;j<data[i].item.length;j++){
                        var item=data[i].item[j];
                        var temp=dealData(item,max);
                        if(temp){
                            max=temp;

                            if(bl<84){
                                var long=(item.name.toString().length+1)*13+6>84?84:(item.name.toString().length+1)*13+6;
                                bl=bl<long?long:bl;
                            }

                        }else{
                            data[i].item.splice(j,1);
                            j--;
                        }

                        n++;
                    }
                    if(!data[i].item.length){
                        data.splice(i,1);
                        i--;
                    }
                }else{
                    var temp=dealData(data[i],max);
                    if(temp){
                        max=temp;

                        if(bl<84){
                            var long=data[i].name.toString().length*13+6>84?84:data[i].name.toString().length*13+6;
                            bl=bl<long?long:bl;
                        }
                    }else{
                        data.splice(i,1);
                        i--;
                    }
                    n++;
                }
            }
            if(!data.length){
                console.log('s:'+n+'条数据price全是0');
                return s._err(svg,'暂无数据');
            }

            cperv=s._getPerV(max,cline);

            drawBgLine();
            drawDataBar();
            bindEvent();

        }

        function dealData(v,max){
            var newmax;
            if(iscompre){
                if(parseFloat(v.k1.price) == 0  && parseFloat(v.k2.price) == 0){
                    return false;
                }
                newmax=parseFloat(v.k1.price)>max?parseFloat(v.k1.price):max;
                newmax=parseFloat(v.k2.price)>newmax?parseFloat(v.k2.price):newmax;
                return newmax;
            }else{
                if(parseFloat(v.price) == 0 ){
                    return false;
                }
                newmax=parseFloat(v.price)>max?parseFloat(v.price):max;
                return newmax;
            }
        }


        //todo  先计算pointx y 和画一条线
        function drawOneTip(index,tipdata,k2data){
            if(tipdata){
                var poionty = index * cpery +cpery/2+ ct+beforey;
                var poiontx;
                if(!iscompre){
                    poiontx = getDataX(tipdata.price)+bl+8;
                }else {
                    if(parseFloat(tipdata.price)  > parseFloat(k2data.price)){
                        poiontx = getDataX(tipdata.price)+bl+8;
                    }else{
                        poiontx = getDataX(k2data.price)+bl+8;
                    }

                }


                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 4
                });
                var tipcircel = svg.circle(poiontx, poionty, 4).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 4,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb-tt, 4).attr({
                    fill: "#47a8ef"
                });

                var text=svg.paper.text(poiontx,tb-(tb-tt-12)/2,[legend[0]+':　',"￥", s._formatMoney(tipdata.price)+"　",tipdata.num,"笔"]).attr({
                    fill: "#fff",
                    fontSize: 12
                });




                text.select("tspan:nth-child(2)").attr({
                    fontSize: 8
                });
                text.select("tspan:nth-child(5)").attr({
                    fontSize: 8
                });
                var textw=text.getBBox().width;
                var rectw=textw+20;
                var rectleft=poiontx-rectw/2;


                if(rectleft<0){
                    rectleft=0;
                }else if(rectleft>vw-rectw){
                    rectleft=vw-rectw;
                }

                rect.attr({
                    width: rectw,
                    x: rectleft
                });
                text.attr({
                    x:(rectw-textw)/2+rectleft
                });

                var tip=svg.paper.g();
                tip.attr('class',"svgbartip");
                tip.add(rect,text,tipLine,tipcircel);


                if(k2data){
                    var rect2 = svg.paper.rect(poiontx, tb+1, 100, tb-tt, 4).attr({
                        fill: "#f5a25c"
                    });

                    var text2=svg.paper.text(poiontx,2*tb-tt-(tb-tt-12)/2,[legend[1]+':　',"￥",s._formatMoney(k2data.price)+"　",k2data.num,"笔"]).attr({
                        fill: "#fff",
                        fontSize: 12
                    });

                    text2.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text2.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });

                    var textw2=text2.getBBox().width;
                    var rectw2=textw2+20;
                    var rectleft2=poiontx-rectw2/2;


                    if(rectleft2<0){
                        rectleft2=0;
                    }else if(rectleft2>vw-rectw2){
                        rectleft2=vw-rectw2;
                    }

                    rect2.attr({
                        width: rectw2,
                        x: rectleft2
                    });
                    text2.attr({
                        x:(rectw2-textw2)/2+rectleft2
                    });

                    tip.add(rect2,text2);

                }


            }else{
                console.log('s:点击到了bar之外的区域');
            }

        }


        function drawTip(index){
            if(islayer){
                var layer= s._getLayer(index,data);

                if(iscompre){

                    drawOneTip(index,data[layer.parent].item[layer.child].k1,data[layer.parent].item[layer.child].k2);

                }else{
                    drawOneTip(index,data[layer.parent].item[layer.child]);
                }
                fun(data[layer.parent].item[layer.child]);
                if(isfull){
                    drawTitle(data[layer.parent].item[layer.child].name);
                }



            }else{
                if(iscompre){
                    drawOneTip(index,data[index].k1,data[index].k2);
                }else{
                    drawOneTip(index,data[index]);
                }
                fun(data[index]);
                if(isfull){
                    drawTitle(data[index].name);
                }
            }

        }

        function drawTitle(name){
            var text=svg.text(0,tt-8,name).attr({
                class:"svgbartip",
                fontSize:18
            });
            text.attr('x',vw/2-text.getBBox().width/2);
        }

        function fideTip(){
            $('.svgbartip').remove();
            fun();
        }

        function moveBars(cury,e){
            transy=beforey+cury-touchy;
            if(transy>0) {
                transy=0;
            }else if(transy <-cpery*(bn+1)+(cb-ct)){
                transy=cb-ct<cpery*(bn+1)?-cpery*(bn+1)+(cb-ct):0;
            }else{
                e.preventDefault();
            }

            bars.transform("translate(0,"+transy+")");
        }

        function bindEvent(){

            if(s.isPc){
                svg.mousedown(function (e) {
                    touchy = e.clientY+$(document).scrollTop()-$(svg.node).offset().top;
                    if(touchy>ct  &&  touchy<cb){
                        touchtime=setTimeout(function (){
                            //svg.unmousemove(); // ↑
                            var cury=touchy-ct-beforey;   //  点击的元素的高度
                            var index=Math.floor(cury/cpery);
                            if(index>=0 && index<bn){
                                drawTip(index);
                            }

                        },100);

                        svg.mousemove(function (e) {
                            fideTip(); //  ↓
                            clearTimeout(touchtime);
                            var y = e.clientY+$(document).scrollTop()-$(svg.node).offset().top;
                            moveBars(y,e);

                        });

                    }

                });

                svg.mouseup(function (e) {
                    svg.unmousemove();
                    setTimeout(function (){
                        fideTip();
                    },100);

                    beforey=transy;
                });

                svg.mouseout(function (e) {
                    svg.unmousemove();
                    setTimeout(function (){
                        fideTip();
                    },100);

                    beforey=transy;
                });

            }else{
                svg.touchstart(function (e) {
                    touchy = e.touches[0].clientY;
                    var svgy= touchy+$(document).scrollTop()-svg.node.offsetTop;  //点在svg 上的y
                    if(svgy>ct  &&  svgy<cb){

                        touchtime=setTimeout(function (){
                            svg.untouchmove(); // ↑
                            var cury=svgy-ct-beforey;   //  点击的元素的高度
                            var index=Math.floor(cury/cpery);
                            if(index>=0 && index<bn){
                                drawTip(index);
                            }

                        },100);

                        svg.touchmove(function (e) {
                            //fideTip(); //  ↓
                            clearTimeout(touchtime);
                            var y = e.touches[0].clientY;
                            moveBars(y,e);

                        });

                    }

                });



                svg.touchend(function (e) {
                    svg.untouchmove();
                    setTimeout(function (){
                        fideTip();
                    },100);

                    beforey=transy;
                });
            }


        }

        function drawBgLine(){

            var lineh = (cr-bl) / cline;

            for (var i = 0; i <= cline; i++) {
                var x = bl + i * lineh;

                svg.line(x ,cb ,x ,ct).attr({
                    stroke: "#e2e2e2",
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });

                var text=svg.text(x, vh-4, s._formatMoney(cperv * i)).attr({
                    fill: '#b0b0b0',
                    fontSize: 10
                });
                text.attr('x',x-text.getBBox().width/2);
            }

        }

        function drawOneBar(v,name,parent){
            //没有name  就是 k2
            //有层级  才会有parent
            if(name){
                var text=barSvg.text(bl,iscompre?bn*cpery+24:bn*cpery+16, islayer?s._formatName(name,5):s._formatName(name,6)).attr({
                    fill: '#b0b0b0',
                    fontSize: 12
                });
                text.attr('x',bl-text.getBBox().width-4);
                bars.add(text);
            }

            var color;
            if(parent%2  && !islayer){
                color="#88bf57"; //绿色
            }else{
                color="#7cb7ef"; //蓝色
            }


            var rect=barSvg.rect(bl,name?bn*cpery+8:bn*cpery+cpery/2+1,getDataX(v),10).attr({
                fill:name?color:'#f5a25c'
            });
            bars.add(rect);




        }

        function drawDoubleBar(v,parent){
            drawOneBar(v.k1.price,v.name,parent);
            drawOneBar(v.k2.price,false,parent);
        }

        function drawDataBar(){
            barSvg = svg.svg(0, ct, vw, cb-ct );

            bars=barSvg.g();

            bn=0;
            for(var i=0;i<data.length;i++){
                var item=data[i];

                if(islayer){
                    var childn=0;
                    $.each(item.item,function (j,v){

                        if(iscompre){
                            drawDoubleBar(v,i);
                        }else{
                            drawOneBar(v.price,v.name,i);
                        }

                        childn++;
                        bn++;
                    });

                    if(childn >1){
                        var lefttext=barSvg.text(cl,(bn-childn)*cpery+childn*cpery/2+6,childn>2? s._formatName(item.name,5): s._formatName(item.name,4)).attr({
                            fill: '#b0b0b0',
                            fontSize: 10
                        });
                        lefttext.attr({
                            x:cl-lefttext.getBBox().width/2
                        });
                        lefttext.transform('roate(-90)');
                        bars.add(lefttext);
                    }
                    var line=barSvg.line(cl,bn*cpery,bl-4,bn*cpery).attr({
                        stroke: '#b0b0b0',
                        strokeDasharray: "5 2",
                        strokeWidth: 1
                    });
                    bars.add(line);


                }else{
                    if(iscompre){
                        drawDoubleBar(item);
                    }else{
                        drawOneBar(item.price,item.name);
                    }
                    bn++;
                }
            }
        }

        function getDataX(v){
            if(!v){
                return 0;
            }
            return (parseFloat(v)/(cline*cperv))*(cr-bl);
        }

    },
    drawColumn:function(dom,data,legend,fun,option){
        var svg = Snap(dom);
        var columnSvg,columnl,cn;  //column 的坐标系 column 左边距离 column的数量

        var vw = s._getParam(option,'vw',$(dom).width()), vh = s._getParam(option,'vh',$(dom).height());  //viwebox 宽高
        var tt = s._getParam(option,'tt',0),tb = s._getParam(option,'tb',30);  //提示框离头部距离 提示框底部
        var ct =s._getParam(option,'ct',2*(tb-tt)+tt+10), cb,cl = 10, cr = vw;   //图表区域  top  bottom  left right
        var cperv, cperx,cline=5;   //图表纵向每段值val  图表横向每段宽度  图表纵向分几段
        var beforex= 0,transx=0,touchx;    //柱形图原来的位移   当前的位移   本次触摸时的位移(相对于svg 不是屏幕宽度)
        var columns;   //svg.g 所有的条
        var isfull=s._getParam(option,'isfull',false);

        var iscompre,islayer;
        var touchtime;  //触摸定时器


        beginChart();


        function beginChart() {
            if(! s._init(svg,data)){
                return false;
            }

            if(typeof  fun  != "function"){
                fun=function(){};
            }


            iscompre=legend.length==2?true:false;
            islayer=data[0].item !=undefined?true:false;

            cperx=iscompre?53:42;
//            cb=islayer?vh-40:vh-25;
            cb=islayer?vh-37:vh-25;

            initData();  //取前100


        }




        function initData() {
            //取最大值
            //算左边边距
            //大于100阶段
            //为0 除去

            var n=0;
            var max=0;
            for(var i=0;i<data.length;i++){
                if(n>=100){
                    data.splice(i,data.length-i);
                    break;
                }
                if(islayer){
                    for(var j=0;j<data[i].item.length;j++){
                        var item=data[i].item[j];
                        var temp=dealData(item,max);
                        if(temp){
                            max=temp;
                        }else{
                            data[i].item.splice(j,1);
                            j--;
                        }

                        n++;
                    }
                    if(!data[i].item.length){
                        data.splice(i,1);
                        i--;
                    }
                }else{
                    var temp=dealData(data[i],max);
                    if(temp){
                        max=temp;
                    }else{
                        data.splice(i,1);
                        i--;
                    }
                    n++;
                }
            }
            if(!data.length){
                console.log('s:'+n+'条数据price全是0');
                return s._err(svg,'暂无数据');
            }

            if(s.isPc){
                $(dom).width($(dom).width()>cperx*n?$(dom).width():cperx*n);
            }

            cperv=s._getPerV(max,cline);



            drawBgLine();
            drawDataColumn();
            bindEvent();

        }
        //todo  可以 放到 s._dealData
        function dealData(v,max){
            var newmax;
            if(iscompre){
                if(parseFloat(v.k1.price) == 0  && parseFloat(v.k2.price) == 0){
                    return false;
                }
                newmax=parseFloat(v.k1.price)>max?parseFloat(v.k1.price):max;
                newmax=parseFloat(v.k2.price)>newmax?parseFloat(v.k2.price):newmax;
                return newmax;
            }else{
                if(parseFloat(v.price) == 0 ){
                    return false;
                }
                newmax=parseFloat(v.price)>max?parseFloat(v.price):max;
                return newmax;
            }
        }


        //todo  //todo  先计算pointx y 和花一条线
        function drawOneTip(index,tipdata,k2data){
            if(tipdata){
                var poiontx = index * cperx +cperx/2+columnl+beforex;
                var poionty;
                if(!iscompre){
                    poionty = getDataY(tipdata.price)+ct-8;
                }else {
                    if(parseFloat(tipdata.price)  > parseFloat(k2data.price)){
                        poionty = getDataY(tipdata.price)+ct-8;
                    }else{
                        poionty = getDataY(k2data.price)+ct-8;
                    }

                }

                var tipLine = svg.line(poiontx, poionty, poiontx, tb).attr({
                    stroke: "#d2d2d2",
                    strokeWidth: 4
                });
                var tipcircel = svg.circle(poiontx, poionty, 4).attr({
                    stroke: "#47a8ef",
                    strokeWidth: 4,
                    fill: "#fff"
                });


                var rect = svg.paper.rect(poiontx, tt, 100, tb-tt, 4).attr({
                    fill: "#47a8ef"
                });

                var text=svg.paper.text(poiontx,tb-(tb-tt-12)/2,[legend[0]+':　',"￥", s._formatMoney(tipdata.price)+"　",tipdata.num,"笔"]).attr({
                    fill: "#fff",
                    fontSize: 12
                });


                text.select("tspan:nth-child(2)").attr({
                    fontSize: 8
                });
                text.select("tspan:nth-child(5)").attr({
                    fontSize: 8
                });
                var textw=text.getBBox().width;
                var rectw=textw+20;
                var rectleft=poiontx-rectw/2;


                if(rectleft<0){
                    rectleft=0;
                }else if(rectleft>vw-rectw){
                    rectleft=vw-rectw;
                }

                rect.attr({
                    width: rectw,
                    x: rectleft
                });
                text.attr({
                    x:(rectw-textw)/2+rectleft
                });

                var tip=svg.paper.g();
                tip.attr('class',"svgcolumntip");
                tip.add(rect,text,tipLine,tipcircel);


                if(k2data){
                    var rect2 = svg.paper.rect(poiontx, tb+1, 100, tb-tt, 4).attr({
                        fill: "#f5a25c"
                    });

                    var text2=svg.paper.text(poiontx,2*tb-tt-(tb-tt-12)/2,[legend[1]+':　',"￥",s._formatMoney(k2data.price)+"　",k2data.num,"笔"]).attr({
                        fill: "#fff",
                        fontSize: 12
                    });

                    text2.select("tspan:nth-child(2)").attr({
                        fontSize: 8
                    });
                    text2.select("tspan:nth-child(5)").attr({
                        fontSize: 8
                    });

                    var textw2=text2.getBBox().width;
                    var rectw2=textw2+20;
                    var rectleft2=poiontx-rectw2/2;


                    if(rectleft2<0){
                        rectleft2=0;
                    }else if(rectleft2>vw-rectw2){
                        rectleft2=vw-rectw2;
                    }

                    rect2.attr({
                        width: rectw2,
                        x: rectleft2
                    });
                    text2.attr({
                        x:(rectw2-textw2)/2+rectleft2
                    });

                    tip.add(rect2,text2);
                }


            }else{
                console.log('点击到了bar之外的区域');
            }

        }

        //todo  考虑放到 s._touchData
        function drawTip(index){
            if(islayer){
                var layer= s._getLayer(index,data);
                if(layer) {
                    if (iscompre) {
                        drawOneTip(index, data[layer.parent].item[layer.child].k1, data[layer.parent].item[layer.child].k2);
                    } else {
                        drawOneTip(index, data[layer.parent].item[layer.child]);
                    }
                    fun(data[layer.parent].item[layer.child]);
                    if(isfull){
                        drawTitle(data[layer.parent].item[layer.child].name);
                    }
                }
            }else{
                if(iscompre){
                    drawOneTip(index,data[index].k1,data[index].k2);
                }else{
                    drawOneTip(index,data[index]);


                }
                fun(data[index]);
                if(isfull){
                    drawTitle(data[index].name);
                }
            }

        }



        function fideTip(){
            $('.svgcolumntip').remove();
            fun();
        }

        function drawTitle(name){
            var text=svg.text(0,tt-8,name).attr({
                class:"svgcolumntip",
                fontSize:18
            });
            text.attr('x',vw/2-text.getBBox().width/2);
        }

        function moveColumn(curx,e){
            transx=beforex+curx-touchx;
            if(transx>0) {
                transx=0;
            }else if(transx <-cperx*(cn+1)+vw-columnl ){
                transx=vw-columnl<cperx*(cn+1)?-cperx*(cn+1)+vw-columnl:0;
            }else{
                e.preventDefault();
            }
            columns.transform("translate("+transx+",0)");


        }

        function bindEvent(){

            if(s.isPc){

                svg.mousedown(function (e) {
                    touchx= e.clientX+$(document).scrollLeft()-$(svg.node).offset().left;

                    touchtime=setTimeout(function (){
                        //svg.unmousemove();
                        var curx=touchx-columnl-beforex;
                        var index=Math.floor(curx/cperx);
                        if(index>=0 && index<cn){
                            drawTip(index);
                        }


                    },100);


                    svg.mousemove(function (e) {
                        fideTip();
                        clearTimeout(touchtime);
                        var curx = e.clientX+$(document).scrollLeft()-$(svg.node).offset().left;
                        moveColumn(curx,e);

                    });



                });

                svg.mouseup(function (e) {
                    svg.unmousemove();
                    setTimeout(function (){
                        fideTip();
                    },100);
                    beforex=transx;
                });

                svg.mouseout(function (e) {
                    svg.unmousemove();
                    setTimeout(function (){
                        fideTip();
                    },100);
                    beforex=transx;
                });

            }else{

                svg.touchstart(function (e) {
                    touchx= e.touches[0].clientX;
                    if(isfull){
                        touchx = ( touchx/ $(svg.node).width()) * vw;

                    }


                    touchtime=setTimeout(function (){
                        svg.untouchmove();
                        var curx=touchx-columnl-beforex;
                        var index=Math.floor(curx/cperx);
                        if(index>=0 && index<cn){
                            drawTip(index);
                        }
                    },100);

                    svg.touchmove(function (e) {

                        //fideTip();
                        clearTimeout(touchtime);
                        var curx = e.touches[0].clientX;
                        if(isfull){
                            curx = ( curx/ $(svg.node).width()) * vw;

                        }
                        moveColumn(curx,e);

                    });



                });



                svg.touchend(function (e) {
                    svg.untouchmove();
                    setTimeout(function (){
                        fideTip();
                    },100);
                    beforex=transx;
                });

            }
        }



        function drawBgLine(){
            columnl=0;
            var lineh = (cb-ct) / cline;

            var bgLine = svg.line(cl ,cb , cr, cb).attr({
                stroke: "#e2e2e2",
                strokeDasharray: "10 2",
                strokeWidth: 0.5
            });

            for (var i = 1; i <= cline; i++) {
                var h = cb - i * lineh;

                bgLine.clone().attr({
                    x1:cl,
                    y1:h,
                    x2:cr,
                    y2:h
                });

                var text=svg.text(cl, h + 15, s._formatMoney(cperv *  i)).attr({
                    fill: '#b0b0b0',
                    fontSize: 12
                });

                columnl=text.getBBox().width+cl+10>columnl?text.getBBox().width+cl+10:columnl;

            }



        }

        function getDataY(val){
            if(!val){
                val=0;
            }

            val=parseFloat(val);
            return cb-ct-(val/(cperv*cline))*(cb-ct);

        }

        function drawOneColumn(v,name){

            var x=cperx*cn;
            var y=getDataY(v);

            var rect=columnSvg.rect(name?x+16:x+28,y,10,cb-ct-y).attr({
                fill:name?'#7cb7ef':'#f5a25c'
            });


            columns.add(rect);

            if(name){
                //todo
                name=name.toString();
                var long=iscompre?8:6;
                if(name.length>long){
                    name= s._formatName(name,long);

                }
                if(name.length>long/2){
                    var name1=name.substr(0,long/2);
                    var name2=name.substr(long/2);
                    var text1=columnSvg.text(x,cb-ct+11,name1).attr({
                        fill: '#b0b0b0',
                        fontSize: 10
                    });
                    var text2=columnSvg.text(x,cb-ct+22,name2).attr({
                        fill: '#b0b0b0',
                        fontSize: 10
                    });
                    text1.attr("x",x+(cperx-text1.getBBox().width)/2);
                    text2.attr("x",x+(cperx-text1.getBBox().width)/2);
                    columns.add(text1,text2);

                }else{
                    var text=columnSvg.text(x,cb-ct+11,name).attr({
                        fill: '#b0b0b0',
                        fontSize: 10
                    });
                    text.attr("x",x+(cperx-text.getBBox().width)/2);
                    columns.add(text);
                }


            }

        }

        function drawDoubleColumn(v,parent){
            drawOneColumn(v.k1.price,v.name,parent);
            drawOneColumn(v.k2.price,false,parent);
        }

        function drawDataColumn(){
            columnSvg = svg.svg(columnl, ct, vw-columnl, vh-ct );
            columns=columnSvg.g();
            cn=0;


            for(var i=0;i<data.length;i++){
                if(islayer){
                    var childn=0;
                    $.each(data[i].item,function(j,item){
                        if(iscompre){
                            drawDoubleColumn(item,i);
                        }else{
                            drawOneColumn( item.price, item.name ,i);
                        }
                        cn++;
                        childn++;
                    });

                    if(childn >1){
                        var parenttext=columnSvg.text(cn*cperx,vh-ct-2, s._formatName(data[i].name,6)).attr({
                            fill: '#b0b0b0',
                            fontSize: 10
                        });
//                        console.log(parenttext.node.getComputedTextLength());
                        parenttext.attr({
                            x:(cn-childn)*cperx+(childn*cperx-parenttext.getBBox().width)/2
                        });
                        columns.add(parenttext);
                    }
                    var line=columnSvg.line(cn*cperx,cb-ct+2,cn*cperx,vh-ct-1).attr({
                        stroke: '#b0b0b0',
                        strokeDasharray: "5 2",
                        strokeWidth: 1
                    });
                    columns.add(line);

                }else{
                    if(iscompre){
                        drawDoubleColumn(data[i]);
                    }else{
                        drawOneColumn(data[i].price,data[i].name);

                    }
                    cn++;
                }

            }
        }

    },
    drawPie:function(dom,data,legend,fun,option){
        var svg = Snap(dom);

        var vw = s._getParam(option,'vw',$(dom).width()), vh = s._getParam(option,'vh',$(dom).height());  //viwebox 宽高
        var tt = s._getParam(option,'tt',0),tb = s._getParam(option,'tb',35);  //提示框离头部距离 提示框底部
        var ct =s._getParam(option,'ct',tb+30), cb =s._getParam(option,'cb',vh-10);  //图表区域  top  bottom
        var px=s._getParam(option,'px',vw/3),pr=(cb-ct)/2<px*0.8?(cb-ct)/2:px*0.8,py=ct+pr;   //圆心x y 半径

        var color=['#F27254','#FFBE32','#A1BB38','#5BC45E','#51B4D4','#576ACD','#A66CE2','#FF74E0'];
        var sum= 0; //总值
        var isfull=s._getParam(option,'isfull',false);
        var fullColumn=3;

        beginChart();  //清空svg   再次之前对于svg 的操作都无效


        function beginChart() {
            if(! s._init(svg,data)){
                return false;
            }

            if(typeof  fun  != "function"){
                fun=function(){};
            }

            initData();  //只取 前7  其他只计数
            bindEvent();

        }

        function bindEvent(){

            if(s.isPc){
                svg.mousedown(function (){
                    $('.svgpiepie').attr('transform','');
                    removeTip();
                    fun();
                })
            }else{
                svg.touchstart(function (){
                    $('.svgpiepie').attr('transform','');
                    removeTip();
                    fun();
                })
            }

        }
        function initData(){
            var other={};
            other.price=0;
            other.num=0;

            for(var i=0;i<data.length;i++ ){
                var val=parseFloat(data[i].price);

                if(isfull){
                    var text=data[i].name.toString();
                    if(text.length >5){
                        fullColumn=2;
                    }
                }


                if( ! val ){
                    if(i==0){
                        console.log('s:第一个数据price为0');
                        return s._err(svg,'暂无数据');
                    }
                    data.splice(i,data.length-i);
                    break;
                }

                sum+= val;

                if(i+1>8){   //第九个元素
                    other.price+=val;
                    other.name='其他';
                    other.num+=parseFloat(data[i].num);
                }

            }
            //如果大于8个
            if(other.name){
                other.price+=parseFloat(data[7].price);
                other.num+=parseFloat(data[7].num);
                data.splice(7,data.length-7,other);
            }

            if( data[0].price == sum){
                drawDataCircle();
            }else{
                drawDataPie();
            }


        }

        function drawDataPie(){
            var cpltpercent=0;   //完成的圆的角度
            var aimx=[],aimy=[];
            aimx[0]= px-pr;
            aimy[0]= py;

            $.each(data,function(i,v){
                var percent= v.price/sum;

                var flag=percent>0.5?1:0;
                cpltpercent+=percent;

                aimx[i+1] = px - pr * Math.cos(2 * Math.PI * cpltpercent);
                aimy[i+1] = py - pr * Math.sin(2 * Math.PI * cpltpercent);

                var midpercent = cpltpercent - percent/2;  //中间角度
                var movex = px - 10 * Math.cos(2 * Math.PI * midpercent)-px;
                var movey = py - 10 * Math.sin(2 * Math.PI * midpercent)-py;

                var pathString = "M " + px + " " + py+ "L " + aimx[i] + " " + aimy[i] + " "+ "A " + pr + " " + pr + " " + 0 + " " + flag + " "+ 1 + " " + aimx[i+1] + " " + aimy[i+1] + " "+ " Z";

                var pie=svg.g().attr({
                    class:"svgpiepie"
                });

                var random=Math.floor(Math.random()*color.length);
                var path=svg.path(pathString).attr({
                    fill:color[random],
                    stroke:"#fff",
                    strokeWidth:"1"
                });

                pie.add(path);

                if(percent> 1/14){  //画文字
                    var textx=px -  pr* Math.cos(2 * Math.PI * midpercent)/1.4-14;
                    var texty=py - pr* Math.sin(2 * Math.PI * midpercent)/1.4;
                    var text=svg.text( textx,texty, Math.round(v.price*1000/sum)/10+'%').attr({
                        fill:"#fff",
                        fontSize:12
                    });
                    pie.add(text);
                }


                if(s.isPc){
                    pie.mousedown(function(e){
                        movePie(this,movex,movey,v,e);
                    });
                }else{
                    pie.touchstart(function(e){
                        movePie(this,movex,movey,v,e);
                    });
                }



                drawOneLegend(color[random],i,v,pie,movex,movey);
                color.splice(random,1);

            })
        }


        function drawOneLegend(color,i,v,pie,movex,movey){
            if( isfull){
                var row= Math.floor(i/fullColumn);
                var cloumn=i%fullColumn;
                var rect=svg.rect(px-pr+cloumn*(2*pr)/fullColumn,cb+30+row*30,5,5).attr({fill:color});
                var text=svg.text(px-pr+cloumn*(2*pr)/fullColumn+10,cb+38+row*30, s._formatName(v.name,fullColumn==3?5:8)).attr({fontSize:14});
            }else{
                var h=ct+i*(cb-ct)/8 +9;
                var rect=svg.rect(vw*2/3,h,5,5).attr({fill:color});
                var text=svg.text(vw*2/3+10,h+7, s.isPc?v.name:s._formatName(v.name,6)).attr({fontSize:14});
            }

            var legend=svg.g();
            legend.add(rect,text);

            if(s.isPc){
                legend.mousedown(function(e){
                    movePie(pie,movex,movey,v,e);
                });
            }else{
                legend.touchstart(function (e){
                    movePie(pie,movex,movey,v,e);
                });
            }


        }

        function drawDataCircle(){
            var r=Math.floor(Math.random()*8);

            var circle=svg.circle(px,py,pr).attr({
                fill:color[r]
            });

            if(s.isPc){
                circle.mousedown(function(e){
                    e.stopPropagation();
                    circle.attr('hasTip','1');
                    drawTip(color[r],data[0]);
                    fun(data[0]);

                }).mouseup(function(){
                    circle.attr('hasTip','0');
                    removeTip();
                    fun();
                });
            }else{
                circle.touchstart(function(e){
                    e.stopPropagation();
                    circle.attr('hasTip','1');
                    drawTip(color[r],data[0]);
                    if(isfull){
                        drawTitle(data[0].name);
                    }
                    fun(data[0]);

                }).touchend(function(){
                    circle.attr('hasTip','0');
                    removeTip();
                    fun();
                });

            }

            svg.text(px-12,py,'100%').attr({
                fill:"#fff",
                fontSize:12
            });

            drawOneLegend(color[r],0,data[0],circle);

        }

        //todo
        function movePie(pie,movex,movey,v,e){
            if(movex){   //饼图
                if( !pie.transform().string){   //挪动回去
                    var color=pie.select('path').attr('fill');
                    e.stopPropagation();

                    if(s.isPc){
                        $('.svgpiepie').removeAttr('transform');
                        $(pie.node).attr({
                            'transform':'translate('+movex+','+movey+')'
                        });
                    }else{
                        $('.svgpiepie').attr('transform','');
                        pie.animate({
                            transform:'translate('+movex+','+movey+')'
                        },300,mina.easein);
                    }


                    drawTip(color,v);
                    if(isfull){
                        drawTitle(v.name);
                    }
                    fun(v);
                }
            }else{    //圆
                var color=pie.attr('fill');
                if(pie.attr('hasTip') ==1){
                    pie.attr({hasTip:"0"});

                }else{
                    e.stopPropagation();
                    pie.attr({hasTip:"1"});
                    drawTip(color,v);
                    if(isfull){
                        drawTitle(v.name);
                    }
                    fun(v);
                }
            }

        }

        function drawTitle(v){
            var text=svg.text(0,tt-17,v).attr({
                class:"svgpietip",
                fontSize:18
            });
            text.attr('x',vw/2-text.getBBox().width/2);

        }


        function drawTip(color,v){
            $('.svgpietip').remove();
            var rect=svg.rect(vw/2,tt,0,tb-tt,3).attr({fill:color,class:"svgpietip"});
            var text=svg.text(vw/2,tb-((tb-tt)-10)/2, [legend[0]+':　','￥',s._formatMoney(v.price)+'　', v.num,'笔']).attr({fill:'#fff',class:"svgpietip",fontSize:14});


            rect.attr({
                width:text.getBBox().width+20,
                x:vw/2-(text.getBBox().width+20)/2
            });
            text.attr({
                x:vw/2-text.getBBox().width/2
            });
        }

        function removeTip(){
            $('.svgpietip').remove();
        }

    },


    drawPcColumn:function(dom,data,legend,fun){

        var svg = Snap(dom);

        var v={ };

        v.height=$(dom).height()/1.4;
        v.width= $(dom).width()/1.4;

        svg.attr("viewBox",'0 0 '+v.width+' '+v.height);


        var vw= v.width;
        var vh= v.height;

        var option={
            vw:vw,
            vh:vh
        };

        s.drawColumn(dom,data,legend,fun,option);
    },


    drawFullColumn:function(dom,data,legend,fun){
        var v=s._fullScreen(dom,340);
        var vw= v.width;
        var vh= v.height;

        var tb=55;
        var tt=30;
        var option={
            tb:tb,
            tt:tt,
            ct:2*(tb-tt)+tt+3,
            vw:vw,
            vh:vh,
            isfull:true

        };

        s.drawColumn(dom,data,legend,fun,option);
    },
    drawFullLine:function(dom,data,legend,fun){
        var v=s._fullScreen(dom,300);
        var vw= v.width;
        var vh= v.height;

        var tb=40;
        var tt=10;
        var option={
            tb:tb,
            tt:tt,
            ct:2*(tb-tt)+tt+3,
            vw:vw,
            vh:vh,
            isfull:true
        };

        s.drawLine(dom,data,legend,fun,option);
    },
    drawFullBar:function(dom,data,legend,fun){
        var v=s._fullScreen(dom);
        var vw= v.width;
        var vh= v.height;


        var option={
            vw:vw,
            vh:vh-80,
            tt:30,
            tb:60,
            isfull:true

        };

        s.drawBar(dom,data,legend,fun,option);
    },
    drawFullPie:function(dom,data,legend,fun){
        var v=s._fullScreen(dom);
        var vw= v.width;
        var vh= v.height;

        var cb=vh-220;



        var option={
            cb:cb,
            tb:85,
            tt:50,

            px:vw/2,
            vw:vw,
            vh:vh,
            isfull:true
        };

        s.drawPie(dom,data,legend,fun,option);
    },
    drawHomeLine:function(dom,data,legend,fun){
        var option={
            isHome:true,
            tt:20,
            tb:55,
            ct:70
        };
        s.drawLine(dom,data,legend,fun,option);
    },

    _err:function(svg,str){
        //todo 全屏画不出来  vw   vh
        var text=svg.text($(svg.node).width()/2,$(svg.node).height()/2,str).attr({
            fontSize:24
        });
        text.attr({
            x:$(svg.node).width()/2-text.getBBox().width/2
        });
        return false;
    },
    _formatName:function (str,i){
        return str.substr(0,i);
    },

    _getParam:function(option,name,def){
        if(option){
            return option[name]!=undefined?option[name]:def;
        }else{
            return def;
        }

    },
    _fullScreen:function(dom,height){
        var svg = Snap(dom);
        svg.attr('height','100%');

        var v={ };

        if( !height){
            v.width=$(window).width();
            v.height=$(window).height();
        }else{
            v.height=height;
            v.width= v.height *  $(window).width()/$(window).height();

        }

        svg.attr("viewBox",'0 0 '+v.width+' '+v.height);
        return v;
    },
    _getPerV:function(max,cline){
        if( max ==0){
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
        } else{
            mod = 1;
        }
        return Math.ceil(per / mod) * mod;
    },
    _getLayer:function(index,data){
        var parent=0;
        var child=0;
        var curn=0;

        for(var i=0;i<data.length;i++){
            if(index<data[i].item.length+curn ){
                parent=i;
                child=index-curn;
                return {parent:parent,child:child};
            }else{
                curn=data[i].item.length+curn;
            }

        }
        return false;

    },
    _formatNumber:function (v){
        var fmtv;
        if(v>=100000){ //10w
            if(v>=100000000){  //亿
                if(v>=10000000000){  //百亿
                    fmtv=Math.round(v/100000000);
                    return [fmtv.toString(),'亿'];
                }
                fmtv=Math.round(v/10000000);
                return [fmtv.slice(0,-1).toString(),'亿',fmtv.slice(-1).toString()];
            }
            if(v>=1000000){  //百万
                fmtv=Math.round(v/10000);
                return [fmtv.toString(),'万'];
            }
            fmtv=Math.round(v/1000);
            return [fmtv.slice(0,-1).toString(),'万',fmtv.slice(-1).toString()];
        }
        return [v.toString()];
    },
    _formatMoney:function(num){
        var numArr= s._formatNumber(parseInt(num));
        var money;

        if(numArr[0].length>3){
            for(var i=3;i<numArr[0].length;i+=4){
                money=numArr[0].slice(0,-i)+','+numArr[0].slice(-i);
            }
        }else{
            money=numArr[0];
        }
        if(numArr[1]){
            money+=numArr[1];
        }
        if(numArr[2]){
            money+='.'+numArr[2];
        }

        return money;
    }
};