/// <reference path="iComponent.ts"/>

/**
 * 表格基类，实现基本的渲染和伸缩列
 */
class ITable extends IBaseComponent implements IComponentInterface {
  static arrowClass: string = 'i-arrow';
  static resizeClass: string = 'i-table-resizable';
  static sortHandleClass: string = 'i-table-sort-handle';
  static sortOnClass: string = 'on';
  static sortOffClass: string = 'off';
  static resizeHandleClass: string = 'i-table-resizable-handle';
  static rootTmpl: string = '<div class="i-root-container"></div>';
  static containerTmpl: string = '<div class="i-table-container"></div>';
  static outerTmpl: string = '<div class="i-table-outer"></div>';
  static innerTmpl: string = '<div class="i-table-inner"></div>';
  static tableTmpl: string = '<table class="table table-striped table-bordered i-table"></table>';
  static colgroupTmpl: string = '<colgroup></colgroup>';
  static colTmpl: string = '<col></col>';
  static theadTmpl: string = '<thead></thead>';
  static trTmpl: string = '<tr></tr>';
  static thTmpl: string = '<th></th>';
  static tbodyTmpl: string = '<tbody></tbody>';
  static tdTmpl: string = '<td></td>';
  static resizeHandleTmpl: string = `<span class="${ITable.resizeHandleClass}"></span>`;
  static upTmpl: string = `<i class="${ITable.sortHandleClass} up">
  <svg viewBox="0 0 1024 1024"  width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg>
  </i>`;
  static downTmpl: string = `<i class="${ITable.sortHandleClass} down">
  <svg viewBox="0 0 1024 1024"  width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg>
  </i>`;

  options: Options;
  state: State;

  constructor($this: JQuery, optionsParam: Options) {
    super();
    this.setOption(optionsParam, $this);
  }

  /**
   * 设置选项
   * @param optionsParam 选项
   * @param $this 原容器
   */
  setOption(optionsParam: Options, $this?: JQuery) {
    this.destory();
    const defaults = {
      name: 'table',
    };
    const options = $.extend(defaults, optionsParam);

    const [currentSortColumnIndex, currentSortDirection] = this.packageColumn(options.columns);

    this.options = options;
    this.state = {
      width: null,
      height: null,
      isResizing: false,
      data: this.options.handleSort ? this.buildStateData(options.data) : this.buildStateData(options.data, currentSortColumnIndex, currentSortDirection),
      currentSortColumnIndex,
      currentSortDirection
    };


    this.initHtml($this);
    // 绑定事件
    this.bindEvent();
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
    const options = this.options;
    const width = $this.width();
    const height = $this.height();

    const $root = this.buildDom(ITable.rootTmpl);
    const $container = this.buildDom(ITable.containerTmpl);
    const $outer = this.buildDom(ITable.outerTmpl);
    const $inner = this.buildDom(ITable.innerTmpl);
    const $table = this.buildDom(ITable.tableTmpl);
    const $colgroup = this.buildDom(ITable.colgroupTmpl);
    const $thead = this.buildDom(ITable.theadTmpl);
    const $tbody = this.buildDom(ITable.tbodyTmpl);

    this.state.height = height;
    this.state.width = width;
    this.state.$dom = {
      $origin: $this,
      $root: $root,
      $container: $container,
      $inner: $inner,
      $table: $table,
      $colgroup: $colgroup,
      $thead: $thead,
      $tbody: $tbody,
    }

    if (typeof options.width === 'number') {
      $container.css('width', `${options.width}px`)
    }

    $this.empty();
    $this.append($root.get(0));
    $root.append($container.get(0));
    $container.append($outer.get(0));
    $outer.append($inner.get(0));
    $inner.append($table.get(0));
    $table.append($colgroup.get(0)).append($thead.get(0)).append($tbody.get(0));

    // 根据列定义构建表头
    const $theadTr = this.buildDom(ITable.trTmpl);
    $thead.append($theadTr.get(0));
    for (let i = 0; i < options.columns.length; i++) {
      const column = options.columns[i];
      const $col = this.buildCol(column, i);
      const $th = this.buildTh(column, i);

      $colgroup.append($col.get(0));
      $theadTr.append($th.get(0));
    }
  }

