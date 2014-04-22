---
layout: post
title: CSS标准(4)-控制框
category: 读书总结
tags: css 可视化格式模型 控制框
---
###块级元素
块级元素：块级(block-level)元素在页面上表现为一个块,单独占有一行。

+ 块级框：块级元素生成来包含其子框和生成的内容的框称为块级框(Block-level box)。
+ 块容器框：块容器框(block container box)只包含其他块级框,或者创建一个行内格式化上下文(inline formatting context)从而只包含行内框。
+ 块框：是块容器框的块级框称为块框(block boxes)。            
三者关系如下图所示:
![]({{ site.url }}/public/blog-img/css-standard/Block_box.jpg)

###行级元素
行级元素：行级元素是在源文档中那些不为其内容不形成新的块;而让其内容分布在多行中的元素。

+ 行级框：行级元素生成行级框，而这些框会参与某个行格式化上下文。
+ 行内框：内容参与了包含它的行格式化上下文的行级框。
+ 原子行级框：那些不是行内框的行级框(例如可替换的行级元素、行内块元素、行内表格元素)被称为原子行级框。         
两种行级框的关系如下图所示：
![]({{ site.url }}/public/blog-img/css-standard/Inline_box.jpg)

(完)


---

