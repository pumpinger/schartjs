var handler={
    clipper:function (points){
        var arr=this.lngLat2xy(points);
        arr = ClipperLib.Clipper.SimplifyPolygon(arr,1);
        return this.xy2point(arr);
    },
    lighten:function (points,level){
        var arr=this.lngLat2xy(points);
        arr = ClipperLib.JS.Lighten(arr,level);
        return this.xy2point(arr);
    },
    offset:function (points){
        var arr=this.lngLat2xy(points);
//                arr = ClipperLib.Clipper.SimplifyPolygon(arr,1);
        var co = new ClipperLib.ClipperOffset(2, 0.25);
        co.AddPath(arr, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
        co.Execute(arr, 500/15);
        return this.xy2point(arr);
    },
    lngLat2xy:function (points){
        var arr=[];

        for (var x in points)
        {
            arr.push({"X":points[x].lng*10000, "Y":points[x].lat*10000});
        }
        return arr;
    },
    xy2point:function (arr){
        var point=[];
        for (var x in arr[0])
        {
            point.push([arr[0][x].X/10000, arr[0][x].Y/10000]);
        }
        return point;
    },
    lngLat2point:function (arr){
        var point=[];
        for (var x in arr)
        {
            point.push([arr[x].lng/1, arr[x].lat/1]);
        }
        return point;
    }
};