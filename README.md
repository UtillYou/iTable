### 基于bootstrap,jQuery 的表格插件

#### 使用方式

* 引入代码库,开发时使用less和typescript，线上可使用css和js

``` html
<link rel="stylesheet/less" type="text/css" href="itable.less" />
<script src="./less.min.js"></script>
<script src="jquery.js" charset="utf-8"></script>
<script src="itable.js" charset="utf-8"></script>
```

* `html` 结构:

``` html
<div id="myTable" style="overflow:auto;">

    </div>
```

* JS 调用组件并传参：

``` javascript
var option = {
    tableId:'demoTable',
    data: data,
    columns: columns,
    freezeHead: true,
    freezeColumn: true,
    getUniqueId: function (rowData) {
      return rowData.id;
    },
    width: 1500,
    handleTdClick:function(rowId,cellIndex ,td){
      console.log(rowId);
      
    }
  };
var itable = $('#myTable').itable(option);
itable.render();
```
返回的实例可继续调用方法

* 预览

![预览](./capture.png?raw=true '预览')

用服务器打开 index.html 可以看到综合示例

#### 配置项 option

名称|类型|必填|含义
---|:--:|---:|---
tableId|string|yes|创建表格后给表格的ID，如果是固定列的情况，会存在左右两个表格，id为 tableIdleft 和 tableIdright
name|string|no|插件内部用来区分左右表格，在固定列的情况出现
data|array|yes|数据项数组，数据项为一个对象，每个字段对应一个单元格
columns|array|yes|列定义，详细见下方列定义
freezeHead|boolean|no|是否冻结头部,默认false
freezeColumn|boolean|no|是否冻结列，如果在columns中有列为冻结列，那么需要明确指定为true，默认false
width|number|no|表格容器的宽度，表格的宽度始终是100%,如果有指定本属性，则应用到容器上,否则容器也是100%
getUniqueId|string或function|no|返回一行的唯一标识,如果是字符串，则代表该行的唯一列名称，比如指定 "id"，则改行的 "id" 列的数据作为唯一标识,如果是函数，则函数的返回值作为唯一标识，每行都会运行这个函数,如果不指定，使用系统默认函数，默认函数为该行的所有Value 的字符串拼接
handleScroll|function|no|处理滚动事件,(scrollValue: number) => void
handleEnter|function|no|处理鼠标悬浮事件，确定当前左右表格哪个是活动表格,(name: string) => void
handleSort|function|no|处理排序事件,(sortColumnIndex: number, sortDirection: 'ascend'\|'descend') => void
handleTdHover|function|no|处理鼠标悬浮td事件,(rowIndex: number, cellIndex: number, td?:JQuery<Node[]>) => void
handleTdClick|function|no|处理鼠标点击td事件,(rowId: string, cellIndex: number ,td?:JQuery<Node[]>) => void
handleTdDblClick|function|no|(rowId: string, cellIndex: number, td?:JQuery<Node[]>) => void


##### columns 列定义

名称|类型|必填|含义
---|:--:|---:|---
title|string|yes|标题
name|string|yes|字段名称，根据这个到data中取值
isFrozen|boolean|no|是否冻结
resizable|boolean|no|是否可伸缩
isSequence|boolean|no|是否序号列,如果有其他冻结列，序号列也必须为冻结列
sorter|boolean\|function|no|是否排序，或者指定排序函数,(a: Value, b: Value) => number
sortDirections|array|no|排序顺序，升降序,'ascend' 和'descend'的数组
defaultSortOrder|string|no|默认按 'ascend' 还是 'descend' 排序
width|number\|string|no|宽度，数值代表像素，字符串代表百分比
maxWidth|number|no|最大宽度
minWidth|number|no|最小宽度
render|function|no|渲染函数,默认调用 toString() 显示

##### 方法
名称|定义|含义
---|---|---
setOption|(optionsParam: Options, $this?: JQuery)=>void|设置配置项
getOption|()=>Options|获取配置项
getState|()=>State|获取内部状态
updateOptionData|(row:Row)=>void|更新一行option data,同时更新option data,根据 id 查找需要更新的数据, 同时更新dom渲染，是更新，不是 重绘，也就是不会调用 render 方法
replaceOptionData|(data: Array<Row>) => void|替换option data,同时替换state data
appendOptionData|(row: Row) => void|向option data 末尾添加一条数据,触发重新渲染,同时更新state data
appendOptionData|(row: Row) => void|向option data 末尾添加一条数据,触发重新渲染,同时更新state data
prependOptionData|(row: Row) => void|向option data 头部添加一条数据,触发重新渲染,同时更新state data
deleteOptionData|(id:string)=>void|删除一行，触发重新渲染,并同时删除options和state中的数据
setActiveRow|(id:string)=>void|设置活跃行,活跃行背景蓝色
setLockedRow|(id:string)=>void|设置锁定行，锁定行背景黄色，并置顶
updateStateData|(data: Array<Row>) => void|更新state data,目前可能由排序触发，未来也许会添加筛选功能，也能触发
render|() => void|渲染表格数据
destory|(withChild:boolean) => void|销毁dom内容，引用