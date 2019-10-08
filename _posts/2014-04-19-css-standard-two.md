---
layout: post
title: CSS标准(2)-盒模型
last_modified_at: 2019-10-08
keywords:
  - css
  - 盒模型
---

* TOC
{:toc}

### 框结构
浏览器会根据渲染模型为每个元素生成四个嵌套的矩形框， 分别称作 content box、padding box、border box 和 margin box，它们是不可分割的，并可能会重合， 这就是 CSS 规范中描述的“盒模型”（box model）。

![]({{ site.url }}/public/blog-img/css-standard/boxdim.png)

图中的大框，代表一个元素生成的矩形区域( box )，每一个 box 都包括一个 content 区域（元素的内容，如文本，图形等）以及环绕其四周的 padding (元素的内边距，填充部分)、border (元素的边框) 和 margin (元素的外边距) 区域。  
示例：
<iframe width="100%" height="250" src="http://jsfiddle.net/cyningsun/ycaPS/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
其盒模型分解如下图：

![]({{ site.url }}/public/blog-img/css-standard/boxdimeg.png)

### 外边距折叠
1.两个或多个毗邻的普通流中的块元素垂直方向上的margin会折叠
<iframe width="100%" height="300" src="http://jsfiddle.net/cyningsun/n9E8h/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
2.浮动元素/inline-block的元素/绝对定位元素的margin不会和垂直方向上的其他元素的margin折叠
<iframe width="100%" height="300" src="http://jsfiddle.net/cyningsun/gbF8J/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
3.创建了块级格式化上下文的元素，不和它的子元素发生margin折叠
<iframe width="100%" height="200" src="http://jsfiddle.net/cyningsun/e3F9F/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>
4.元素自身的margin-bottom和margin-top相邻时也会折叠
<iframe width="100%" height="200" src="http://jsfiddle.net/cyningsun/2V8T3/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

(完)




