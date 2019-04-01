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
  static cellDivTmpl: string = '<div class="cell-div"></div>';
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
    const $thisRef = $this === undefined ? this.state.$dom.$origin : $this;
    this.destory();
    const defaults = {
      name: 'table',
      cancelActiveRow: false,
      clickMeansActive: false,
      dblClickMeansLock: false,
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


    this.initHtml($thisRef);
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

    $table.attr('id', options.tableId + options.name);
    if (typeof options.width === 'number') {
      $root.css('width', `${options.width}px`)
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
    this.state.$dom.$thead.on('dblclick', "." + ITable.resizeHandleClass, this.handleResizeDblClick.bind(this));
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
    const r = [this.state.$dom.$resizingDom];
    if (this.detectIE()) {
      const index = this.state.$dom.$resizingDom.index();
      const $th = this.state.$dom.$thead.find(`th:eq(${index.toString()})`);
      r.push($th);
    }

    return r;
  }

  /**
   * 双击图标自适应最大宽度，寻找这一列的最大宽度，但不能大于option中设置的最大宽度
   * 也不能小于option中设置的最小宽度
   * @param event 双击事件
   */
  handleResizeDblClick(event: JQuery.DoubleClickEvent) {
    // 查找对应的col
    const $parent = $(event.target).parent();
    const index = $parent.index();
    const $col = $parent.closest('table').find(`colgroup>col:eq(${index})`);
    this.state.$dom.$resizingDom = $col;

    const columnName = this.options.columns[index].name;
    const maxWidth = this.options.columns[index].maxWidth;
    const minWidth = this.options.columns[index].minWidth;

    let charLength = 0;
    for (let i = 0; i < this.state.data.length; i++) {
      const element = this.state.data[i];
      let elementLength = 0;
      const elementStr = this.options.columns[index].render(element[columnName], i, index, element);
      const elementCount = elementStr.length;
      // 计算字符个数，英文和数字算0.6个，其余的算1个
      for (let j = 0; j < elementCount; j++) {
        const c = elementStr[j];
        if (this.isAlphabet(c) || this.isNumber(c)) {
          elementLength += 0.6;
        } else {
          elementLength += 1;
        }
      }
      elementLength = Math.ceil(elementLength);

      if (elementLength > charLength) {
        charLength = elementLength;
      }
    }

    if (charLength > 0) {
      const $firstTd = this.state.$dom.$tbody.find('td:eq(0)');
      const defaultFontSize = 14;
      let actualFontSize = parseInt($firstTd.css('font-size'));
      actualFontSize = actualFontSize === null || isNaN(actualFontSize) ? defaultFontSize : actualFontSize;

      let padding = parseInt($firstTd.css('padding'));
      padding = padding === null || isNaN(padding) ? 4 : padding;

      let width = (charLength * actualFontSize) + (padding * 2);
      if (maxWidth !== undefined && maxWidth !== null) {
        width = Math.min(width, maxWidth);
      }
      if (minWidth !== undefined && minWidth !== null) {
        width = Math.max(width, minWidth);
      }
      const currentWidth = this.state.$dom.$resizingDom.outerWidth();
      const delta = width - currentWidth;

      let rootWidth = this.state.$dom.$root.outerWidth();
      rootWidth = Math.floor(rootWidth + delta);

      this.getResizeDom().forEach(($dom) => {
        $dom.css({
          'width': width.toString() + 'px',
          'minWidth': width.toString() + 'px',
        });
      });
      this.state.$dom.$root.css({
        'width': rootWidth.toString() + 'px',
      });
    }
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
      const index = this.state.$dom.$resizingDom.index();
      const minWidth = this.options.columns[index].minWidth;
      const maxWidth = this.options.columns[index].maxWidth;

      let delta = event.pageX - this.state.resizePrevPageX;
      let nowWidth = this.state.$dom.$resizingDom.outerWidth();
      let width = Math.floor(nowWidth + delta);

      if (minWidth !== undefined && minWidth !== null) {
        width = Math.max(width, minWidth);
        delta = width - nowWidth;
      }
      if (maxWidth !== undefined && maxWidth !== null) {
        width = Math.min(width, maxWidth);
        delta = width - nowWidth;
      }

      let rootWidth = this.state.$dom.$root.outerWidth();
      rootWidth = Math.floor(rootWidth + delta);

      this.state.resizePrevPageX = event.pageX;
      this.getResizeDom().forEach(($dom) => {
        $dom.css({
          'width': width.toString() + 'px',
          'minWidth': width.toString() + 'px',
        });
      });
      this.state.$dom.$root.css({
        'width': rootWidth.toString() + 'px',
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
    let $td = $(event.target);
    if ($td[0].tagName !== 'TD') {
      $td = $td.closest('td');
    }
    const $tr = $td.closest('tr');
    const rowIndex = $tr.index();
    const cellIndex = $td.index();

    if (typeof this.options.handleTdHover === 'function') {
      this.options.handleTdHover(rowIndex, cellIndex, $td);
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
    let $td = $(event.target);
    if ($td[0].tagName !== 'TD') {
      $td = $td.closest('td');
    }

    const $tr = $td.closest('tr');
    let rowId = $tr.data('id');
    if (typeof rowId !== 'undefined') {
      rowId = rowId.toString();
    }
    const cellIndex = $td.index();

    if (typeof this.options.handleTdClick === 'function') {
      // 如果点击的是同一行，并且用户不允许点击同行取消活跃行，不触发undefined参数
      if (this.state.lastClickRowId === rowId && this.options.cancelActiveRow) {
        this.options.handleTdClick(undefined, undefined, $td);
      } else {
        this.options.handleTdClick(rowId, cellIndex, $td);
      }
    }

    // 如果点击的是同一行，并且用户不允许点击同行取消活跃行，不进行剩余的dom操作
    if (this.state.lastClickRowId === rowId && !this.options.cancelActiveRow) {
      return;
    }
    if (!this.options.clickMeansActive) {
      return;
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
    // 上次单击或者双击的都要取消
    if (this.state.lastClickRowId === rowId || rowId === undefined || this.state.lastLockedRowId === rowId) {
      this.state.lastClickRowId = undefined;
      this.state.lastClickCellIndex = undefined;
    } else {
      this.state.lastClickRowId = rowId;
      this.state.lastClickCellIndex = cellIndex;
      this.state.$dom.$tbody.find(`tr[data-id="${rowId}"]`).addClass('active');
    }

    // 取消双击固定行
    if (this.state.lastLockedRowId !== undefined) {
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
    let $td = $(event.target);
    if ($td[0].tagName !== 'TD') {
      $td = $td.closest('td');
    }
    const $tr = $td.closest('tr');
    let rowId = $tr.data('id');
    if (typeof rowId !== 'undefined') {
      rowId = rowId.toString();
    }
    const cellIndex = $td.index();

    if (this.state.lastLockedRowId !== rowId) {
      if (typeof this.options.handleTdDblClick === 'function') {
        this.options.handleTdDblClick(rowId, cellIndex, $td);
      }
    }
    if (!this.options.dblClickMeansLock) {
      return;
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
   * @param duration 持续时间，默认0
   */
  updateScrollTop(scrollTop: number, duration?: number) {
    const dur = !duration ? 0 : duration;
    this.state.$dom.$inner.animate({
      'scrollTop': scrollTop
    }, dur);
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
      const $tr = this.buildRow(row, columns, i);
      this.state.$dom.$tbody.append($tr.get(0));
    }
  }

  /**
   * 渲染一行
   * @param row 行数据
   * @param rowIndex 行索引
   */
  buildRow(row: Row, columns: Array<Column>, rowIndex: number): JQuery<JQuery.Node[]> {
    const $tr = this.buildDom(ITable.trTmpl);
    const rowId = this.getRowId(row, this.options, rowIndex);
    $tr.attr('data-id', rowId);

    if (rowId === this.state.lastClickRowId) {
      $tr.addClass('active');
    }
    if (rowId === this.state.lastLockedRowId) {
      $tr.addClass('locked');
    }

    for (let j = 0; j < columns.length; j++) {
      const value = row[columns[j].name];
      const $td = this.buildDom(ITable.tdTmpl);
      $td.attr('data-field', columns[j].name);
      $td.attr('data-id', rowId);
      if (!!columns[j].className) {
        $td.addClass(columns[j].className);
      }

      const $cellDiv = this.buildDom(ITable.cellDivTmpl);
      $cellDiv.html(columns[j].render(value, rowIndex, j, row));

      $td.append($cellDiv.get(0));
      $tr.append($td.get(0));
    }
    return $tr;
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
    // this.state.lastLockedRowId = undefined;
    if (!this.options.handleSort) {
      this.state.data = this.buildStateData(data, this.state.currentSortColumnIndex, this.state.currentSortDirection);
    } else {
      this.state.data = data;
    }

    this.render();
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
    const [stateRow, rowIndex] = this.findRow(this.state.data, this.options, rowId);
    const currentRowKeys = Object.keys(optionRow);

    for (let i = 0; i < currentRowKeys.length; i++) {
      const key = currentRowKeys[i];
      if (row[key] !== undefined) {
        optionRow[key] = row[key];
        stateRow[key] = row[key];
        const $td = this.state.$dom.$tbody.find(`tr:eq(${rowIndex})`).find(`td[data-field="${key}"]`);

        if ($td.length > 0) {
          let column;
          let j = 0;
          for (; j < this.options.columns.length; j++) {
            const c = this.options.columns[j];
            if (c.name === key) {
              column = c;
              break;
            }
          }

          if (column !== undefined) {
            $td.children('div').html(column.render(stateRow[key], rowIndex, j, row));
          }
        }
      }
    }
  }

  /**
   * 更新state中的data
   * @param data 用于更新 state data 的 data
   */
  replaceOptionData(data: Array<Row>): void {
    this.options.data = data;
    this.updateStateData(data);
  }

  /**
   * 向option的末尾添加数据，同时更新state data
   * 采用单行插入的方式，不重绘，不调用 render
   * @param row 要添加的行数据
   */
  appendOptionData(row: Row): void {
    this.options.data.push(row);
    this.state.data.push(row);
    const $tr = this.buildRow(row, this.options.columns, this.getDataLength() - 1);
    // $tr.addClass('new');
    this.state.$dom.$table.append($tr.get(0));
    // const height = this.state.$dom.$table.outerHeight();
    // this.updateScrollTop(height - 40,500);
  }

  /**
   * 向option的头部添加数据，同时更新state data
   * 采用完整重绘，调用render
   * @param row 要添加的行数据
   */
  prependOptionData(row: Row): void {
    this.options.data.splice(0, 0, row);
    this.state.data.splice(0, 0, row);
    this.render();
    this.updateScrollTop(0, 500);
  }

  /**
   * 删除一行，触发重新渲染
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
    this.render();
  }

  /**
   * 设置活跃行，就是选中行
   * @param id 行唯一标识 id
   */
  setActiveRow(id: string): void {
    this.handleTdClickDomOpe(id, 0);
  }

  /**
   * 设置锁定行，置顶行
   * @param id 行唯一标识 id
   */
  setLockedRow(id: string): void {
    this.handleTdDblClickDomOpe(id, 0);
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

