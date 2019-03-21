; (function ($) {
    $.fn.extend({
      itable: function (options: Options) {
        // 检查，列定义不能为空
        if (!options.columns || options.columns.length === 0) {
          throw new Error("列定义不能为空");
        }
        // 检查，当使用固定列或者固定头部时，每列的宽度必须指定为具体的像素值
        if (options.freezeColumn || options.freezeHead) {
          let hasFrozenColumn = false;
          for (let i = 0; i < options.columns.length; i++) {
            const element = options.columns[i];
            if (typeof element.width !== 'number') {
              throw new Error("当使用固定列或者固定头部时，每列的宽度必须指定为具体的像素值");
            }
            if (hasFrozenColumn === false && element.isFrozen === true) {
              hasFrozenColumn = true;
            }
            if (options.freezeColumn && element.isSequence && !element.isFrozen) {
              throw new Error('当使用固定列的同时包含序号列时，序号列也必须为固定列');
            }
          }
          if (options.freezeColumn && hasFrozenColumn === false) {
            throw new Error("当使用固定列时，应该将需要固定的列的 isFrozen 属性设置为 true");
          }
        }
        // 检查，只能有一个列为默认排序列
        let hasSortColumn =  false;
        for (let i = 0; i < options.columns.length; i++) {
          const element = options.columns[i];
          if (element.defaultSortOrder) {
            if (hasSortColumn === false) {
              hasSortColumn = true;
            }else{
              throw new Error("只能有一个列为默认排序列");
            }
          }
        }

        if (options.freezeColumn === true) {
          return new IFreezeColumnTable(this,options);
        }
        if ( options.freezeHead === true) {
          return new IFreezeHeadTable(this, options)
        }
        return new ITable(this, options);
      }
    })
  })(jQuery);