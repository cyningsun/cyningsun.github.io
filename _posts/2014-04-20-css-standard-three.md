---
layout: post
title: CSS标准(3)-包含块
category: 读书总结
tags: css 盒模型 包含块
---
###概念
包含块：一个元素box的定位和尺寸，有时候会跟某一矩形框有关，这个矩形框，就被称作该元素的包含块。

###判定包含块
包含块判定总流程图如下：

![]({{ site.url }}/public/blog-img/css-standard/CB4.png)

其他都很好理解，以下单看绝对定位元素的包含块。
####绝对定位元素
1、如果其祖先元素是行内元素，则包含块取决于其祖先元素的 'direction' 特性
> 如果 'direction' 是 'ltr'，包含块的顶、左边是祖先元素生成的第一个框的顶、左内边距边界(padding edges) ，右、下边是祖先元素生成的最后一个框的右、下内边距边界(padding edges)   
> 如果 'direction' 是 'rtl'，包含块的顶、右边是祖先元素生成的第一个框的顶、右内边距边界 (padding edges) ，左、下边是祖先元素生成的最后一个框的左、下内边距边界 (padding edges)   

<iframe width="100%" height="500" src="http://jsfiddle.net/cyningsun/Pr4LF/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

2、如果祖先元素不是行内元素，那么包含块的区域应该是祖先元素的内边距边界

<iframe width="100%" height="350" src="http://jsfiddle.net/cyningsun/6xSpP/embedded/html,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

(完)




