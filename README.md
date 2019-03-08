### 高性能的下拉框，ie最高5万选择项，chrome 50万。滚动流畅，页面可放任意多个下拉框，支持模糊搜索

#### 使用方式

* 引入代码库,开发时使用less和typescript，线上可使用css和js

``` html
<link rel="stylesheet/less" type="text/css" href="dropdown.less" />
<script src="./less.min.js"></script>
<script src="jquery.js" charset="utf-8"></script>
<script src="dropdown.js" charset="utf-8"></script>
```

* `html` 结构:

``` html
<input type="text" >
```

* JS 调用组件并传参：

``` javascript
var arr=[];
    for (var i = 0; i < 1000000; i++) {
      arr.push({
        name:'俺是第'+i.toString()+'项',
        value:i.toString()
      }) 
    }
    $('input').dropdown({
      data:arr,
      pageCount:50
    });
```
返回的实例可继续调用方法

* 预览

![预览](./capture.png?raw=true '预览')
