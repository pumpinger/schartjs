;(function(){

    //名字  背景  和 初始化属性 应该 区分    纵横 现在判断 纵横判断的太多
    //字体应该是 一个对象   传参数 直接传字体对象


    window.sChartDraw = function (option) {


        var svg = Snap(option.el);//snap对象


        // svg.attr({
        //     style:'background:#eee'
        // });


        var svgDom = $(option.el);//jQuery对象


        if(  !  svg ||  ! svgDom ){
            console.log('无svg元素');
            return false;

        }


        svgClear();



        var chartSvg;


        var svgOption =initSvgOption();//svg画图选项


        var svgProperty =initSvgProperty();//svg画图参数

        if( ! svgProperty.number){
            console.log('无数据');
            return false;
        }

        svgOption.onBegin();
        //drawLoading();

        drawBg();
        drawData();
        drawAvg();

        //drawTip
        //moveData
        //drawText

        bindEvent();
        return true;
//bindEvent();



//------------------ Functions ---------------------//

        function drawAvg(){
            if(svgOption.avg){


                $.each(svgOption.avg,function(i,n){

                    var  y=  getValueY(n.num);


                    svg.line(svgProperty.viewBox.left + svgProperty.chart.marginLeft, y, svgProperty.viewBox.right-10, y).attr({
                        stroke: n.bg,
                        strokeWidth: 2
                    });
                    drawLineEnd(svgProperty.viewBox.right-13,y, n.format(n),n.bg, n.color);




                })
            }
        }


        function drawLineEnd(startX,y,textStr,bg,color){

            //todo  这里 初始化的时候 就给默认值

            if(!bg){
                bg=svgProperty.color.blue;

            }

            if(!color){
                color='#fff';
            }

            var circle=svg.circle(startX, y, 3).attr({
                stroke: bg,
                strokeWidth: 3,
                fill:"#fff"
            });



            if(textStr){

                var rect = svg.rect(0, y - 20 - 13, 0, 17, 10, 10).attr({
                    fill: bg
                });

                var text = svg.text(0, y - 20, textStr).attr({
                    fill: '#ffffff',
                    fontSize: 12
                });

                rect.attr({
                    x:  startX- $(text.node).width() - 15,
                    width: $(text.node).width() + 10
                });

                text.attr({
                    x: startX - $(text.node).width() - 10
                });


                return [circle,rect,text];

            }else{
                return [circle];

            }







            //svgProperty.chartEl.add([circle,rect]);
            //svgProperty.chartEl.add(rect);
            //svgProperty.chartEl.add(text);

        }

        //绑定事件
        function bindEvent(){
            //pie 是在 画数据的时候 直接绑好
            var touchx;
            var touchy;

            svg.touchstart(function (e) {


                if(svgProperty.toward == 'vertical'){
                    touchy = e.touches[0].clientY;
                    var offset = touchy+$(document).scrollTop() - $(svg.node).offset().top - svgProperty.chart.marginTop- svgProperty.chart.beforeOffset;   //  点击的元素的高度
                    var index = Math.floor(offset / svgOption.style.categoryWidth);
                }else if(svgProperty.toward == 'horizontal'){

                    touchx = e.touches[0].clientX;
                    var offset = touchx -svgProperty.chart.marginLeft-svgProperty.chart.beforeOffset;
                    var index = Math.floor(offset / svgOption.style.categoryWidth);

                }




                svg.touchend(function (e) {
                    var data=getData(index);
                    svgOption.onTouch(data);
                    svg.untouchend();
                    cancelpressData();
                    clearTimeout(svgProperty.touchTimer);

                });

                //touchx  摸上去的时候的 绝对位置
                //curx  当前的相对位置


                svgProperty.touchTimer = setTimeout(function () {
                    svg.untouchmove();
                    svg.untouchend();

                    //这里如果 绘图位置 不靠最边 就会有bug




                    pressData(index);


                    svg.touchmove(function (e) {

                        e.preventDefault();


                        if(svgProperty.toward == 'vertical'){
                            touchy = e.touches[0].clientY;
                            offset = touchy+$(document).scrollTop() - $(svg.node).offset().top - svgProperty.chart.marginTop- svgProperty.chart.beforeOffset;   //  点击的元素的高度


                            if(offset  <  svgProperty.chart.top  || offset  >  svgProperty.chart.bottom- svgProperty.chart.beforeOffset){
                                return false;

                            }


                            index = Math.floor(offset / svgOption.style.categoryWidth);
                        }else{


                            touchx = e.touches[0].clientX;
                            offset = touchx-svgProperty.chart.marginLeft-svgProperty.chart.beforeOffset;


                            if(offset  <  svgProperty.chart.left  || offset  >  svgProperty.chart.right - svgProperty.chart.beforeOffset){
                                return false;

                            }
                            if( svgOption.style.xAxis  == 'time') {
                                index = Math.round(offset / svgOption.style.categoryWidth);

                            }else{
                                index = Math.floor(offset / svgOption.style.categoryWidth);

                            }

                        }
                        pressData(index);




                    });

                    svg.touchend(function (e) {
                        svg.untouchend();
                        svg.untouchmove();
                        cancelpressData();
                        svgOption.onTouchEnd();



                        svg.touchmove(function (e) {
                            svg.untouchend();
                            svg.touchend(function (e) {
                                svgProperty.chart.beforeOffset = svgProperty.chart.offset;
                            });

                            clearTimeout(svgProperty.touchTimer);

                            if(svgOption.style.moveChart) {

                                e.preventDefault();


                                if(svgProperty.toward == 'vertical'){
                                    var cury = e.touches[0].clientY;

                                    moveData(cury -touchy);
                                }else if(svgProperty.toward == 'horizontal'){
                                    var curx = e.touches[0].clientX;

                                    moveData(curx - touchx);

                                }


                            }
                        });

                    });


                }, 300);






            });

            svg.touchmove(function (e) {
                svg.untouchend();

                svg.touchend(function (e) {
                    svgProperty.chart.beforeOffset = svgProperty.chart.offset;
                });

                clearTimeout(svgProperty.touchTimer);

                if(svgOption.style.moveChart) {

                    e.preventDefault();


                    if(svgProperty.toward == 'vertical'){
                        var cury = e.touches[0].clientY;

                        moveData(cury -touchy);
                    }else if(svgProperty.toward == 'horizontal'){
                        var curx = e.touches[0].clientX;

                        moveData(curx - touchx);

                    }

                }
            });









        }



        function pressData(index){

            var data=getData(index);

            if(data){
                svgOption.onTouchStart();

                if( svgOption.tip){
                    var lastIndex = $('.svg_tip').attr('data-index');

                    if(index != lastIndex){
                        drawTip(index,data);
                    }
                }

            }



        }

        function cancelpressData(index){

            fadeTip();

        }



        function moveData(curoffset){
            // if (transx < - cperx * (cn + 1) + vw - columnl)
            //transx = vw - columnl < cperx * (cn + 1) ? -cperx * (cn + 1) + vw - columnl : 0;



            svgProperty.chart.offset = curoffset+svgProperty.chart.beforeOffset;



            if (svgProperty.chart.offset > 0) {
                svgProperty.chart.offset = 0;
            } else if(svgProperty.chart.offset < -svgOption.style.categoryWidth * (svgProperty.number +3 ) + svgProperty.chart.right - svgProperty.chart.left){
                svgProperty.chart.offset = svgProperty.chart.right - svgProperty.chart.left < svgOption.style.categoryWidth * (svgProperty.number +1 )   ?    -svgOption.style.categoryWidth * (svgProperty.number +3 ) + svgProperty.chart.right - svgProperty.chart.left : 0;


            }


            if(svgProperty.toward == 'vertical') {
                svgProperty.chartEl.transform("translate(0," + svgProperty.chart.offset + ")");

            }else if(svgProperty.toward == 'horizontal'){
                svgProperty.chartEl.transform("translate(" + svgProperty.chart.offset + ",0)");

            }



            // transy = beforey + cury - touchy;
            // if (transy > 0) {
            //     transy = 0;
            // } else if (transy < -cpery * (bn + 1) + (cb - ct)) {
            //     transy = cb - ct < cpery * (bn + 1) ? -cpery * (bn + 1) + (cb - ct) : 0;
            // }
            //
            // bars.transform("translate(0," + transy + ")");

        }







        function getData(index){
            var data=null;
            $.each(svgOption.data,function (i,n){
                if(i==index){
                    data =  n;
                    return false;
                }
            });

            return data;


        }







//画Tip
        function drawTip(index,data){


            var multiCircle=true;
            $.each(svgOption.style.items,function (i,n){
                if( n.type  != 'line' ){
                    multiCircle=false;
                    return false;
                }
            });



            fadeTip();

            if(svgProperty.toward == 'vertical'){

                var pointy = index * svgOption.style.categoryWidth + svgOption.style.categoryWidth / 2 + svgProperty.chart.marginTop + svgProperty.chart.beforeOffset;
                var pointx=svgProperty.viewBox.left;


            }else if(svgProperty.toward == 'horizontal') {



                var pointx = index * svgOption.style.categoryWidth + svgProperty.chart.marginLeft+svgProperty.viewBox.left + svgProperty.chart.beforeOffset;



                if(svgOption.style.xAxis != 'time'){
                    pointx+=svgOption.style.categoryWidth / 2;

                }
                var pointy=svgProperty.chart.bottom;

            }


            var lineCircelPointy=[];

            if( !multiCircle ){
                $.each(data.items,function (i,n){


                    if(svgProperty.toward == 'vertical') {
                        var temp_pointx = getValueX(n.num)+svgProperty.viewBox.left;

                        if(temp_pointx  > pointx){
                            pointx=temp_pointx;
                        }

                    }else if(svgProperty.toward == 'horizontal') {
                        var temp_pointy = getValueY(n.num);


                        if(temp_pointy  < pointy){
                            pointy=temp_pointy;
                        }
                    }

                })
            }else{
                $.each(data.items,function (i,n){

                    lineCircelPointy[i]=getValueY(n.num);
                })
            }

            var tip = svg.paper.g();


            var tipLine = drawTipLine(pointx,pointy);
            tip.add( tipLine);

            var user_index=0;
            $.each(svgOption.tip,function(i,n){
                var  isDraw=drawOneTip(user_index,n,data,pointx,tip);
                if(isDraw !== false){
                    user_index++;
                }
            });


            if( !multiCircle  ){
                drawTipLineCircle(pointx,pointy,tip,0);

            }else{

                $.each(lineCircelPointy,function (i,n) {
                    drawTipLineCircle(pointx,n,tip,i);

                });



            }




            tip.attr('class', "svg_tip");
            tip.attr('data-index', index);

        }

        function drawTipLine(pointx,pointy){

            if(svgProperty.toward == 'vertical') {
                pointx+=6;
            }else if(svgProperty.toward == 'horizontal') {
                pointy-=2;
            }

            var tipLine = svg.line(pointx, pointy, pointx, svgProperty.viewBox.top).attr({
                stroke: "#d2d2d2",
                strokeWidth: 2.5
            });

            return tipLine;
        }

        function drawTipLineCircle(pointx,pointy,tip,i){
            if(svgProperty.toward == 'vertical') {
                pointx+=6;
            }else if(svgProperty.toward == 'horizontal') {
                if(svgOption.style.items[i].type != 'line'){
                    pointy-=6;

                }
            }

            var tipCircle = svg.circle(pointx, pointy, 3).attr({
                stroke: svgOption.style.items[i].color,
                strokeWidth: 3,
                fill: "#fff"
            });

            tip.add(tipCircle);

        }

        function drawOneTip(index,option,data,pointx,tip){
            var textstr=option.format(data);

            if( !textstr  && textstr !== 0  && textstr !=='0'){
                return false;
            }


            var rect = svg.paper.rect(pointx, svgProperty.viewBox.top+index*(svgOption.style.tipHeight+5), 100,svgOption.style.tipHeight, 4).attr({
                fill: option.bg
            });


            var text = svg.paper.text(pointx, svgProperty.viewBox.top+14+(svgOption.style.tipHeight-14)/2  +  index*(svgOption.style.tipHeight+5),textstr).attr({
                fill: option.color,
                fontSize: 14
            });



            var textw = $(text.node).width();
            var rectw = textw + 20;
            var rectleft = pointx - rectw / 2;


            if (rectleft < 0) {
                rectleft = 0;
            } else if (rectleft > svgProperty.viewBox.right - rectw) {
                rectleft = svgProperty.viewBox.right - rectw;
            }

            rect.attr({
                width: rectw,
                x: rectleft
            });
            text.attr({
                x: (rectw - textw) / 2 + rectleft
            });


            tip.add(rect,text);


        }

//清除Tip
        function fadeTip(){
            $('.svg_tip').remove();//todo  class   想一个比较合适的

        }





        function drawData(){

            svgProperty.chartEl=chartSvg.g();


            drawName();


            $.each(svgOption.style.items,function (i,n){



                var  data=svgProperty.data['value'][i];

                // if(!data[0]){
                //     return false;
                // }

                if(n.type == 'bar'){
                    drawBar(data,i);
                }else if( n.type  == 'line' ){
                    drawLine(data,i);
                }else if(  n.type  == 'pie'){
                    drawPie();
                }

            });


        }

        function pickName(){
            var show = [];
            var per = svgProperty.number - 1;
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

        function drawName(){


            //pie  在 draw 的时候 画name
            if(!svgOption.style.nameWeight   ||  !svgOption.style.nameHeight  ){
                return false;
            }

            var margin = svgOption.style.categoryWidth;



            if( svgOption.style.xAxis  == 'time'){
                var  arr=pickName(svgOption.data);
            }


            $.each(svgOption.data,function (i,n){


                if(svgProperty.toward == 'vertical') {
                    var y = (margin) * i+svgOption.style.nameSize;
                    var x = 0;
                    drawText(n.name,x,y,svgOption.style.nameWeight,margin);

                }else if(svgProperty.toward == 'horizontal'){
                    var y = svgProperty.chart.bottom+svgOption.style.nameSize;


                    if( svgOption.style.xAxis  == 'time'){
                        $.each(arr,function (i2,n2){
                            if(i  == n2){
                                var x = (margin) * i;

                                drawText(n.name,x,y,(svgProperty.chart.right -svgProperty.chart.left)/arr.length,svgOption.style.nameHeight);
                                return true;
                            }

                        });



                    }else{
                        var x = (margin) * i;

                        drawText(n.name,x,y,margin,svgOption.style.nameHeight);

                    }


                }


                // var text = chartSvg.text(x, svgProperty.chart.bottom , n.name).attr({
                //     fill: '#f00',
                //     fontSize: svgOption.style.nameSize
                // });



            });

        }





        //一个区域   写一个不定长的名字    自动换行 居中
        function drawText(name,startX,startY,maxWeight,maxHeight,rectColor,isCenter){



            if(!name){
                return  false;
            }
            var nameMax='';
            var nameOverMax='';
            for(var i=0;i<name.length;i++){
                if(name[i-1]){
                    nameMax+=name[i-1];
                }
                nameOverMax+=name[i];

                if( svgOption.style.xAxis  == 'time') {
                    var text = svg.text(startX,startY, nameOverMax).attr({
                        fill: '#b0b0b0',
                        fontSize: svgOption.style.nameSize
                    });
                }else{
                    var text = chartSvg.text(startX,startY, nameOverMax).attr({
                        fill: '#b0b0b0',
                        fontSize: svgOption.style.nameSize
                    });
                }



                if(rectColor){
                    var rect = chartSvg.rect(startX -10, startY+(maxHeight-30)/2, 5, 5).attr({fill: rectColor});

                }

                //在这里  打断 会快一点





                if(svgProperty.toward != 'horizontal'){


                    text.attr({
                        y:startY+(maxHeight-$(text.node).height())/2
                    });
                }



                if($(text.node).width()  >   maxWeight ){

                    if(nameMax  !== ''){
                        text.remove();

                        if(rectColor) {

                            rect.remove();
                        }


                        if( svgOption.style.xAxis  == 'time') {

                            text = svg.text(startX, startY, nameMax).attr({
                                fill: '#b0b0b0',
                                fontSize: svgOption.style.nameSize
                            });
                        }else{
                            text = chartSvg.text(startX, startY, nameMax).attr({
                                fill: '#b0b0b0',
                                fontSize: svgOption.style.nameSize
                            });
                            svgProperty.chartEl.add(text);
                        }


                        if(   $(text.node).height()   <   maxHeight ){
                            drawText(name.substring(i),startX,$(text.node).height()+startY,maxWeight,maxHeight-$(text.node).height());

                        }
                    }

                    break;

                }else{
                    if(i != name.length -1){
                        text.remove();
                        if(rectColor) {

                            rect.remove();
                        }
                    }else{
                        if( isCenter !== false){

                            var x;


                            if( svgOption.style.xAxis  == 'time'){

                                // x=startX - ($(text.node).width()/2);
                                //因为图像没有做居中  name 也不用
                                x=startX;
                                if(x <= 0){
                                    x= 0 ;
                                }else if( x > svgProperty.viewBox.right - $(text.node).width()){
                                    // x= svgProperty.viewBox.right - $(text.node).width();

                                    x= svgDom.width() - $(text.node).width();

                                }
                            }else{

                                x=startX+(maxWeight-$(text.node).width())/2;

                            }




                            text.attr({
                                x:x
                            });

                            if(rectColor) {

                                rect.attr({
                                    x: x - 10
                                });
                            }


                        }

                        if( svgOption.style.xAxis  != 'time') {

                            svgProperty.chartEl.add(text);
                        }


                    }

                }




            }




            // var text = chartSvg.text(x, svgProperty.chart.bottom+svgOption.style.nameSize , n.name).attr({
            //     fill: '#f00',
            //     fontSize: svgOption.style.nameSize
            // });
        }


        function drawPie(){


            //todo 应该是参数配置的
            var defaultColor = ['#F27254', '#FFBE32', '#A1BB38', '#5BC45E', '#51B4D4', '#576ACD', '#A66CE2', '#FF74E0'];


            var margin;
            var toward;//这里变量以后在润色下

            if(   svgProperty.chart.bottom  >  svgProperty.chart.right){
                svgProperty.chart.bottom = svgProperty.viewBox.bottom/3*2;

                toward=1;
                margin=(svgProperty.viewBox.bottom/3)/Math.ceil(svgOption.data.length/3);

            }else{
                svgProperty.chart.right = svgProperty.viewBox.right/3*2;

                toward=2;
                margin=(svgProperty.viewBox.bottom-svgProperty.viewBox.top)/svgOption.data.length;
                margin=(svgProperty.viewBox.bottom-svgProperty.viewBox.top)/8;
            }




            var px=(svgProperty.chart.right-svgProperty.chart.left)/2;
            var py=(svgProperty.chart.bottom-svgProperty.chart.top)/2;



            var pr=px<py?px*0.8:py*0.8;




            var cpltpercent = 0;   //完成的圆的角度
            var aimx = [], aimy = [];
            aimx[0] = px;
            aimy[0] = py-pr;


            drawText('点击各项查看详情',px-pr-svgProperty.viewBox.left,py+pr,2*pr,60);



            if(svgOption.data.length  == 1){

                //画一个整圆
                var random = Math.floor(Math.random() * defaultColor.length);

                //chartSvg 上画
                var circle = svg.circle(px, py, pr).attr({
                    fill: defaultColor[random]
                });

                circle.touchstart(function (e) {
                    circle.touchend(function (e) {
                        circle.untouchend();
                        svgOption.onTouch(svgOption.data[0]);
                    });
                    //movePie(this, movex, movey, v, e);
                });
                circle.touchmove(function (e) {
                    circle.untouchend();
                    //movePie(this, movex, movey, v, e);
                });


                if(toward  == 1){
                    var x = px;
                    var y = svgProperty.viewBox.bottom/3*2;
                    drawText(svgOption.data[0].name,x,y,svgProperty.viewBox.right/3,margin,defaultColor[random]);
                }else{

                    var x = svgProperty.viewBox.right/3*2;
                    var y = svgOption.style.nameSize;
                    drawText(svgOption.data[0].name,x,y,svgProperty.viewBox.right/3,margin,defaultColor[random],false);
                }






                svg.text(px - 12, py, '100%').attr({
                    fill: "#fff",
                    fontSize: 12
                });

            }else{
                $.each(svgOption.data,function (i,n) {

                    var percent = n.items[0].num / svgProperty.sum;

                    var flag = percent > 0.5 ? 1 : 0;
                    cpltpercent += percent;

                    aimx[i + 1] = px + pr * Math.sin(2 * Math.PI * cpltpercent);
                    aimy[i + 1] = py - pr * Math.cos(2 * Math.PI * cpltpercent);

                    var midpercent = cpltpercent - percent / 2;  //中间角度
                    var movex = px - 10 * Math.cos(2 * Math.PI * midpercent) - px;
                    var movey = py - 10 * Math.sin(2 * Math.PI * midpercent) - py;

                    var pathString = "M " + px + " " + py + "L " + aimx[i] + " " + aimy[i] + " " + "A " + pr + " " + pr + " " + 0 + " " + flag + " " + 1 + " " + aimx[i + 1] + " " + aimy[i + 1] + " " + " Z";

                    var pie = svg.g().attr({
                        'class': "svgpiepie"
                    });

                    var random = Math.floor(Math.random() * defaultColor.length);
                    var path = chartSvg.path(pathString).attr({
                        fill: defaultColor[random],
                        stroke: "#fff",
                        strokeWidth: "1"
                    });

                    pie.add(path);



                    if (percent > 1 / 14) {  //画文字
                        var textx = px + pr * Math.sin(2 * Math.PI * midpercent) / 1.4 - 18;
                        var texty = py - pr * Math.cos(2 * Math.PI * midpercent) / 1.4;
                        var text = chartSvg.text(textx, texty, Math.round(n.items[0].num* 1000 / svgProperty.sum) / 10 + '%').attr({
                            fill: "#fff",
                            fontSize: 12
                        });
                        pie.add(text);
                    }






                    pie.touchstart(function (e) {
                        pie.touchend(function (e) {
                            pie.untouchend();
                            svgOption.onTouch(n);
                        });
                        //movePie(this, movex, movey, v, e);
                    });
                    pie.touchmove(function (e) {
                        pie.untouchend();
                        //movePie(this, movex, movey, v, e);
                    });








                    if(toward  == 1){
                        var x = svgProperty.viewBox.right/3 *  (i%3);
                        var y = (margin* Math.floor(i/3) )+svgOption.style.nameSize +svgProperty.chart.bottom;
                        drawText(n.name,x,y,svgProperty.viewBox.right/3,margin,defaultColor[random]);
                    }else{
                        var x = svgProperty.viewBox.right/3*2;
                        var y = (margin*i )+svgOption.style.nameSize;
                        drawText(n.name,x,y,svgProperty.viewBox.right/3,margin,defaultColor[random],false);
                    }









                    // drawOneLegend(color[random], i, v, pie, movex, movey);
                    defaultColor.splice(random, 1);


                });
            }












        }


        function drawBar(data,i){
            var width=svgOption.style.items[i].width;
            var color=svgOption.style.items[i].color;

            //todo  dataOffset  以后换成 绝对差

            var offset=svgOption.style.dataOffset*i;
            var margin=svgOption.style.categoryWidth;



            //图形宽度  间隔 宽度    对比 间隔宽度
            $.each(data,function (i2,n){

                var x;
                var y;
                var height;


                var line;

                if(svgProperty.toward == 'vertical'){
                    y = margin * i2+margin/2   +offset;

                    //矩形的长   是   画图的宽属性
                    x =  getValueX(n);


                    // rect = chartSvg.rect( svgProperty.chart.left, y, 0,width).attr({
                    line = chartSvg.line( svgProperty.chart.left, y, x,y).attr({
                        stroke: color,
                        strokeWidth:width
                    });

                    // rect.animate({
                    //     width: height
                    // }, 800, mina.easeinout);



                }else if(svgProperty.toward == 'horizontal'){
                    x = (margin) * i2+margin/2   +offset;
                    y = getValueY(n);



                    // rect = chartSvg.rect( x , svgProperty.chart.bottom, width,0).attr({
                    // rect = chartSvg.line( x , y, width,height).attr({

                    line = chartSvg.line( x , y, x,svgProperty.chart.bottom).attr({
                        stroke: color,
                        strokeWidth:width
                    });


                    if(svgOption.style.items[i].marker){

                        var textProgeress = chartSvg.text(x,  y-2, svgOption.style.items[i].marker.format(getData(i2))).attr({
                            fill: '#a3a3a3',
                            fontSize: 11
                        });

                        textProgeress.attr({
                            x:x-textProgeress.getBBox().width/2
                        });

                        svgProperty.chartEl.add(textProgeress);

                    }


                    // rect.animate({
                    //     height: height,
                    //     y: y
                    // }, 800, mina.easeinout);
                }

                svgProperty.chartEl.add(line);



            });


            //chartSvg
        }

        function drawLine(data,i){
            if( data[0] === null){
                return false;
            }

            var width=svgOption.style.items[i].width;
            var color=svgOption.style.items[i].color;


            var offset=svgOption.style.dataOffset*i;
            var margin=svgOption.style.categoryWidth;






            var initpath ='' ;
            var datapath ='';

            var x;
            var y;

            //图形宽度  间隔 宽度    对比 间隔宽度
            $.each(data,function (i,n){
                if( n === null){
                    return false;
                }

                x = margin * i   +offset;


                if(svgOption.style.xAxis != 'time'){
                    x+=margin/2;
                }
                y = getValueY(n);
                var command = 'L';
                if( ! i){
                    command = 'M';
                }

                // var rect = chartSvg.rect( x , y, width,height).attr({
                //     fill: '#7cb7ef'
                // });


                datapath += command + ' ' + x + ' ' + y;
                initpath += command + ' ' + x  + ' ' + svgProperty.chart.bottom;





                //只有一条数据
                if(data.length == 1 ){

                    svgOption.style.items[i].lineEnd=false;

                    //有没有 对比数据
                    if(svgOption.style.items.length > 1  || data.length > 1 ){
                        drawLineEnd(x+svgProperty.viewBox.left,y,false,color);
                        // svgProperty.chartEl.add(elArr);

                    }else{
                        x = svgProperty.chart.right;

                        datapath += ' L ' + x + ' ' + y;

                    }


                }
            });



            // var initShandowPath = initpath + 'V' + svgProperty.chart.bottom + 'H' + (margin/2  +offset);
            if( svgOption.style.xAxis  == 'time'){
                var shandowPath = datapath + 'V' + svgProperty.chart.bottom + 'H' + 0;

            }else{
                var shandowPath = datapath + 'V' + svgProperty.chart.bottom + 'H' + (margin/2  +offset);
            }

            // var path = chartSvg.path(initShandowPath).attr({
            var path = chartSvg.path(shandowPath).attr({
                stroke: 'none',
                fill: '#47a8ef',
                fillOpacity: '0.1',
                strokeLinejoin: 'bevel',
                strokeLinecap: 'round'
            });
            // path.animate({
            //     path: shandowPath
            // }, 800, mina.easeinout);
            //
            //
            svgProperty.chartEl.add(path);



            // var dataLine = chartSvg.path(initpath).attr({
            var dataLine = chartSvg.path(datapath).attr({
                stroke: color, // 浅黄 浅蓝
                strokeWidth: 2.5,
                fill: 'none',
                strokeLinejoin: 'bevel'
            });

            // dataLine.animate({
            //     path: datapath
            // }, 800, mina.easeinout);

            svgProperty.chartEl.add(dataLine);



            if(svgOption.style.items[i].lineEnd){
                var elArr=drawLineEnd(x,y,svgOption.style.items[i].lineEnd.format(svgOption.data[svgOption.data.length -1]));
                svgProperty.chartEl.add(elArr);


            }


        }



        function drawBg(){
            var lineh;
            var i ;
            if(svgProperty.toward == 'vertical'){
                lineh = ( svgProperty.chart.right - svgProperty.chart.left) / svgOption.style.valuePartition;

                for (i = 0; i <=  svgOption.style.valuePartition; i++) {
                    var w = svgProperty.viewBox.left +svgProperty.chart.left + i * lineh;


                    svg.line(w, svgProperty.chart.top+svgProperty.chart.marginTop, w, svgProperty.chart.bottom+svgProperty.chart.marginTop).attr({
                        stroke: "#e2e2e2",
                        strokeDasharray: "10 2",
                        strokeWidth: 0.5
                    });

                    var text = svg.text(w, svgProperty.chart.bottom+svgProperty.chart.marginTop+10,''+svgProperty.perBgValue * i+'' ).attr({
                        fill: '#b0b0b0',
                        fontSize: 10
                    });

                    text.attr('x', w - $(text.node).width() / 2);

                }


                chartSvg= svg.svg(svgProperty.viewBox.left, svgProperty.viewBox.top+svgProperty.chart.marginTop, svgProperty.viewBox.right, svgProperty.chart.bottom);




            }else if(svgProperty.toward == 'horizontal'){
                lineh = ( svgProperty.chart.bottom - svgProperty.chart.top) / svgOption.style.valuePartition;

                var bgLine = svg.line(svgProperty.viewBox.left, svgProperty.chart.bottom, svgProperty.viewBox.right, svgProperty.chart.bottom).attr({
//stroke: '#e2e2e2',
                    stroke: '#e2e2e2',
                    strokeDasharray: "10 2",
                    strokeWidth: 0.5
                });



                for (i = 1; i <= svgOption.style.valuePartition; i++) {
                    var h = svgProperty.chart.bottom - i * lineh;

                    bgLine.clone().attr({
                        x1: svgProperty.viewBox.left,
                        y1: h,
                        x2: svgProperty.viewBox.right,
                        y2: h
                    });


                    svg.text(svgProperty.viewBox.left, h + 13, svgProperty.perBgValue * i).attr({
                        fill: '#b0b0b0',
                        fontSize: 10
                    });
                }


                //todo 为了不覆盖  图表   这里的 svg需要在画完了之后在申明
                chartSvg= svg.svg(svgProperty.viewBox.left+svgProperty.chart.marginLeft, svgProperty.viewBox.top, svgProperty.viewBox.right, svgProperty.viewBox.bottom);






            }



        }

        function initSvgOption(){


            //以后 做成 不用传递 items  可以根据 data
            $.each(option.style.items,function (i, n) {

                if(! n.type){
                    option.style.items[i].type='line';
                }


                if(! n.width){
                    switch (n.type){
                        case 'line':
                            option.style.items[i].width='3';
                            break;
                        default:
                            option.style.items[i].width='10';
                    }

                }

                if(! n.color){
                    option.style.items[i].color='#7cb7ef';

                }

            });


            if(option.tip){
                $.each(option.tip,function (i, n) {

                    if(! n.color){
                        option.tip[i].color='#ffffff';
                    }


                    if(! n.bg){
                        option.tip[i].bg='#7cb7ef';
                    }


                });

            }



            if(option.avg){

                $.each(option.avg,function (i, n) {
                    if(! n.color){
                        option.avg[i].color='#ffffff';
                    }


                    if(! n.bg){
                        option.avg[i].bg='#f5a25c';
                    }


                });



            }







            var defaultOption={
                el:"#svg1",
                tip:null,
                marker:null,
                avg:null,
                style:{
                    tipHeight:25,
                    moveChart:false,
                    nameColor:'#000000',
                    nameWeight:65,
                    nameHeight:40,
                    nameSize:12,
                    dataOffset:0,
                    valuePartition:6,
                    xAxis:'category',
                    yAxis:'value'
                },
                data:[],
                onFinish:function(){},
                onBegin:function(){},
                onTouchStart:function(){},
                onTouchEnd:function(){},
                onTouch:function(){}

            };

            option= $.extend(true,{},defaultOption,option);





            if(!option.style.categoryWidth){


                var width=0;

                if(option.style.dataOffset  && 'value' != option.style.xAxis ){
                    width=40;

                }


                var paddingWidth=0;

                if(option.style.dataOffset){

                    $.each(option.style.items,function (i, n) {
                        if(i  == 0){
                            paddingWidth=2*n.width;
                        }


                        //width+=n.width/1;
                        width+=option.style.dataOffset/1;
                    });

                }else{

                    if( 'value' == option.style.xAxis ) {
                        width=10;

                    }else{
                        width=35;

                    }

                    $.each(option.style.items,function (i, n) {
                        if(i  == 0){
                            paddingWidth+=2*n.width;
                        }

                        var tempWidth=n.width;
                        if(tempWidth   > width){
                            width = tempWidth;
                        }
                    });


                }




                option.style.categoryWidth=width/1+paddingWidth;


            }


            return option;
        }

//初始化SVG信息
        function initSvgProperty(){
            var svgProperty={
                'color':{
                    'blue':'#7cb7ef',
                    'green':'#88bf57',
                    'orange':'#f5a25c',
                    'grey':'#e4e4e4'
                },
                'toward':'',
                'viewBox':{
                    'left':10,
                    'top':0,
                    'right':svgDom.width(),
                    'bottom':svgDom .height()
                },
                'chart':{
                    'offset':0,
                    'beforeOffset':0,
                    'marginTop':0,
                    'marginLeft':0,
                    'marginBottom':0,
                    'left':0,
                    'top':0,
                    'right':svgDom.width(),
                    'bottom':svgDom.height()
                },
                'data':{
                    'name':[],
                    'value':[]
                },
                'chartEl':null,
                'touchTimer':null,
                'avg':null,
                'number':0,
                'max':100,
                'min':0,
                'sum':0,
                'perBgValue':100,
                'maxBgValue':0,
                'x':0
            };







            if(svgOption.style.items[0].type  !=  'pie'){

                if( 'value' == option.style.xAxis ) {
                    svgProperty.toward='vertical';

                }else if( 'value' == option.style.yAxis ){
                    svgProperty.toward='horizontal';

                }else{
                    console.log('坐标轴没有刻度轴');
                    return false;
                }
            }






            if(svgProperty.toward == 'vertical') {




                svgProperty.chart.marginTop=10;
                svgProperty.chart.marginBottom=10;



                if(svgOption.tip){
                    svgProperty.chart.marginTop=svgOption.tip.length*(5+svgOption.style.tipHeight);
                }


                svgProperty.chart.left+=svgOption.style.nameWeight;
                svgProperty.chart.right-=20+svgProperty.viewBox.left;

                svgProperty.chart.bottom-=svgProperty.viewBox.top+svgProperty.chart.marginTop+svgProperty.chart.marginBottom;




            }else if(svgProperty.toward == 'horizontal'){



                if(svgOption.tip){
                    svgProperty.chart.top+=svgOption.tip.length*(5+svgOption.style.tipHeight);
                }else{
                    svgProperty.chart.top+=10;

                }


                svgProperty.chart.bottom-=svgOption.style.nameHeight;


                if(svgOption.style.xAxis != 'time'){
                    svgProperty.chart.marginLeft=40;

                }else{
                    svgProperty.viewBox.right-=10;
                    svgProperty.chart.right-=10;
                    //svgProperty.chart.marginLeft=10;
                }

                svgProperty.chart.right-=svgProperty.chart.marginLeft+svgProperty.viewBox.left;






            }else{
                svgProperty.viewBox.right-=10;

                chartSvg= svg.svg(svgProperty.viewBox.left, svgProperty.viewBox.top, svgProperty.viewBox.right, svgProperty.viewBox.bottom);


            }









            //最大值最小值  方向是之前区分的
            //区分类型  区分名称和数据

            $.each(svgOption.style.items,function (i,n){
                // svgProperty.data['name'].push([]);
                // svgProperty.data['type'].push(n);
                svgProperty.data['value'][i]=[];

            });


            var allData=[];
            $.each(svgOption.data,function (i,n){

                svgProperty.number++;
                $.each(svgOption.style.items,function (i3,n3){
                    svgProperty.data['value'][i3][i]=null;
                });

                $.each(n.items,function (i2,n2){
                    if(!n2.num  &&  n2.num !='0'  &&  n2.num !=0 ){
                        n2.num =null;
                    }

                    if(svgProperty.data['value'][i2]){

                        if(  n2.items){
                            //多级

                        }else{
                            //单级
                            svgProperty.data['value'][i2][i]=n2.num;
                            if(n2.num){
                                allData.push(n2.num);
                            }


                        }

                    }


                })
            });



            if( svgOption.style.xAxis  == 'time'){


                if(  svgProperty.number  == 1){
                    svgOption.style.categoryWidth=svgProperty.chart.right-svgProperty.chart.left
                }else{
                    svgOption.style.categoryWidth=(svgProperty.chart.right-svgProperty.chart.left)/(svgProperty.number-1);
                }



            }



            if(allData.length){
                svgProperty.max=Math.max.apply(Math,allData);
                svgProperty.sum=eval(allData.join('+'));
                svgProperty.min=Math.min.apply(Math,allData);

                svgProperty.perBgValue=getPerBgValue(svgProperty.max);
            }else{
                svgProperty.max=0;
                svgProperty.sum=0;
                svgProperty.min=0;

                svgProperty.perBgValue=1;


            }





            return svgProperty;



        }









        function getValueY(val) {
            if (val) {
                val = parseFloat(val);
                return svgProperty.chart.bottom  - getValueHeight(val);
            }
            return svgProperty.chart.bottom;
        }

        function getValueX(val) {
            if (val) {
                val = parseFloat(val);
                return svgProperty.chart.left  + getValueWidth(val);
            }
            return svgProperty.chart.left;
        }

        function getValueHeight(val) {
            if (val) {


                val = parseFloat(val);
                return val / (svgProperty.perBgValue * svgOption.style.valuePartition)* ( svgProperty.chart.bottom  -  svgProperty.chart.top);
            }
            return 0;
        }


        function getValueWidth(val) {
            if (val) {


                val = parseFloat(val);
                return val / (svgProperty.perBgValue * svgOption.style.valuePartition)* ( svgProperty.chart.right  -  svgProperty.chart.left);
            }
            return 0;
        }





//坐标轴Value每段值
        function getPerBgValue(max){
            if (max == 0) {
                return 1;
            }


            var per = max / svgOption.style.valuePartition;   //每条线的间隔
            var mod;   //取整系数
            switch(true){
                case per>10000 : mod=5000; break;
                case per>5000 : mod=1000; break;
                case per>1000 : mod=500; break;
                case per>500 : mod=100; break;
                case per>100 : mod=50; break;
                case per>svgOption.style.valuePartition : mod=10; break;
                default : mod=1;
            }
            return Math.ceil(per / mod) * mod;
        }


//初始化svg
        function svgClear(){
            svg.clear();
            svg.untouchmove();
            svg.untouchend();
            svg.untouchstart();
        }





//this.opt = $.extend(true,{},defOpt,opt);
//         return true;
    };
})();