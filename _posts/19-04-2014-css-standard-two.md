---
layout: post
title: CSS标准(2)-框模型
category: 读书总结
tags: css
---
###框结构
浏览器会根据渲染模型1为每个元素生成四个嵌套的矩形框， 分别称作 content box、padding box、border box 和 margin box，它们是不可分割的，并可能会重合， 这就是 CSS 规范中描述的“框模型”（box model）。
![]({{ site.url }}/public/blog-img/css-standard/boxdim.png)
图中的大框，代表一个元素生成的矩形区域( box )，每一个 box 都包括一个 content 区域（元素的内容，如文本，图形等）以及环绕其四周的 padding (元素的内边距，填充部分)、border (元素的边框) 和 margin (元素的外边距) 区域。  
示例：
<iframe width="100%" height="250" src="http://jsfiddle.net/cyningsun/ycaPS/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
其框模型分解如下图：
![]({{ site.url }}/public/blog-img/css-standard/boxdimeg.png)
(未完)




---
