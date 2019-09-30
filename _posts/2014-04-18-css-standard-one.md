---
layout: post
title: CSS标准(1)-特性和值
keywords:
  - css
---

* TOC
{:toc}

### 选择器的特异度
1.第一等：代表内联样式，如: style=””，权值为1000。   
2.第二等：代表ID选择器，如：#content，权值为100。  
3.第三等：代表类，伪类和属性选择器，如.content，权值为10。  
4.第四等：代表类型选择器和伪元素选择器，如div p，权值为1。   

```css
* {} /* a=0 b=0 c=0 d=0 -> specificity = 0,0,0,0 */
li {} /* a=0 b=0 c=0 d=1 -> specificity = 0,0,0,1 */
li:first-line {} /* a=0 b=0 c=0 d=2 -> specificity = 0,0,0,2 */
ul li {} /* a=0 b=0 c=0 d=2 -> specificity = 0,0,0,2 */
ul ol+li {} /* a=0 b=0 c=0 d=3 -> specificity = 0,0,0,3 */
h1 + *[rel=up]{} /* a=0 b=0 c=1 d=1 -> specificity = 0,0,1,1 */
ul ol li.red {} /* a=0 b=0 c=1 d=3 -> specificity = 0,0,1,3 */
li.red.level {} /* a=0 b=0 c=2 d=1 -> specificity = 0,0,2,1 */
#x34y {} /* a=0 b=1 c=0 d=0 -> specificity = 0,1,0,0 */
style="" /* a=1 b=0 c=0 d=0 -> specificity = 1,0,0,0 */
```
现在，应用上面的规则，计算例子中各个样式的特殊性的值，结果为：

<iframe width="100%" height="200" src="http://jsfiddle.net/cyningsun/tDEXp/embedded/result,html,css/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

### CSS 层叠顺序( Cascading order )
1.根据 CSS 样式的来源和重要性(是否含 !important )，给出了优先级的升序排列：  
> 1.用户端声明( UA declarations )   
> 2.一般用户声明( user normal declarations )   
> 3.一般作者声明( author normal declarations )   
> 4.加了 '!important' 的作者声明( author important declarations )  
> 5.加了 '!important' 的用户声明( user important declarations ) 
     
2.拥有相同重要性和来源的规则，按照 CSS specificity 来排序。   
3.最后，根据先后次序来排列：如果两条规则具有相同的权重，相同的来源和相同的选择器特殊性，则后出现的规则超越先出现的规则.  

### CSS 尺寸
**em**：em指字体高，任意浏览器的默认字体高都是16px。所以未经调整的浏览器都符合：1em=16px。那么12px=0.75em。但是em并不是固定的，它会继承父级元素的字体大小。  
**pt**：pt是一个绝对值,它等于1/72英寸。在css中pt要在屏幕上显示，必须先把以 pt 为单位的长度转换为以像素为单位的长度。例如，无论在哪个操作系统中，Firefox 浏览器默认的 DPI 都是 96，那么实际上 9pt = 9 * 1/72 * 96 = 12px。  
> 虽然pt是绝对单位，但是那只是针对输出设备而言的，在文字排版工具（word，abobe）中是非常有用的字体单位。不管显示器的分辨率是多少，打印在纸面上的结果是一样的。但是网页主要为了屏幕显示，而不是为了打印等其他需要的。

**px**：px就是对应设备的物理像素，然而如果输出设备的解析度与电脑显示器大不相同，输出效果就会有问题。CSS规定，在这种情况下，浏览器应该对像素值进行缩放调节，以保持阅读体验的大体一致。也就是要保持一定像素的长度在不同设备输出上看上去的大小总是差不多。CSS转换是按照“参考像素”（reference pixel）来进行。 眼睛看到的大小，取决于可视角度。而可视角度取决于物体的实际大小以及物体与眼睛的距离。10米远处一个1米见方的东西，与1米远处的10厘米见方的东西，看上去的大小差不多是一样的.(如下图)
![]({{ site.url }}/public/blog-img/css-standard/px.jpg)

因此CSS规范使用视角来定义“参考像素”，1参考像素即为从一臂之遥看解析度为96DPI的设备输出（即1英寸96点）时，1点（即1/96英寸）的视角。px可被视为一个基准单位——与桌面分辨率一致，如果是液晶屏，则几乎总是与液晶屏物理分辨率一致——也就是说网页设计者设定的1px，就是“最终看到这个网页的用户的显示器上的1个点距”！反倒是那些绝对单位，其实一点也不绝对。因为绝对单位比如cm或者pt，显示在屏幕上时最后还是要换算为像素，而且这种换算不是按照像素的实际物理长度来换算的（浏览器不用知道，也不可能知道当前这台显示器的1px物理长度到底是多少），而是按照桌面设定的DPI计算的。

### 参考链接
http://hax.iteye.com/blog/374323         
http://www.zhihu.com/question/20088580/answer/13935004        

(完)


