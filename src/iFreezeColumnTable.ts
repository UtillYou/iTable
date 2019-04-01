/**
 * 可冻结列的表格
 * 实际上由两个表格组成
 * 列定义和传入的数据都会被拆分成两个传入两个子表中
 */
class IFreezeColumnTable extends IBaseComponent implements IComponentInterface {
  static leftShadowClass: string = 'i-table-scroll-middle';
  static rowTmpl: string = '<div class="i-row"></div>';
  static leftTmpl: string = '<div class="i-left"></div>';
  static rightTmpl: string = '<div class="i-right"></div>';

  options: Options;
  state: State;

  /**
   * 左侧表格的option
   */
  leftOptions: Options;

  /**
   * 右侧表格的option
   */
  rightOptions: Options;

  /**
   * 左侧表格
   */
  leftTable: ITable;

  /**
   * 右侧表格
   */
  rightTable: ITable;

  /**
   * 当前活跃表格名称
   */
  activeTableName: string;

  /**
   * 是否已经给左侧表格容器添加阴影样式
   */
  attachedClass2LeftTable: boolean;

  /**
   * 左侧容器引用,jQuery封装
   */
  $left: JQuery<JQuery.Node[]>;

  constructor($this: JQuery, optionsParam: Options) {
    super();
    this.setOption(optionsParam, $this);
  }

  /**
   * 设置选项
   * @param optionsParam 选项
   * @param $this 原容器
   */
  setOption(optionsParam: Options, $this?: JQuery):void {
    const $thisRef = $this === undefined ? this.state.$dom.$origin : $this;
    this.destory(false);
    const defaults = {
      name: 'freezeColumnTable',
      cancelActiveRow:false,
    };
    const options = $.extend(defaults, optionsParam);
    this.options = options;

    const [currentSortColumnIndex, currentSortDirection] = this.packageColumn(options.columns);
    const [leftColumns, rightColumns] = this.splitColumns(options);

    let leftWidth = 0;
    let rightWidth = 0;
    leftColumns.forEach((element) => {
      leftWidth += typeof element.width === 'number' ? element.width : parseFloat(element.width);
    });

    rightColumns.forEach((element) => {
      rightWidth += typeof element.width === 'number' ? element.width : parseFloat(element.width);
    });

    const stateData = this.buildStateData(options.data, currentSortColumnIndex, currentSortDirection);

    const [leftData, rightData] = this.splitData(stateData, leftColumns, rightColumns);

    const leftOption = $.extend(false, {}, options);
    const rightOption = $.extend(false, {}, options);

    leftOption.name = 'left';
    leftOption.columns = leftColumns;
    leftOption.data = leftData;
    leftOption.width = leftWidth;
    leftOption.handleScroll = this.handleScrollTop.bind(this);
    leftOption.handleEnter = this.handleActiveTable.bind(this);
    leftOption.handleSort = this.handleSort.bind(this);
    leftOption.handleTdHover = this.handleTdHover.bind(this);
    leftOption.handleTdClick = this.handleTdClick.bind(this);
    leftOption.handleTdDblClick = this.handleTdDblClick.bind(this);

    rightOption.name = 'right';
    rightOption.columns = rightColumns;
    rightOption.data = rightData;
    rightOption.width = rightWidth;
    rightOption.handleScroll = this.handleScrollTop.bind(this);
    rightOption.handleEnter = this.handleActiveTable.bind(this);
    rightOption.handleSort = this.handleSort.bind(this);
    rightOption.handleTdHover = this.handleTdHover.bind(this);
    rightOption.handleTdClick = this.handleTdClick.bind(this);
    rightOption.handleTdDblClick = this.handleTdDblClick.bind(this);

    this.leftOptions = leftOption;
    this.rightOptions = rightOption;

    this.state = {
      width: null,
      height: null,
      isResizing: false,
      data: stateData,
    };

    this.initHtml($thisRef);
  }

  /**
   * 获取当前选项
   */
  getOption() {
    return this.options;
  }

  /**
   * 获取当前state，状态
   */
  getState() {
    return this.state;
  }