  /**
   * 绑定事件
   */
  bindEvent() {
    this.state.$dom.$thead.on('mousedown', "." + ITable.resizeHandleClass, this.handleResizeMousedown.bind(this));
    this.state.$dom.$thead.on('click', "." + ITable.sortHandleClass, this.handleSortClick.bind(this));
    this.state.$dom.$tbody.on('mouseenter', 'tr', this.handleTdHover.bind(this));
    this.state.$dom.$tbody.on('click', 'td', this.handleTdClick.bind(this));
    this.state.$dom.$tbody.on('dblclick', 'td', this.handleTdDblClick.bind(this));
    this.state.$dom.$root.on('mouseenter', this.handleEnter.bind(this));
    $(document).on('mouseup', this.handleResizeMouseup.bind(this));
    this.state.$dom.$inner.on('scroll', this.handleScroll.bind(this));
  }

  /**
   * 构建 col
   * @param column 列定义
   * @param i 列所在的索引，目前主要是为了区分最后一列不需要伸缩功能
   */
  buildCol(column: Column, i: number): JQuery<JQuery.Node[]> {
    const $col = this.buildDom(ITable.colTmpl);
    // 计算宽度
    if (column.width !== undefined && column.width !== null && i < this.options.columns.length - 1) {
      let columnWidth = typeof column.width === 'number' ? column.width : this.parsePercent(column.width) * this.state.width;
      columnWidth = Math.floor(columnWidth);
      $col.css({
        'width': columnWidth.toString() + 'px',
        'minWidth': columnWidth.toString() + 'px',
      });
    }
    return $col;
  }

  /**
   * 构建 th
   * @param column 列定义
   * @param i 列所在的索引，目前主要是为了区分最后一列不需要伸缩功能
   */
  buildTh(column: Column, i: number): JQuery<JQuery.Node[]> {
    const $th = this.buildDom(ITable.thTmpl);
    $th.html(column.title);

    // 添加排序元素
    if (column.sorter) {
      // 升序
      if (column.sortDirections.indexOf(SortDirection.ASCEND) > -1) {
        const $ascend = this.buildDom(ITable.upTmpl);
        if (column.defaultSortOrder === SortDirection.ASCEND) {
          $ascend.addClass(ITable.sortOnClass);
        } else {
          $ascend.addClass(ITable.sortOffClass);
        }
        $th.append($ascend.get(0));
      }
      // 降序
      if (column.sortDirections.indexOf(SortDirection.DESCEND) > -1) {
        const $descend = this.buildDom(ITable.downTmpl);
        if (column.defaultSortOrder === SortDirection.DESCEND) {
          $descend.addClass(ITable.sortOnClass);
        } else {
          $descend.addClass(ITable.sortOffClass);
        }
        $th.append($descend.get(0));
      }
    }

    // 添加伸缩元素
    if (column.resizable === true && i < this.options.columns.length - 1) {
      $th.addClass(ITable.resizeClass).append($.parseHTML(ITable.resizeHandleTmpl));
    }

    return $th;
  }

  /**
   * 获取需要伸缩的列的 jQuery dom 列表
   */
  getResizeDom(): Array<JQuery<Node[]>> {
    return [this.state.$dom.$resizingDom];
  }

