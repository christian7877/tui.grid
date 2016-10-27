tui.util.defineNamespace("fedoc.content", {});
fedoc.content["view_clipboard.js.html"] = "      <div id=\"main\" class=\"main\">\n\n\n\n    \n    <section>\n        <article>\n            <pre class=\"prettyprint source linenums\"><code>/**\n * @fileoverview 키 이벤트 핸들링 담당하는 Clipboard 정의\n * @author NHN Ent. FE Development Team\n */\n'use strict';\n\nvar View = require('../base/view');\nvar util = require('../common/util');\nvar keyCodeMap = require('../common/constMap').keyCode;\n\n/**\n * Clipboard view class\n * @module view/clipboard\n * @extends module:base/view\n */\nvar Clipboard = View.extend(/**@lends module:view/clipboard.prototype */{\n    /**\n     * @constructs\n     * @param {Object} options - Options\n     */\n    initialize: function(options) {\n        this.setOwnProperties({\n            focusModel: options.focusModel,\n            selectionModel: options.selectionModel,\n            painterManager: options.painterManager,\n            dimensionModel: options.dimensionModel,\n            dataModel: options.dataModel,\n            columnModel: options.columnModel,\n            renderModel: options.renderModel,\n            timeoutIdForKeyIn: 0,\n            isLocked: false\n        });\n        this.listenTo(this.focusModel, 'focusClipboard', this._onFocus);\n    },\n\n    tagName: 'textarea',\n\n    className: 'clipboard',\n\n    events: {\n        'keydown': '_onKeyDown',\n        'blur': '_onBlur'\n    },\n\n    /**\n     * Event handler for blur event.\n     * @private\n     */\n    _onBlur: function() {\n        var focusModel = this.focusModel;\n        setTimeout(function() {\n            focusModel.refreshState();\n        }, 0);\n    },\n\n    /**\n     * Event handler for 'focusClipboard' event on focusModel\n     * @private\n     */\n    _onFocus: function() {\n        try {\n            if (!this.$el.is(':focus')) {\n                this.$el.focus();\n                this.focusModel.refreshState();\n            }\n        } catch (e) {\n            // Do nothing.\n            // This try/catch block is just for preventing 'Unspecified error'\n            // in IE9(and under) when running test using karma.\n        }\n    },\n\n    /**\n     * 랜더링 한다.\n     * @returns {View.Clipboard} this object\n     */\n    render: function() {\n        return this;\n    },\n\n    /**\n     * keyEvent 의 중복 호출을 방지하는 lock 을 설정한다.\n     * @private\n     */\n    _lock: function() {\n        clearTimeout(this.timeoutIdForKeyIn);\n        this.isLocked = true;\n        this.timeoutIdForKeyIn = setTimeout($.proxy(this._unlock, this), 10); // eslint-disable-line no-magic-numbers\n    },\n\n    /**\n     * keyEvent 의 중복 호출을 방지하는 lock 을 해제한다.\n     * @private\n     */\n    _unlock: function() {\n        this.isLocked = false;\n    },\n\n    /**\n     * keyDown 이벤트 핸들러\n     * @param {Event} keyDownEvent 이벤트 객체\n     * @private\n     */\n    _onKeyDown: function(keyDownEvent) {\n        if (this.isLocked) {\n            keyDownEvent.preventDefault();\n            return;\n        }\n\n        if (keyDownEvent.shiftKey &amp;&amp; (keyDownEvent.ctrlKey || keyDownEvent.metaKey)) {\n            this._keyInWithShiftAndCtrl(keyDownEvent);\n        } else if (keyDownEvent.shiftKey) {\n            this._keyInWithShift(keyDownEvent);\n        } else if (keyDownEvent.ctrlKey || keyDownEvent.metaKey) {\n            this._keyInWithCtrl(keyDownEvent);\n        } else {\n            this._keyIn(keyDownEvent);\n        }\n        this._lock();\n    },\n\n    /**\n     * ctrl, shift 둘다 눌리지 않은 상태에서의 key down 이벤트 핸들러\n     * @param {Event} keyDownEvent 이벤트 객체\n     * @private\n     */\n    _keyIn: function(keyDownEvent) { // eslint-disable-line complexity\n        var focusModel = this.focusModel,\n            selectionModel = this.selectionModel,\n            focused = focusModel.which(),\n            rowKey = focused.rowKey,\n            columnName = focused.columnName,\n            displayRowCount = this.dimensionModel.get('displayRowCount'),\n            isKeyIdentified = true,\n            keyCode = keyDownEvent.keyCode || keyDownEvent.which;\n\n        if (util.isBlank(focused.rowKey)) {\n            return;\n        }\n\n        switch (keyCode) {\n            case keyCodeMap.UP_ARROW:\n                focusModel.focus(focusModel.prevRowKey(), columnName, true);\n                break;\n            case keyCodeMap.DOWN_ARROW:\n                focusModel.focus(focusModel.nextRowKey(), columnName, true);\n                break;\n            case keyCodeMap.LEFT_ARROW:\n                focusModel.focus(rowKey, focusModel.prevColumnName(), true);\n                break;\n            case keyCodeMap.RIGHT_ARROW:\n                focusModel.focus(rowKey, focusModel.nextColumnName(), true);\n                break;\n            case keyCodeMap.PAGE_UP:\n                focusModel.focus(focusModel.prevRowKey(displayRowCount - 1), columnName, true);\n                break;\n            case keyCodeMap.PAGE_DOWN:\n                focusModel.focus(focusModel.nextRowKey(displayRowCount - 1), columnName, true);\n                break;\n            case keyCodeMap.HOME:\n                focusModel.focus(rowKey, focusModel.firstColumnName(), true);\n                break;\n            case keyCodeMap.END:\n                focusModel.focus(rowKey, focusModel.lastColumnName(), true);\n                break;\n            //space 와 enter 는 동일동작\n            case keyCodeMap.SPACE:\n            case keyCodeMap.ENTER:\n                this._onEnterSpace(rowKey, columnName);\n                break;\n            case keyCodeMap.DEL:\n                this._del(rowKey, columnName);\n                break;\n            case keyCodeMap.TAB:\n                focusModel.focusIn(rowKey, focusModel.nextColumnName(), true);\n                break;\n            default:\n                isKeyIdentified = false;\n                break;\n        }\n        if (isKeyIdentified) {\n            keyDownEvent.preventDefault();\n        }\n        selectionModel.end();\n    },\n\n    /**\n     * enter 또는 space 가 입력되었을 때, 처리하는 로직\n     * @param {(number|string)} rowKey 키 입력이 발생한 엘리먼트의 rowKey\n     * @param {string} columnName 키 입력이 발생한 엘리먼트의 컬럼명\n     * @private\n     */\n    _onEnterSpace: function(rowKey, columnName) {\n        this.focusModel.focusIn(rowKey, columnName);\n    },\n\n    /**\n     * Return index for reference of selection before moving by key event.\n     * @returns {{row: number, column:number}} index\n     * @private\n     */\n    _getIndexBeforeMove: function() {\n        var focusedIndex = this.focusModel.indexOf(),\n            selectionRange = this.selectionModel.get('range'),\n            index = _.extend({}, focusedIndex),\n            selectionRowRange, selectionColumnRange;\n\n        if (selectionRange) {\n            selectionRowRange = selectionRange.row;\n            selectionColumnRange = selectionRange.column;\n\n            index.row = selectionRowRange[0];\n            index.column = selectionColumnRange[0];\n\n            if (selectionRowRange[1] > focusedIndex.row) {\n                index.row = selectionRowRange[1];\n            }\n            if (selectionColumnRange[1] > focusedIndex.column) {\n                index.column = selectionColumnRange[1];\n            }\n        }\n        return index;\n    },\n\n    /**\n     * shift 가 눌린 상태에서의 key down event handler\n     * @param {Event} keyDownEvent 이벤트 객체\n     * @private\n     */\n    _keyInWithShift: function(keyDownEvent) { // eslint-disable-line complexity\n        var focusModel = this.focusModel,\n            dimensionModel = this.dimensionModel,\n            columnModelList = this.columnModel.getVisibleColumnModelList(),\n            focused = focusModel.which(),\n            displayRowCount = dimensionModel.get('displayRowCount'),\n            keyCode = keyDownEvent.keyCode || keyDownEvent.which,\n            index = this._getIndexBeforeMove(),\n            isKeyIdentified = true,\n            isSelection = true,\n            columnModel, scrollPosition, isValid, selectionState;\n\n        switch (keyCode) {\n            case keyCodeMap.UP_ARROW:\n                index.row -= 1;\n                break;\n            case keyCodeMap.DOWN_ARROW:\n                index.row += 1;\n                break;\n            case keyCodeMap.LEFT_ARROW:\n                index.column -= 1;\n                break;\n            case keyCodeMap.RIGHT_ARROW:\n                index.column += 1;\n                break;\n            case keyCodeMap.PAGE_UP:\n                index.row = focusModel.prevRowIndex(displayRowCount - 1);\n                break;\n            case keyCodeMap.PAGE_DOWN:\n                index.row = focusModel.nextRowIndex(displayRowCount - 1);\n                break;\n            case keyCodeMap.HOME:\n                index.column = 0;\n                break;\n            case keyCodeMap.END:\n                index.column = columnModelList.length - 1;\n                break;\n            case keyCodeMap.ENTER:\n                isSelection = false;\n                break;\n            case keyCodeMap.TAB:\n                isSelection = false;\n                focusModel.focusIn(focused.rowKey, focusModel.prevColumnName(), true);\n                break;\n            default:\n                isSelection = false;\n                isKeyIdentified = false;\n                break;\n        }\n\n        columnModel = columnModelList[index.column];\n        isValid = !!(columnModel &amp;&amp; this.dataModel.getRowData(index.row));\n\n        if (isSelection &amp;&amp; isValid) {\n            this._updateSelectionByKeyIn(index.row, index.column);\n            scrollPosition = dimensionModel.getScrollPosition(index.row, columnModel.columnName);\n            if (scrollPosition) {\n                selectionState = this.selectionModel.getState();\n                if (selectionState === 'column') {\n                    delete scrollPosition.scrollTop;\n                } else if (selectionState === 'row') {\n                    delete scrollPosition.scrollLeft;\n                }\n                this.renderModel.set(scrollPosition);\n            }\n        }\n\n        if (isKeyIdentified) {\n            keyDownEvent.preventDefault();\n        }\n    },\n\n    /**\n     * ctrl 가 눌린 상태에서의 key down event handler\n     * @param {Event} keyDownEvent 이벤트 객체\n     * @private\n     */\n    _keyInWithCtrl: function(keyDownEvent) {\n        var focusModel = this.focusModel,\n            keyCode = keyDownEvent.keyCode || keyDownEvent.which;\n\n        switch (keyCode) {\n            case keyCodeMap.CHAR_A:\n                this.selectionModel.selectAll();\n                break;\n            case keyCodeMap.CHAR_C:\n                this._copyToClipboard();\n                break;\n            case keyCodeMap.HOME:\n                focusModel.focus(focusModel.firstRowKey(), focusModel.firstColumnName(), true);\n                break;\n            case keyCodeMap.END:\n                focusModel.focus(focusModel.lastRowKey(), focusModel.lastColumnName(), true);\n                break;\n            case keyCodeMap.CHAR_V:\n                this._paste();\n                break;\n            default:\n                break;\n        }\n    },\n\n    /**\n     * paste date\n     * @private\n     */\n    _paste: function() {\n        // pressing v long time, clear clipboard to keep final paste date\n        this._clearClipBoard();\n        if (this.pasting) {\n            return;\n        }\n\n        this.pasting = true;\n        this._onKeyupCharV();\n    },\n\n    /**\n     * keyup event attach\n     * @private\n     */\n    _onKeyupCharV: function() {\n        this.$el.on('keyup', $.proxy(this.onKeyupCharV, this));\n    },\n\n    onKeyupCharV: function() {\n        this._pasteToGrid();\n        this.pasting = false;\n    },\n\n   /**\n     * clipboard textarea clear\n     * @private\n     */\n    _clearClipBoard: function() {\n        this.$el.val('');\n    },\n\n    /**\n     * paste text data\n     * @private\n     */\n    _pasteToGrid: function() {\n        var selectionModel = this.selectionModel,\n            focusModel = this.focusModel,\n            dataModel = this.dataModel,\n            startIdx, data;\n\n        if (selectionModel.hasSelection()) {\n            startIdx = selectionModel.getStartIndex();\n        } else {\n            startIdx = focusModel.indexOf();\n        }\n        data = this._getProcessClipBoardData();\n\n        this.$el.off('keyup');\n        dataModel.paste(data, startIdx);\n    },\n\n    /**\n     * process data for paste to grid\n     * @private\n     * @returns {Array.&lt;Array.&lt;string>>} result\n     */\n    _getProcessClipBoardData: function() {\n        var text = this.$el.val(),\n            result = text.split('\\n'),\n            i = 0,\n            len = result.length;\n\n        for (; i &lt; len; i += 1) {\n            result[i] = result[i].split('\\t');\n        }\n        return result;\n    },\n\n    /**\n     * ctrl, shift 둘다 눌린 상태에서의 key down event handler\n     * @param {Event} keyDownEvent 이벤트 객체\n     * @private\n     */\n    _keyInWithShiftAndCtrl: function(keyDownEvent) {\n        var isKeyIdentified = true,\n            columnModelList = this.columnModel.getVisibleColumnModelList(),\n            keyCode = keyDownEvent.keyCode || keyDownEvent.which;\n\n        switch (keyCode) {\n            case keyCodeMap.HOME:\n                this._updateSelectionByKeyIn(0, 0);\n                break;\n            case keyCodeMap.END:\n                this._updateSelectionByKeyIn(this.dataModel.length - 1, columnModelList.length - 1);\n                break;\n            default:\n                isKeyIdentified = false;\n                break;\n        }\n        if (isKeyIdentified) {\n            keyDownEvent.preventDefault();\n        }\n    },\n\n    /**\n     * text type 의 editOption cell 의 data 를 빈 스트링으로 세팅한다.\n     * selection 영역이 지정되어 있다면 selection 영역에 해당하는 모든 셀.\n     * selection 영역이 지정되어 있지 않다면 focus된 셀\n     * @private\n     */\n    _del: function() {\n        var selectionModel = this.selectionModel,\n            dataModel = this.dataModel,\n            focused = this.focusModel.which(),\n            columnModelList = this.columnModel.getVisibleColumnModelList(),\n            rowKey = focused.rowKey,\n            columnName = focused.columnName,\n            range, i, j;\n\n        if (selectionModel.hasSelection()) {\n            //다수의 cell 을 제거 할 때에는 silent 로 데이터를 변환한 후 한번에 랜더링을 refresh 한다.\n            range = selectionModel.get('range');\n            for (i = range.row[0]; i &lt; range.row[1] + 1; i += 1) {\n                rowKey = dataModel.at(i).get('rowKey');\n                for (j = range.column[0]; j &lt; range.column[1] + 1; j += 1) {\n                    columnName = columnModelList[j].columnName;\n                    dataModel.del(rowKey, columnName, true);\n                    dataModel.get(rowKey).validateCell(columnName);\n                }\n            }\n            this.renderModel.refresh(true);\n        } else {\n            dataModel.del(rowKey, columnName);\n        }\n    },\n\n    /**\n     * keyIn 으로 selection 영역을 update 한다. focus 로직도 함께 수행한다.\n     * @param {Number} rowIndex 행의 index 정보\n     * @param {Number} columnIndex 열의 index 정보\n     * @private\n     */\n    _updateSelectionByKeyIn: function(rowIndex, columnIndex) {\n        var selectionModel = this.selectionModel;\n\n        selectionModel.update(rowIndex, columnIndex);\n    },\n\n    /**\n     * clipboard 에 설정될 문자열 반환한다.\n     * @returns {String} 데이터를 text 형태로 변환한 문자열\n     * @private\n     */\n    _getClipboardString: function() {\n        var text,\n            selectionModel = this.selectionModel,\n            focused = this.focusModel.which();\n        if (selectionModel.hasSelection()) {\n            text = this.selectionModel.getValuesToString();\n        } else {\n            text = this.dataModel.get(focused.rowKey).getValueString(focused.columnName);\n        }\n        return text;\n    },\n\n    /**\n     * 현재 그리드의 data 를 clipboard 에 copy 한다.\n     * @private\n     */\n     /* istanbul ignore next */\n    _copyToClipboard: function() {\n        var text = this._getClipboardString();\n        if (window.clipboardData) {\n            window.clipboardData.setData('Text', text);\n        } else {\n            this.$el.val(text).select();\n        }\n    }\n});\n\nmodule.exports = Clipboard;\n</code></pre>\n        </article>\n    </section>\n\n\n\n</div>\n\n"