  /**
 * 初始化HTML，将原始的元素内容删除，构建插件HTML
 */
  initHtml($this: JQuery<HTMLElement>) {
    const width = $this.width();
    const height = $this.height();

    const $row = this.buildDom(IFreezeColumnTable.rowTmpl);
    const $left = this.buildDom(IFreezeColumnTable.leftTmpl);
    const $right = this.buildDom(IFreezeColumnTable.rightTmpl);

    this.state.height = height;
    this.state.width = width;

    this.state.$dom = {
      $origin: $this,
      $root: $row,
      $container: null,
      $inner: null,
      $table: null,
      $colgroup: null,
      $thead: null,
      $tbody: null,
    }

    this.$left = $left;
    $this.empty();
    $this.append($row.get(0));
    $row.append($left.get(0)).append($right.get(0));

    $left.css('width', `${this.leftOptions.width}px`);
    $right.css('paddingLeft', `${this.leftOptions.width}px`);

    this.leftTable = this.leftOptions.freezeHead ?
      new IFreezeHeadTable($this.find('.i-left'), this.leftOptions)
      : new ITable($this.find('.i-left'), this.leftOptions);

    this.rightTable = this.rightOptions.freezeHead ?
      new IFreezeHeadTable($this.find('.i-right'), this.rightOptions)
      : new ITable($this.find('.i-right'), this.rightOptions);

    // 绑定事件
    $right.on('scroll', this.handleScrollRight.bind(this));
    $row.on('mouseleave', this.handleTableLeave.bind(this));
  }

  /**
   * 将原始列定义依据左右表格拆分成两个数组
   * @param options 传入的选项
   */
  splitColumns(options: Options): [Column[], Column[]] {
    const leftColumns: Array<Column> = [];

    const rightColumns: Array<Column> = [];
    for (let i = 0; i < options.columns.length; i++) {
      const element = options.columns[i];
      if (element.isFrozen) {
        leftColumns.push(element);
      } else {
        rightColumns.push(element);
      }
    }

    return [leftColumns, rightColumns];
  }

  /**
   * 将原始数据依据左右表格拆分成两个数组
   * @param data 原始数据
   * @param leftColumns 左侧表格列
   * @param rightColumns 右侧表格列
   */
  splitData(data: Array<Row>, leftColumns: Column[], rightColumns: Column[]): [Row[], Row[]] {
    const leftData = [];
    const rightData = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      leftData.push(row);
      rightData.push(row);
    }

