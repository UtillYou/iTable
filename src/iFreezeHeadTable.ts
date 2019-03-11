/**
 * 可冻结表头的表格
 */
class IFreezeHeadTable extends ITable {
  static headContainerTmpl: string = '<div class="i-table-head-container"></div>';
  static contentContainerTmpl: string = '<div class="i-table-content-container"></div>';

  constructor($this: JQuery, optionsParam: Options) {
    super($this, optionsParam);
  }

  initHtml($this:JQuery<HTMLElement>) {
    const options = this.options;
    const width = $this.width();
    const height = $this.height();
    
    const $headContainer = this.buildDom(IFreezeHeadTable.headContainerTmpl);
    const $headTable = this.buildDom(ITable.tableTmpl);
    const $headColgroup = this.buildDom(ITable.colgroupTmpl);
    const $headOuter = this.buildDom(ITable.outerTmpl);
    const $headInner = this.buildDom(ITable.innerTmpl);

    const $root = this.buildDom(ITable.rootTmpl);
    const $container = this.buildDom(IFreezeHeadTable.contentContainerTmpl);
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
      $root:$root,
      $container: $container,
      $inner:$inner,
      $table: $table,
      $colgroup: $headColgroup,
      $thead: $thead,
      $tbody: $tbody,
    }

    if (typeof options.width === 'number') {
      $root.css('width', `${options.width}px`);
    }

    $this.empty();
    $this.append($root.get(0));
    $root.append($headContainer.get(0)).append($container.get(0));
    $headContainer.append($headOuter.get(0));
    $headOuter.append($headInner.get(0));
    $headInner.append($headTable.get(0));

    $container.append($outer.get(0));
    $outer.append($inner.get(0));
    $inner.append($table.get(0));
    $headTable.append($headColgroup.get(0)).append($thead.get(0));
    $table.append($colgroup.get(0)).append($tbody.get(0));

    // 根据列定义构建表头
    const $theadTr = this.buildDom(ITable.trTmpl);
    $thead.append($theadTr.get(0));
    for (let i = 0; i < options.columns.length; i++) {
      const column = options.columns[i];

      const $headCol = this.buildCol(column,i);
      const $col = this.buildCol(column,i);
      const $th = this.buildTh(column,i);

      $headColgroup.append($headCol.get(0));
      $colgroup.append($col.get(0));
      $theadTr.append($th.get(0));
    }
    
  }

  getResizeDom(): Array<JQuery<Node[]>> {
    const index = this.state.$dom.$resizingDom.index();
    const $col = this.state.$dom.$table.find(`colgroup>col:eq(${index})`);

    const r =[this.state.$dom.$resizingDom, $col];

    if (this.detectIE()) {
      const index = this.state.$dom.$resizingDom.index();
      const $th = this.state.$dom.$thead.find(`th:eq(${index.toString()})`);
      r.push($th);
    }
    return r;
  }
}