---
layout: post
title: 移动设备屏幕相关的知识
category: 读书总结
tags: px dpi
---
###基本概念

+ Screen size（屏幕尺寸):指的是屏幕实际的物理尺寸，屏幕对角线的长度。
+ Aspect Ratio(宽高比率)：指的是实际的物理尺寸宽高比率。
+ Resolution(分辨率)：指手机屏幕纵、横方向像素个数。
+ DPI(dot per inch)：每英寸像素数。假设QVGA(320*240)分辨率的屏幕物理尺寸是（2英寸*1.5英寸），dpi=160。Android支持四种不同的dpi模式：ldpi mdpi hdpi xhdpi(0.75:1:1.5:2),如果以 160 dpi 作为基准的话，只要尺寸的 DP 是 4 的公倍数，XHDPI 下乘以 2，HDPI 下乘以 1.5，LDPI 下乘以 0.75 即可满足所有尺寸下都是整数 pixel。   
![]({{ site.url }}/public/blog-img/android-screen/dpi.jpg)
+ Density(密度)：屏幕里像素值浓度，resolution/Screen size可以反映出手机密度。如，
+ Density-independent pixel (dip设备独立像素)：不同设备有不同的显示效果,这个和设备硬件有关。相关公式是dip/pixel=160/dpi。

###基本单位
+ px（像素）：屏幕显示的基本单位。(来源：UI设计师，屏幕显示)
+ dp（与密度无关的像素）：基于屏幕密度的抽象单位。(来源：开发，Layout的基本单位)
+ sp（与刻度无关的像素）：与dp类似，但是可以根据用户的字体大小首选项进行缩放。(来源：开发，字体的字号单位)

Ps:dp与sp总为1：1关系。

####inch和dp
两者分别作为单位在安卓上的对比

+ inch   
![]({{ site.url }}/public/blog-img/android-screen/inch.jpg)
+ dp   
![]({{ site.url }}/public/blog-img/android-screen/dp.jpg)

(完)

###参考链接：
http://www.zhihu.com/question/19625584/answer/14150577      
http://www.zhihu.com/question/20697111/answer/15894155      


---
