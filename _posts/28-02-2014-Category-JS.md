---
layout: post
title: js定义和调用
category: Web前端
---

为GitHub Pages添加JS功能，早上开工，至此完成。

原生js和jQuery函数定义的方式有所不同

原生js：

```javascript
var scope = {};
scope.func = function() {
}

scope.func();
```
jQuery函数:

```javascript
(function ($) {
	$.fn.func = function (a) {
	}
})(jQuery);

$.func();
```

(完)

---