  /**
   * 处理排序小箭头点击事件
   * @param event 鼠标点击事件
   */
  handleSortClick(event: JQuery.ClickEvent) {
    const $target = $(event.target);
    const $i = $target.closest('i');
    const $th = $target.closest('th');
    const index = $th.index();
    const direction = $i.hasClass('up') ? SortDirection.ASCEND : SortDirection.DESCEND;
    // 点击自己
    if (this.state.currentSortColumnIndex === index && this.state.currentSortDirection === direction) {
      this.state.currentSortColumnIndex = undefined;
      this.state.currentSortDirection = undefined;
      $i.removeClass(ITable.sortOnClass).addClass(ITable.sortOffClass);
    } else {
      // 点击别个
      const $lastI = $th.closest('tr')
        .find(`th:eq(${this.state.currentSortColumnIndex})`)
        .find(`i.${this.state.currentSortDirection === SortDirection.ASCEND ? 'up' : 'down'}`);

      this.state.currentSortColumnIndex = index;
      this.state.currentSortDirection = direction;

      $i.removeClass(ITable.sortOffClass).addClass(ITable.sortOnClass);
      $lastI.removeClass(ITable.sortOnClass).addClass(ITable.sortOffClass);
    }
    // 构建state数据，如果options中有handleSort 触发handleSort，排序和更新state工作由父级管控
    if (typeof this.options.handleSort === 'function') {
      this.options.handleSort(this.state.currentSortColumnIndex, this.state.currentSortDirection)
    } else {
      this.updateStateData(this.buildStateData(this.options.data));
    }
  }

  /**
   * 处理表头伸缩列控件鼠标按下事件
   * @param event 鼠标按下事件
   */
  handleResizeMousedown(event: JQuery.MouseDownEvent) {
    this.state.isResizing = true;
    this.state.resizePrevPageX = event.pageX;

    // 查找对应的col
    const $parent = $(event.target).parent();
    const index = $parent.index();
    const $col = $parent.closest('table').find(`colgroup>col:eq(${index})`);
    this.state.$dom.$resizingDom = $col;

    this.state.documentMouseMoveHandler = this.handleResizeMousemove.bind(this);
    $(document).on('mousemove', this.state.documentMouseMoveHandler);
  }

  /**
   * 处理表头伸缩列控件鼠标移动事件
   * @param event 鼠标移动事件
   */
  handleResizeMousemove(event: JQuery.MouseMoveEvent) {
    if (this.state.isResizing === true) {
      const delta = event.pageX - this.state.resizePrevPageX;
      let width = this.state.$dom.$resizingDom.outerWidth();
      width = Math.floor(width + delta);
      this.state.resizePrevPageX = event.pageX;
      this.getResizeDom().forEach(($dom) => {
        $dom.css({
          'width': width.toString() + 'px',
          'minWidth': width.toString() + 'px',
        });
      });
    }
  }

  /**
   * 处理表头伸缩列鼠标抬起事件
   * @param event 鼠标抬起事件
   */
  handleResizeMouseup(event: JQuery.MouseUpEvent) {

    if (this.state.isResizing) {
      $(document).off('mousemove', this.state.documentMouseMoveHandler);
      this.state.isResizing = false;
      this.state.$dom.$resizingDom = undefined;
    }
  }

  /**
   * 处理表格滚动事件
   * @param event 表格滚动事件
   */
  handleScroll(event: JQuery.ScrollEvent) {
    if (typeof this.options.handleScroll === 'function') {
      this.options.handleScroll($(event.target).scrollTop())
    }
  }

  /**
   * 处理鼠标进入事件
   * @param event 鼠标进入事件
   */
  handleEnter(event: JQuery.MouseEnterEvent) {
    if (typeof this.options.handleEnter === 'function') {
      this.options.handleEnter(this.options.name)
    }
  }

  /**
   * 处理鼠标悬浮单元格事件
   * @param event 鼠标悬浮事件
   */
  handleTdHover(event: JQuery.MouseOverEvent) {
    const $td = $(event.target);
    const $tr = $td.closest('tr');
    const rowIndex = $tr.index();
    const cellIndex = $td.index();

    if (typeof this.options.handleTdHover === 'function') {
      this.options.handleTdHover(rowIndex, cellIndex);
    }

    this.handleTdHoverDomOpe(rowIndex, cellIndex);
  }

