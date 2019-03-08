enum SortDirection {
  /**
   * 升序
   */
  ASCEND = 'ascend',
  /**
   * 降序
   */
  DESCEND = 'descend'
}
/**
 * 传入的配置
 */
interface Options {
  /**
   * 名称，目前用于区分左右表格
   */
  name: string;
  /**
   * 数据
   */
  data: Array<Row>;
  /**
   * 列定义
   */
  columns: Array<Column>;
  /**
   * 是否冻结表头
   */
  freezeHead: boolean;
  /**
   * 是否冻结列
   */
  freezeColumn: boolean;
  /**
   * 表格容器的宽度，表格的宽度始终是100%
   * 如果有指定本属性，则引用到容器上
   * 否则容器也是100%
   */
  width?: number;
  /**
   * 返回一行的唯一标识
   * 如果是字符串，则代表该行的唯一列名称，比如指定 "id"，则改行的 "id" 列的数据作为唯一标识
   * 如果是函数，则函数的返回值作为唯一标识，每行都会运行这个函数
   * 如果不指定，使用系统默认函数，默认函数为该行的所有Value 的字符串拼接
   */
  getUniqueId?:string | ((rowData: Row, rowIndex?: number) => Value);
  /**
   * 处理滚动事件
   */
  handleScroll?: (scrollValue: number) => void;
  /**
   * 处理鼠标悬浮事件，确定当前左右表格哪个是活动表格
   */
  handleEnter?: (name: string) => void;
  /**
   * 处理排序事件
   */
  handleSort?: (sortColumnIndex: number, sortDirection: SortDirection) => void;
  /**
   * 处理鼠标悬浮td事件
   */
  handleTdHover?: (rowIndex: number, cellIndex: number) => void;
  /**
   * 处理鼠标点击td事件
   */
  handleTdClick?: (rowId: string, cellIndex: number) => void;
  /**
   * 处理鼠标双击td事件
   */
  handleTdDblClick?: (rowId: string, cellIndex: number) => void;
}
/**
 * state 中存储的dom引用，jQuery 封装
 */
interface StateDom {
  /**
   * 原始dom引用
   */
  $origin: JQuery<HTMLElement>;
  /**
   * 根容器引用，包含 container
   * 对于固定表头的表格，则包含 headContainer 和 contentContainer
   */
  $root: JQuery<Node[]>;
  /**
   * 容器
   */
  $container: JQuery<Node[]>;
  /**
   * inner引用, 负责处理滚动
   */
  $inner: JQuery<Node[]>;
  /**
   * 表格引用
   */
  $table: JQuery<Node[]>;
  /**
   * 列定义
   */
  $colgroup: JQuery<Node[]>;
  /**
   * 表头
   */
  $thead: JQuery<Node[]>;
  /**
   * body
   */
  $tbody: JQuery<Node[]>;
  /**
   * 正在伸缩的dom
   */
  $resizingDom?: JQuery<Node[]>;
}
/**
 * 内部状态
 */
interface State {
  /**
   * 原组件的宽度
   */
  width: number;
  /**
   * 原组件的高度
   */
  height: number;
  /**
   * 当前状态下的数据
   */
  data: Array<Row>;
  /**
   * 是否正在伸缩列宽
   */
  isResizing: boolean;
  /**
   * 当前锁定的行的id数组
   */
  lastLockedRowId?:string;
  /**
   * 伸缩上一次鼠标的横坐标
   */
  resizePrevPageX?: number;
  /**
   * 当前排序列索引
   */
  currentSortColumnIndex?: number;
  /**
   * 当前排序列顺序
   */
  currentSortDirection?: SortDirection;
  /**
   * 上一次鼠标悬浮的tr索引
   */
  lastHoverRowIndex?: number;
  /**
   * 上一次鼠标悬浮的单元格索引
   */
  lastHoverCellIndex?: number;
  /**
   * 上一次鼠标点击的tr id
   */
  lastClickRowId?: string;
  /**
   * 上一次鼠标点击的单元格索引
   */
  lastClickCellIndex?: number;
  /**
   * dom 引用
   */
  $dom?: StateDom;
  /**
   * 鼠标移动事件句柄
   */
  documentMouseMoveHandler?: (event: JQuery.MouseMoveEvent) => void;
}


/**
 * 列接口
 */
interface Column {
  /**
   * 标题
   */
  title: string;
  /**
   * 字段名称，根据这个到data中取值
   */
  name: string;
  /**
   * 是否冻结
   */
  isFrozen?: boolean;
  /**
   * 是否可伸缩
   */
  resizable?: boolean;
  /**
   * 是否序号列
   * 如果有其他冻结列，序号列也必须为冻结列
   */
  isSequence?: boolean;
  /**
   * 是否排序，或者指定排序函数
   */
  sorter?: boolean | ((a: Value, b: Value) => number);
  /**
   * 排序顺序，升降序
   */
  sortDirections?: [SortDirection];
  /**
   * 默认排序顺序
   */
  defaultSortOrder?: SortDirection;
  /**
   * 宽度
   */
  width?: number | string;
  /**
   * 渲染函数
   */
  render?: (data: Value, rowIndex?: number, columnIndex?: number, row?: Row) => string;
}
/**
 * 字段值类型
 */
type Value = string | number | boolean | null;
/**
 * 数据接口
 */
interface Row  {
  [key: string]: Value
}

/**
 * 所有组件的基本接口
 */
interface IComponentInterface {
  /**
   * 用户传入的选项,跟默认参数混合后的结果
   */
  options: Options;

  /**
   * 内部状态
   */
  state: State;

  /**
   * 初始化HTML，将原始的元素内容删除，构建插件HTML
   */
  initHtml: ($this: JQuery<HTMLElement>) => void;

  /**
   * 构建state data
   * 目前包含排序操作，未来也许会添加筛选功能
   */
  buildStateData: (data: Array<Row>, sortColumnIndex?: number, sortDirection?: SortDirection) => Array<Row>;

  /**
   * 更新state data
   * 目前可能由排序触发，未来也许会添加筛选功能，也能触发
   */
  updateStateData: (data: Array<Row>) => void;

  /**
   * 渲染表格数据
   */
  render: () => void;

  /**
   * 销毁dom内容，引用
   */
  destory: () => void;
}