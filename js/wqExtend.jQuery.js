;(function($){
    $.extend({
        loading : function(isShow){
            //<div id="bg" '+str+'></div>
            //var loadingEle = '<style>#bg{position:fixed;display:none;top:0px;left:0px;width:100%;height:100%;background-color:#939297;opacity:0.45;z-index:99}.spinner{width:30px;height:30px;position:fixed;top:45%;left:45%;z-index:100}.spinner-bg{width:50px;height:50px;top:-10px;left:-10px;display: none;position:absolute;background:rgba(0,0,0,.3);border-radius: 5px;}.container1>div,.container2>div,.container3>div{width:6px;height:6px;background-color:#333;border-radius:100%;position:absolute;-webkit-animation:bouncedelay 1.2s infinite ease-in-out;animation:bouncedelay 1.2s infinite ease-in-out;-webkit-animation-fill-mode:both;animation-fill-mode:both}.spinner .spinner-container{position:absolute;width:100%;height:100%}.container2{-webkit-transform:rotateZ(45deg);transform:rotateZ(45deg)}.container3{-webkit-transform:rotateZ(90deg);transform:rotateZ(90deg)}.circle1{top:0;left:0}.circle2{top:0;right:0}.circle3{right:0;bottom:0}.circle4{left:0;bottom:0}.container2 .circle1{-webkit-animation-delay:-1.1s;animation-delay:-1.1s}.container3 .circle1{-webkit-animation-delay:-1s;animation-delay:-1s}.container1 .circle2{-webkit-animation-delay:-.9s;animation-delay:-.9s}.container2 .circle2{-webkit-animation-delay:-.8s;animation-delay:-.8s}.container3 .circle2{-webkit-animation-delay:-.7s;animation-delay:-.7s}.container1 .circle3{-webkit-animation-delay:-.6s;animation-delay:-.6s}.container2 .circle3{-webkit-animation-delay:-.5s;animation-delay:-.5s}.container3 .circle3{-webkit-animation-delay:-.4s;animation-delay:-.4s}.container1 .circle4{-webkit-animation-delay:-.3s;animation-delay:-.3s}.container2 .circle4{-webkit-animation-delay:-.2s;animation-delay:-.2s}.container3 .circle4{-webkit-animation-delay:-.1s;animation-delay:-.1s}@-webkit-keyframes bouncedelay{0%,80%,100%{-webkit-transform:scale(0)}40%{-webkit-transform:scale(1)}}@keyframes bouncedelay{0%,80%,100%{transform:scale(0);-webkit-transform:scale(0)}40%{transform:scale(1);-webkit-transform:scale(1)}}</style><div class="spinner"><div class="spinner-bg"></div><div class="spinner-container container1"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container2"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div><div class="spinner-container container3"><div class="circle1"></div><div class="circle2"></div><div class="circle3"></div><div class="circle4"></div></div></div>';
            var $c_loading = $('#c_loading');
            if(!$c_loading.length){
                $c_loading = $('<div id="c_loading"></div>');
                $('body').append($c_loading);
            }

            if(isShow){
                $c_loading.show();
            }else{
                $c_loading.hide();
            }
        },
        /*ajax更新列表*/
        ajaxData:function(opt){
            opt = $.extend({
                url:'',
                before:function(){},/*更新列表之前所做的事情*/
                success:function(){},/*更新列表成功后所有的事情*/
                error:function(){},/*更新列表失败后所做的事情*/
                complete:function(){},/*complete后所做的事情*/
                timeout:15000,
                postType:'post',/*默认ajax请求方式为post*/
                postData:'',/*准备发送的数据*/
                async: true/*默认为异步传输*/
            },opt);

            if(opt.url.length === 0){
                console.log('url is not set!');
                return false;
            }

            clearTimeout(window.ajaxTimer);
            //如果键盘敲击速度太快，小于100毫秒的话就不会向后台发请求，但是最后总会进行一次请求的。
            window.ajaxTimer = setTimeout(function() {
                //触发请求
                $.ajax({
                    url:opt.url,
                    type:opt.postType,
                    timeout:opt.timeout,
                    data:opt.postData,
                    async:opt.async,
                    beforeSend:function(data){
                        opt.before(data);
                    },
                    complete:function(data){
                        opt.complete(data);
                    },
                    success:function(data){
                        opt.success(data);
                    },
                    error:function(data){
                        opt.error(data);
                    }
                });
            },50);
        },
        /**
         * 返回符合条件的开始时间和结束时间戳
         * @param select int 选择项 1为本周 2为本月 3为近2个月 4为近3个月 5为近6个月 6为近一年
         */
        getStartEndTime : function(select , is_compare){
            var c = {};
            var now = new Date();
                var now_time = now.getTime();

            function getLastDay(year, month) {
                var new_year = year;    //取当前的年份
                var new_month = month++;//取下一个月的第一天，方便计算（最后一天不固定）
                if (month > 12) {
                    new_month -= 12;        //月份减
                    new_year++;            //年份增
                }
                var new_date = new Date(new_year, new_month, 1);                //取当年当月中的第一天
                return (new Date(new_date.getTime() - 1000 * 60 * 60 * 24)).getDate();//获取当月最后一天日期
            }
            function getDateFormat(str,time)
            {
                var date = new Date();
                date.setTime(time);
                str = str.replace('Y',date.getFullYear());
                var m = date.getMonth() + 1;
                str = str.replace('m', m < 10 ? '0'+m : m);
                var d = date.getDate();
                str = str.replace('d',d < 10 ? '0'+d : d);
                return str;
            }
            function getDateTime(Y,m,d,H,i,s)
            {
                Y = Y || 0;
                m = m || 0;
                d = d || 0;
                H = H || 0;
                i = i || 0;
                s = s || 0;
                var date = new Date();
                date.setFullYear(Y);
                date.setMonth(m);
                date.setDate(d);
                date.setHours(H);
                date.setMinutes(i);
                date.setSeconds(s);
                return date.getTime();
            }
           //本周
            c.select1 = function(is_compare){
                var m = {};
                var day =  now.getDay();
                if(day == 0){
                    day = 7;
                }
                m.time_start = getDateTime(now.getFullYear(),now.getMonth(),now.getDate() - day + 1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),now.getDate() + 7 - day,23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth(),now.getDate()- 13);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('m-d',m.time_start) + '至' + getDateFormat('m-d',m.time_end);
                    m.last_text = getDateFormat('m-d',m.compare_time_start) + '至' + getDateFormat('m-d',m.compare_time_end);
                }
                return m;
            };
            //本月
            c.select2 = function(is_compare){
                var m = {};
                m.time_start = getDateTime(now.getFullYear(),now.getMonth(),1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),getLastDay(now.getFullYear(),now.getMonth()+1),23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth()-1,1);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('m-d',m.time_start) + '至' + getDateFormat('m-d',m.time_end);
                    m.last_text = getDateFormat('m-d',m.compare_time_start) + '至' + getDateFormat('m-d',m.compare_time_end);
                }
                return m;
            };
             //3为近2个月
            c.select3 = function(is_compare){
                var m = {};
                m.time_start = getDateTime(now.getFullYear(),now.getMonth()-1,1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),getLastDay(now.getFullYear(),now.getMonth()+1),23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth()-3,1);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('Y-m',m.time_start) + '至' + getDateFormat('Y-m',m.time_end);
                    m.last_text = getDateFormat('Y-m',m.compare_time_start) + '至' + getDateFormat('Y-m',m.compare_time_end);
                }
                return m;
            };
            //4为近3个月
            c.select4 = function(is_compare){
                var m = {};
                m.time_start = getDateTime(now.getFullYear(),now.getMonth()-2,1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),getLastDay(now.getFullYear(),now.getMonth()+1),23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth()-5,1);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('Y-m',m.time_start) + '至' + getDateFormat('Y-m',m.time_end);
                    m.last_text = getDateFormat('Y-m',m.compare_time_start) + '至' + getDateFormat('Y-m',m.compare_time_end);
                }
                return m;
            };
            //5为近6个月
            c.select5 = function(is_compare){
                var m = {};
                m.time_start = getDateTime(now.getFullYear(),now.getMonth()-5,1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),getLastDay(now.getFullYear(),now.getMonth()+1),23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth()-11,1);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('Y-m',m.time_start) + '至' + getDateFormat('Y-m',m.time_end);
                    m.last_text = getDateFormat('Y-m',m.compare_time_start) + '至' + getDateFormat('Y-m',m.compare_time_end);
                }
                return m;
            };
            //6为近一年
            c.select6 = function(is_compare){
                var m = {};
                m.time_start = getDateTime(now.getFullYear(),now.getMonth()-11,1);
                m.time_end = now_time;
                if(is_compare){
                    //m.time_end = getDateTime(now.getFullYear(),now.getMonth(),getLastDay(now.getFullYear(),now.getMonth()+1),23,59,59);
                    m.compare_time_start =  getDateTime(now.getFullYear(),now.getMonth()-23,1);
                    m.compare_time_end = m.time_start - 1000;
                    m.cur_text = getDateFormat('Y-m',m.time_start) + '至' + getDateFormat('Y-m',m.time_end);
                    m.last_text = getDateFormat('Y-m',m.compare_time_start) + '至' + getDateFormat('Y-m',m.compare_time_end);
                }
                return m;
            };
            c.handleDate = function(m){
                m.time_start = (''+ m.time_start).slice(0,10);
                m.time_end = (''+ m.time_end).slice(0,10);
                if(typeof  m.compare_time_start != 'undefined'){
                    m.compare_time_start = (''+ m.compare_time_start).slice(0,10);
                }
                if(typeof  m.compare_time_end != 'undefined'){
                    m.compare_time_end = (''+ m.compare_time_end).slice(0,10);
                }
                return m;
            };
            return c.handleDate(c['select'+select](is_compare));


        },
        /**
         * 货币转换,将123456转换为123,456格式,如果不是数值,返回字符'0'
         */
        formatCurrency : function(num){
            var sign = 0,
                cents = 0,
                res = 0;

            if(typeof  num != 'string'){
                return num;
            }

            num = num.toString().replace(/\$|\,/g,'');
            if( isNaN(num) ){
                num = "0";
            }
            var w = '';
            var max = 100000;
            if(num > max){
                w = '万';
                num = num / 10000;
            }
            sign = (num == (num = Math.abs(num)));
            num = Math.floor(num * 100 + 0.50000000001);
            cents = num % 100;
            num = Math.floor( num / 100 ).toString();
            if(cents < 10){
                cents = "0" + cents;
            }
            for (var i = 0; i < Math.floor( (num.length - ( 1 + i ) ) / 3 ); i++ ) {
                num = num.substring( 0 , num.length - ( 4 * i + 3 ) ) + ',' + num.substring( num.length - ( 4 * i + 3 ) );
            }
            res = ( ( ( sign ) ? '' : '-' ) + num + '.' + cents );
            return ''+res + w;
        },
        /*将时间戳转换为相应的字符串,入转换成"本月/上月/2014-10至2014-12"*/
        /**
         *
         * @param select    number    转换的类型(1->本周,2->本月,3->近2个月,4->近3个月,5->近6个月,6->近1年),默认本月
         * @param is_chart  bool      是否是同期对比(这里会将本周转换为上周,本月转换为上月),默认否
         */
        parseTimeStr : function(select , is_chart){
            var returnStr = '';
            var timeStr = $.getStartEndTime(select , is_chart);
            var timeFormat = 'y-m';

            select = parseInt(select) || 2;
            is_chart = is_chart || false;

            switch(select){
                case 1 :
                    returnStr = is_chart ? '上周' : '本周';
                    break;
                case 2:
                    returnStr = is_chart ? '上月': '本月';
                    break;
                case 3:
                case 4:
                case 5:
                case 6:
                    returnStr = $.parseDate({timestamp : timeStr.time_start * 1000 , format : timeFormat}) + '至' +  $.parseDate({timestamp : timeStr.time_end * 1000 , format : timeFormat});
                    returnStr = $.parseDate({timestamp : timeStr.time_start * 1000 , format : timeFormat}) + '至' +  $.parseDate({timestamp : timeStr.time_end * 1000 , format : timeFormat});

                return returnStr;
            }
        },
        /*解析时间,参数timestamp(默认当前时间),参数format为日期格式(y年m月d日期w周数h小时,i分钟,s秒数)*/
        parseDate:function(dateOpt){
            var defaultDate = new Date();
            dateOpt = $.extend({
                timestamp: defaultDate.getTime(),
                format:'y-m-d h:i:s w'
            },dateOpt);
            var timeObj = new Date( parseInt(dateOpt.timestamp) ),
                weekZh = ['周日','周一','周二','周三','周四','周五','周六'],
                timeInfo = {
                    year : timeObj.getFullYear(),
                    month : timeObj.getMonth() + 1,
                    date : timeObj.getDate(),
                    day : weekZh[timeObj.getDay()],
                    hour : timeObj.getHours(),
                    min : timeObj.getMinutes(),
                    sec : timeObj.getSeconds()
                },
                formatLen = dateOpt.format.length,
                i = 0,
                parsedDate = '';
            //parse date format(y年-m月-d日-h时-i分-s秒-w周)
            if(formatLen > 0){
                for(i = 0;i < formatLen ;i++) {
                    if(dateOpt.format[i] === 'y'){
                        parsedDate += timeInfo.year;
                    }else if(dateOpt.format[i] === 'm'){
                        parsedDate += timeInfo.month;
                    }else if(dateOpt.format[i] === 'd'){
                        if(timeInfo.date < 10){
                            timeInfo.date = '0' + timeInfo.date;
                        }
                        parsedDate += timeInfo.date;
                    }else if(dateOpt.format[i] === 'h'){
                        if(timeInfo.hour < 10){
                            timeInfo.hour = '0' + timeInfo.hour;
                        }
                        parsedDate += timeInfo.hour;
                    }else if(dateOpt.format[i] === 'i'){
                        if(timeInfo.min < 10){
                            timeInfo.min = '0' + timeInfo.min;
                        }
                        parsedDate += timeInfo.min;
                    }else if(dateOpt.format[i] === 's'){
                        if(timeInfo.sec < 10){
                            timeInfo.sec = '0' + timeInfo.sec;
                        }
                        parsedDate += timeInfo.sec;
                    }else if(dateOpt.format[i] === 'w'){
                        parsedDate += timeInfo.day;
                    }else{
                        parsedDate += dateOpt.format[i];
                    }
                }
            }

            return parsedDate;
        },
        setPageTitle:function(title){
            location.href = 'xbwq://ui-event.update.title/?title='+title;
        }
    });
    $.fn.extend({
        /*触摸事件封装,touchEvent为要触发的函数,bind为冒泡触发的dom*/
        touchEvent: function (bind, touchEvent) {
            if ((typeof arguments[0]) === 'function') {
                touchEvent = arguments[0];
                bind = '';
            } else {
                bind = arguments[0];
                touchEvent = arguments[1];
            }

            this.on('touchstart', bind, function () {
                $(this).on('touchend', function (e) {
                    var that = this;
                    touchEvent(that, e);
                    $(this).off('touchend');
                    return false;
                });
            });

            this.on('touchmove', bind, function () {
                $(this).off('touchend');
            });

            //支持链式操作
            return this;
        }
    });
})(jQuery);