  /**
   * 处理鼠标悬浮单元格的dom操作
   * @param rowIndex 行索引
   * @param cellIndex 单元格索引，列索引
   */
  handleTdHoverDomOpe(rowIndex: number, cellIndex: number) {
    if (typeof this.state.lastHoverRowIndex !== 'undefined') {
      if (this.state.lastHoverRowIndex === rowIndex) {
        return;
      }
      this.state.$dom.$tbody.find(`tr:eq(${this.state.lastHoverRowIndex})`).removeClass('hover');
    }
    if (typeof rowIndex !== 'undefined') {
      const $tr = this.state.$dom.$tbody.find(`tr:eq(${rowIndex})`);
      $tr.addClass('hover');
    }

    this.state.lastHoverRowIndex = rowIndex;
    this.state.lastHoverCellIndex = cellIndex;
  }

  /**
   * 处理鼠标点击单元格事件
   * @param event 鼠标点击事件
   */
  handleTdClick(event: JQuery.ClickEvent) {
    const $td = $(event.target);
    const $tr = $td.closest('tr');
    let rowId = $tr.data('id');
    if (typeof rowId !== 'undefined') {
      rowId = rowId.toString();
    }
    const cellIndex = $td.index();

    if (typeof this.options.handleTdClick === 'function') {
      if (this.state.lastClickRowId === rowId) {
        this.options.handleTdClick(undefined, undefined);
      } else {
        this.options.handleTdClick(rowId, cellIndex);
      }
    }

    this.handleTdClickDomOpe(rowId, cellIndex);
  }

  /**
   * 处理鼠标点击单元格的dom操作
   * @param rowId 行id
   * @param cellIndex 单元格索引，列索引
   */
  handleTdClickDomOpe(rowId: string, cellIndex: number) {
    if (this.state.lastClickRowId !== undefined) {
      this.state.$dom.$tbody.find(`tr[data-id="${this.state.lastClickRowId}"]`).removeClass('active');
    }
    if (this.state.lastClickRowId === rowId || rowId === undefined) {
      this.state.lastClickRowId = undefined;
      this.state.lastClickCellIndex = undefined;
    } else {
      this.state.lastClickRowId = rowId;
      this.state.lastClickCellIndex = cellIndex;
      this.state.$dom.$tbody.find(`tr[data-id="${rowId}"]`).addClass('active');
    }

    // 取消双击固定行
    if (this.state.lastLockedRowId !== undefined && this.state.lastLockedRowId === rowId) {
      this.handleTdDblClickDomOpe(undefined, undefined);
      if (typeof this.options.handleTdDblClick === 'function') {
        this.options.handleTdDblClick(undefined, undefined);
      }
    }
  }

  /**
   * 处理鼠标双击单元格事件
   * @param event 鼠标双击事件
   */
  handleTdDblClick(event: JQuery.DoubleClickEvent) {
    const $td = $(event.target);
    const $tr = $td.closest('tr');
    let rowId = $tr.data('id');
    if (typeof rowId !== 'undefined') {
      rowId = rowId.toString();
    }
    const cellIndex = $td.index();

    if (this.state.lastLockedRowId !== rowId) {
      if (typeof this.options.handleTdDblClick === 'function') {
        this.options.handleTdDblClick(rowId, cellIndex);
      }
    }
    this.handleTdDblClickDomOpe(rowId, cellIndex);
  }

  /**
   * 处理鼠标双击单元格的dom操作
   * @param rowId 行索引
   * @param _cellIndex 单元格索引，列索引
   */
  handleTdDblClickDomOpe(rowId: string, _cellIndex: number) {
    if (this.state.lastLockedRowId === rowId || rowId === undefined) {
      this.state.lastLockedRowId = undefined;
    } else {
      this.state.lastLockedRowId = rowId;
      const rowData = this.findRow(this.state.data, this.options, rowId);
      if (rowData !== null) {
        const [row, index] = rowData;
        this.state.data.splice(index, 1);
        this.state.data.splice(0, 0, row);
      }
    }
    this.render();
    this.updateScrollTop(0);
  }

