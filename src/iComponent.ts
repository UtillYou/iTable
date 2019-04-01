/**
 * 组件基类，包含一些公共方法
 */
class IBaseComponent {
  constructor() {

  }
  /**
 * 根据模板字符串构建dom引用，jQuery封装的
 * @param tmpl 模板字符串
 */
  buildDom(tmpl: string): JQuery<JQuery.Node[]> {
    const dom = $.parseHTML(tmpl);
    return $(dom);
  }

  /**
   * 默认的列渲染器
   * @param data 需要渲染的数据
   */
  defaultColumnRender(data: string | number | boolean) {
    if (data === undefined || data === null) {
      return '';
    }
    if (typeof data === 'string') {
      return data;
    }
    return data.toString();
  }

  /**
   * 默认的唯一ID 获取函数
   * @param rowData 行数据
   * @param rowIndex 行索引
   */
  defaultGetUniqueId(rowData: Row, rowIndex: number): string {
    let str = '';
    const keys = Object.keys(rowData)
    for (let i = 0; i < keys.length; i++) {
      const value = rowData[keys[i]];
      if (value == null) {
        str += '';
        continue;
      }
      str += value.toString();
    }
    return str;
  }

  /**
   * 默认的列渲染器
   * @param data 需要渲染的数据
   * @param rowIndex 行号
   */
  sequenceColumnRender(data: string | number | boolean, rowIndex?: number) {
    return (rowIndex + 1).toString();
  }

  /**
   * 浅拷贝一个数组，复制一级数据
   * @param data 数据源
   */
  shadowCopyArray<T>(data: T[]): T[] {
    let finalData = [];
    for (let i = 0, len = data.length; i < len; i++) {
      finalData.push(data[i]);
    }
    return finalData;
  }

  /**
   * 默认排序函数
   * @param a 前一个项目
   * @param b 后一个项目
   */
  defaultSorter(a: Value, b: Value): number {
    const aValue = a === null ? 0 : parseFloat(a.toString());
    const bValue = b === null ? 0 : parseFloat(b.toString());
    if (isNaN(aValue) || isNaN(bValue)) {
      return 0;
    }
    return aValue - bValue;
  }

  /**
   * 原地排序数组，根据排序列的sorter排序，如果sorter未指定，使用默认函数 derfaultSorter
   * 并返回排序后的数组
   * @param data 需要排序的数据，最后也会被改变
   * @param columns 列定义
   * @param sortColumnIndex 排序列索引
   * @param sortDirection 排序列方向
   */
  sortData(data: Array<Row>, columns: Array<Column>, sortColumnIndex: number, sortDirection: SortDirection): Array<Row> {
    let finalData = data;
    // 排序
    if (sortColumnIndex !== undefined) {
      const sorter = columns[sortColumnIndex].sorter;
      const name = columns[sortColumnIndex].name;
      finalData = finalData.sort((a, b) => {
        const aColumnValue = a[name];
        const bColumnValue = b[name];
        return typeof sorter === 'function' ? sorter(aColumnValue, bColumnValue) : this.defaultSorter(aColumnValue, bColumnValue);
      })
      if (sortDirection === SortDirection.DESCEND) {
        finalData = finalData.reverse();
      }
    }
    return finalData;
  }


  /**
   * 处理列定义，如果没有render，指定默认render
   * 并返回排序列信息
   * @param columns 列定义
   */
  packageColumn(columns: Column[]): [number, SortDirection] {
    let currentSortColumnIndex, currentSortDirection;
    for (let i = 0; i < columns.length; i++) {
      const element = columns[i];
      if (element.render == undefined || element.render === null) {
        if (element.isSequence) {
          element.render = this.sequenceColumnRender;
        } else {
          element.render = this.defaultColumnRender;
        }
      }
      if (element.sorter && element.defaultSortOrder && currentSortColumnIndex === undefined) {
        currentSortColumnIndex = i;
        currentSortDirection = element.defaultSortOrder;
      }
    }
    return [currentSortColumnIndex, currentSortDirection];
  }

  /**
   * 解析百分数为浮点数，'22.22%' => 0.2222
   * @param percent 百分数
   */
  parsePercent(percent: string): number {
    return parseFloat(percent) / 100;
  }

  /**
   * 返回数据字段值的字符串形式，null为空字符串
   * @param value 数据字段值
   */
  valueToString(value: Value): string {
    if (value == null) {
      return '';
    }
    return value.toString();
  }

  /**
   * 根据唯一标识，也就是id查找行数据和该行所在索引,如果没有则返回null
   * @param rows 需要查找的数据源
   * @param options 选项
   * @param id 唯一标识
   */
  findRow(rows: Array<Row>, options: Options, id: string): [Row,number] | null {
    for (let i = 0, len = rows.length; i < len; i++) {
      const row = rows[i];
      let rowId: string = this.getRowId(row, options);
      if (rowId === id) {
        return [row,i];
      }
    }
    return null;
  }

  /**
   * 根据选项获取一行的唯一标识，也就是id
   * @param row 行数据
   * @param options 选项
   * @package i 行号
   */
  getRowId(row: Row, options: Options,i?:number): string {
    let rowId: string;
    if (typeof options.getUniqueId === 'string') {
      rowId = this.valueToString(row[options.getUniqueId]);
    } else if (typeof options.getUniqueId === 'function') {
      rowId = this.valueToString(options.getUniqueId(row, i));
    } else {
      rowId = this.defaultGetUniqueId(row, i);
    }
    return rowId
  }

  /**
   * 判断当前浏览器是否IE浏览器
   */
  detectIE():boolean{
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    return msie > -1;
  }

  /**
   * 判断文本是否为数字
   * @param num 需要判断的文本
   */
  isNumber(num:string):boolean{
    return '0123456789'.indexOf(num) > -1;
  }

  /**
   * 判断文本是否为字母
   * @param char 需要判断的文本
   */
  isAlphabet(char:string):boolean{
    return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(char) > -1;
  }
}