    return [leftData, rightData];
  }

  /**
   * 获取真正的单元格索引
   * 如果点击左侧表格就直接返回，右侧表格则加上左侧列个数
   * @param cellIndex 单元格索引
   */
  getRealCellIndex(cellIndex: number): number {
    if (this.activeTableName === 'left') {
      return cellIndex;
    }
    return this.leftOptions.columns.length + cellIndex;
  }

  /**
   * 
   * @param row 需要更新的行，采取差异更新的方案，row中包含的字段才更新，根据id查找需要更新的行
   */
  updateOptionData(row: Row): void {
    const rowId = this.getRowId(row, this.options);
    const optionRowData = this.findRow(this.options.data, this.options, rowId);
    if (optionRowData===null) {
      console.log('not find:',row);
      return;
    }
    const optionRow = optionRowData[0];
    const [stateRow, i] = this.findRow(this.state.data, this.options, rowId);
    const currentRowKeys = Object.keys(optionRow);

    for (let i = 0; i < currentRowKeys.length; i++) {
      const key = currentRowKeys[i];
      if (row[key] !== undefined) {
        optionRow[key] = row[key];
        stateRow[key] = row[key];
      }
    }
    this.leftTable.updateOptionData(row);
    this.rightTable.updateOptionData(row);
  }

  /**
   * 更新state中的data
   * @param data 用于更新 state data 的 data
   */
  replaceOptionData(data: Array<Row>): void {
    this.options.data = data;
    const [leftColumns, rightColumns] = this.splitColumns(this.options);
    const [leftData, rightData] = this.splitData(this.options.data, leftColumns, rightColumns);
    this.leftTable.replaceOptionData(leftData);
    this.rightTable.replaceOptionData(rightData);
  }

  /**
   * 向option的末尾添加数据，同时更新state data
   * @param row 要添加的行数据
   */
  appendOptionData(row: Row): void {
    this.options.data.push(row);
    this.state.data.push(row);
    this.leftTable.appendOptionData(row);
    this.rightTable.appendOptionData(row);
  }

  /**
   * 向option的头部添加数据，同时更新state data
   * @param row 要添加的行数据
   */
  prependOptionData(row: Row): void {
    this.options.data.splice(0, 0, row);
    this.state.data.splice(0, 0, row);
    this.leftTable.prependOptionData(row);
    this.rightTable.prependOptionData(row);
  }

  /**
   * 删除一行，不触发重新渲染，直接从table中移除
   * 并同时删除options和state中的数据
   * @param id 要删除的行id
   */
  deleteOptionData(id: string): void {
    if (this.state.lastClickRowId === id) {
      this.state.lastClickRowId = undefined;
    }
    if (this.state.lastLockedRowId === id) {
      this.state.lastLockedRowId = undefined;
    }
    const [, optionIndex] = this.findRow(this.options.data, this.options, id);
    this.options.data.splice(optionIndex, 1);
    const [, stateIndex] = this.findRow(this.state.data, this.options, id);
    this.state.data.splice(stateIndex, 1);
    this.leftTable.deleteOptionData(id);
    this.rightTable.deleteOptionData(id);
  }

  /**
   * 设置活跃行，就是选中行
   * @param id 行唯一标识 id
   */
  setActiveRow(id: string): void {
    if (this.state.lastClickRowId === id) {
      this.state.lastClickRowId = undefined;
    } else {
      this.state.lastClickRowId = id;
    }

    this.leftTable.setActiveRow(id);
    this.rightTable.setActiveRow(id);
  }

  /**
   * 设置锁定行，置顶行
   * @param id 行唯一标识 id
   */
  setLockedRow(id: string): void {
    if (this.state.lastLockedRowId === id) {
      this.state.lastLockedRowId = undefined;
    } else {
      this.state.lastLockedRowId = id;
    }
    this.leftTable.setLockedRow(id);
    this.rightTable.setLockedRow(id);
  }

  /**
   * 更新state中的data
   * @param data 用于更新 state data 的 data
   */
  updateStateData(data: Array<Row>): void {
    this.state.data = this.buildStateData(data, this.state.currentSortColumnIndex, this.state.currentSortDirection);
    const [leftColumns, rightColumns] = this.splitColumns(this.options);
    const [leftData, rightData] = this.splitData(this.state.data, leftColumns, rightColumns);
    this.leftTable.updateStateData(leftData);
    this.rightTable.updateStateData(rightData);
  }

  /**
  * 构建state中的data
  * @param data 源数据，一般是option中的data
  * @param sortColumnIndex 可选，排序列索引
  * @param sortDirection 可选，排序列方向
  */
  buildStateData(data: Array<Row>, sortColumnIndex?: number, sortDirection?: SortDirection): Array<Row> {
    // 浅复制源数组
    let finalData = this.shadowCopyArray<Row>(data);
    // 排序
    finalData = this.sortData(finalData, this.options.columns, sortColumnIndex, sortDirection);

    return finalData;
  }

  /**
   * 处理表格的排序事件
   * 更新左右侧表格的state data
   * 参数可能为undefined，在取消排序的情况出现
   * @param sortColumnIndex 排序列索引
   * @param sortDirection 排序列方向
   */
  handleSort(sortColumnIndex: number, sortDirection: SortDirection): void {
    const data = this.options.data;
    const [leftColumns, rightColumns] = this.splitColumns(this.options);

    // 浅复制data
    let finalData = this.shadowCopyArray(data);

    // 根据当前活跃表格名称确定应该应用那个索引和表格列定义
    let index = undefined;
    if (sortColumnIndex !== undefined) {
      index = this.activeTableName === 'left' ? sortColumnIndex : leftColumns.length + sortColumnIndex;
    }

    // 排序
    finalData = this.sortData(finalData, this.options.columns, index, sortDirection);

    // 拆分data
    const [leftData, rightData] = this.splitData(finalData, leftColumns, rightColumns);

    this.state.currentSortColumnIndex = index;
    this.state.currentSortDirection = sortDirection;

    if (this.activeTableName === 'left') {
      this.rightTable.updateStateSort(undefined, undefined);
    } else {
      this.leftTable.updateStateSort(undefined, undefined);
    }
    this.leftTable.updateStateData(leftData);
    this.rightTable.updateStateData(rightData);

    if (typeof this.options.handleSort === 'function') {
      this.options.handleSort(sortColumnIndex, sortDirection);
    }
  }

  /**
   * 同步鼠标点击单元格
   * @param rowId 行id
   * @param cellIndex 单元格索引，列索引
   * @param $td 触发点击的单元格
   */
  handleTdClick(rowId: string, cellIndex: number, $td?: JQuery<Node[]>): void {
    if (this.options.clickMeansActive) {
      if (!(this.state.lastClickRowId === rowId && !this.options.cancelActiveRow)) {
        if (this.activeTableName === 'left') {
          this.rightTable.handleTdClickDomOpe(rowId, cellIndex);
        } else {
          this.leftTable.handleTdClickDomOpe(rowId, cellIndex);
        }
      }
      
    }
    if (typeof this.options.handleTdClick === 'function') {
      this.options.handleTdClick(rowId, this.getRealCellIndex(cellIndex),$td);
    }
    this.state.lastClickRowId = rowId;
  }

  /**
   * 同步鼠标双击单元格
   * @param rowId 行id
   * @param cellIndex 单元格索引，列索引
   * @param $td 触发双击的单元格
   */
  handleTdDblClick(rowId: string, cellIndex: number,$td?: JQuery<Node[]>): void {
    this.state.lastLockedRowId = rowId;
    if (this.options.dblClickMeansLock) {
      if (this.activeTableName === 'left') {
        this.rightTable.handleTdDblClickDomOpe(rowId, cellIndex);
      } else {
        this.leftTable.handleTdDblClickDomOpe(rowId, cellIndex);
      }
    }
    
    if (typeof this.options.handleTdDblClick === 'function') {
      this.options.handleTdDblClick(rowId, this.getRealCellIndex(cellIndex),$td);
    }
  }

  /**
   * 同步鼠标悬浮单元格
   * @param rowIndex 行索引
   * @param cellIndex 单元格索引，列索引
   * @param $td 触发事件的单元格
   */
  handleTdHover(rowIndex: number, cellIndex: number, $td: JQuery<Node[]>): void {
    if (this.activeTableName === 'left') {
      this.rightTable.handleTdHoverDomOpe(rowIndex, cellIndex);
    } else {
      this.leftTable.handleTdHoverDomOpe(rowIndex, cellIndex);
    }
    if (typeof this.options.handleTdHover === 'function') {
      this.options.handleTdHover(rowIndex, this.getRealCellIndex(cellIndex), $td);
    }
  }


  /**
   * 确定当前哪个表格是活跃表格
   * @param name table name
   */
  handleActiveTable(name: string) {
    this.activeTableName = name;
  }

  /**
   * 同步左右侧的表格的scroll top 值
   * @param scrollTop scroll top 值
   */
  handleScrollTop(scrollTop: number) {
    if (this.activeTableName === 'left') {
      this.rightTable.updateScrollTop(scrollTop);
    } else {
      this.leftTable.updateScrollTop(scrollTop);
    }
    if (typeof this.options.handleScroll === 'function') {
      this.options.handleScroll(scrollTop);
    }
  }

  /**
   * 处理鼠标离开表格事件
   * @param event 鼠标离开表格事件
   */
  handleTableLeave(event: JQuery.MouseLeaveEvent) {
    this.leftTable.handleTdHoverDomOpe(undefined, undefined);
    this.rightTable.handleTdHoverDomOpe(undefined, undefined);
  }

  /**
   * 处理右侧表格横向滚动事件
   * @param event 滚动事件
   */
  handleScrollRight(event: JQuery.ScrollEvent) {
    const scrollRight = $(event.target).scrollLeft();
    if (scrollRight > 0) {
      if (!this.attachedClass2LeftTable) {
        this.attachedClass2LeftTable = true;
        this.$left.addClass(IFreezeColumnTable.leftShadowClass);
      }
    } else {
      this.attachedClass2LeftTable = false;
      this.$left.removeClass(IFreezeColumnTable.leftShadowClass);
    }
  }

  /**
   * 渲染表格数据
   */
  render() {
    this.leftTable.render();
    this.rightTable.render();
  }

  /**
   * 获取当前数据条数
   */
  getDataLength(): number {
    if (!this.state || !this.state.data) {
      return 0;
    }
    return this.state.data.length;
  }

  /**
   * 销毁dom内容，引用
   * @param withChild 是销毁子组件的内容
   */
  destory(withChild: boolean) {
    if (this.state) {
      this.state.$dom.$origin.empty();
      this.state.$dom = undefined;
      this.state = undefined;
    }
    if (withChild === true && this.leftTable) {
      this.leftTable.destory();
      this.rightTable.destory();
      this.$left = undefined;
    }
    if (this.options) {
      this.options = undefined;
    }
  }
}