  /**
   * 设置 inner scrollTop
   * @param scrollTop scroll top值
   */
  updateScrollTop(scrollTop: number) {
    this.state.$dom.$inner.scrollTop(scrollTop);
  }

  /**
   * 渲染表格数据
   */
  render() {
    const columns = this.options.columns;
    const data = this.state.data;

    this.state.$dom.$tbody.empty();
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowId = this.getRowId(row, this.options, i);

      const $tr = this.buildDom(ITable.trTmpl);
      $tr.attr('data-id', rowId);
      if (rowId === this.state.lastClickRowId) {
        $tr.addClass('active');
      }
      if (rowId === this.state.lastLockedRowId) {
        $tr.addClass('locked');
      }

      this.state.$dom.$tbody.append($tr.get(0));
      for (let j = 0; j < columns.length; j++) {
        const value = row[columns[j].name];
        const $td = this.buildDom(ITable.tdTmpl);
        $td.html(columns[j].render(value, i, j, row));
        $tr.append($td.get(0));
      }
    }
  }

  /**
   * 更新state排序相关信息
   * @param sortColumnIndex 排序列索引
   * @param sortDirection 排序列方向
   */
  updateStateSort(sortColumnIndex: number, sortDirection: SortDirection): void {
    // 点击自己
    if (this.state.currentSortColumnIndex !== undefined && sortColumnIndex === undefined) {
      const $lastI = this.state.$dom.$thead.find('tr')
        .find(`th:eq(${this.state.currentSortColumnIndex})`)
        .find(`i.${this.state.currentSortDirection === SortDirection.ASCEND ? 'up' : 'down'}`);

      $lastI.removeClass(ITable.sortOnClass).addClass(ITable.sortOffClass);

      this.state.currentSortColumnIndex = undefined;
      this.state.currentSortDirection = undefined;
    }
  }

  /**
   * 更新state中的data
   * 渲染表格
   * @param data 用于更新 state data 的 data
   */
  updateStateData(data: Array<Row>): void {
    this.state.lastLockedRowId = undefined;
    if (!this.options.handleSort) {
      this.state.data = this.buildStateData(data, this.state.currentSortColumnIndex, this.state.currentSortDirection);
    } else {
      this.state.data = data;
    }

    this.render();
  }


  /**
   * 更新state中的data
   * @param data 用于更新 state data 的 data
   */
  updateOptionData(data: Array<Row>) :void{
    this.options.data = data;
    this.updateStateData(data);
  }

  /**
   * 向option的末尾添加数据，同时更新state data
   * @param row 要添加的行数据
   */
  appendOptionData(row: Row) :void{
    this.options.data.push(row);
    this.state.data.push(row);
    this.render();
  }

  /**
   * 向option的头部添加数据，同时更新state data
   * @param row 要添加的行数据
   */
  prependOptionData(row: Row):void {
    this.options.data.splice(0, 0, row);
    this.state.data.splice(0, 0, row);
    this.render();
  }

  /**
   * 设置活跃行，就是选中行
   * @param id 行唯一标识 id
   */
  setActiveRow(id:string):void{
    this.handleTdClickDomOpe(id,0);
  }

  /**
   * 设置锁定行，置顶行
   * @param id 行唯一标识 id
   */
  setLockedRow(id:string):void{
    this.handleTdDblClickDomOpe(id,0);
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
   * 销毁dom内容，引用
   */
  destory() {
    if (this.state) {
      this.state.$dom.$origin.empty();
      this.state.$dom = undefined;
      this.state = undefined;
    }
    if (this.options) {
      this.options = undefined;
    }

  }
}

