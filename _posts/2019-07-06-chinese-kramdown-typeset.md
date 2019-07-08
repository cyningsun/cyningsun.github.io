---
layout: post
title: 中文网页重设与排版：<em>Typo.css</em>
subtitle: 一致化浏览器排版效果，构建最适合中文阅读的网页排版
---

* TOC
{:toc}

## 一、关于 _Typo.css_

_Typo.css_ 的目的是，在一致化浏览器排版效果的同时，构建最适合中文阅读的网页排版。

#### 现状和如何去做：

排版是一个麻烦的问题 <sup>[\# 附录一](https://typo.sofi.sh/#appendix1)</sup>，需要精心设计，而这个设计却是常被视觉设计师所忽略的。前端工程师更常看到这样的问题，但不便变更。因为在多个 OS 中的不同浏览器渲染不同，改动需要多的时间做回归测试，所以改变变得更困难。而像我们一般使用的
Yahoo、Eric Meyer 和 Alice base.css 中采用的 Reset 都没有很好地考虑中文排版。_Typo.css_ 要做的就是解决中文排版的问题。

**_Typo.css_ 测试于如下平台：**

OS/浏览器 | Firefox | Chrome | Safari | Opera | IE9 | IE8 | IE7 | IE6
------ | ------- | ------ | ------ | ----- | --- | --- | --- | ---
OS X   | ✔       | ✔      | ✔      | ✔     | -   | -   | -   | -  
Win 7  | ✔       | ✔      | ✔      | ✔     | ✔   | ✔   | ✔   | -  
Win XP | ✔       | ✔      | ✔      | ✔     | -   | ✔   | ✔   | ✔  
Ubuntu | ✔       | ✔      | -      | ✔     | -   | -   | -   | -  

#### 中文排版的重点和难点

在中文排版中，HTML4 的很多标准在语义在都有照顾到。但从视觉效果上，却很难利用单独的 CSS 来实现，像
<abbr title="在文字下多加一个点">着重号</abbr>（例：这里<em class="typo-em">强调一下</em>）。在 HTML4 中，专名号标签（_<u>_）已经被放弃，而
HTML5 被[重新提起](http://html5doctor.com/u-element/)。_Typo.css_ 也根据实际情况提供相应的方案。我们重要要注意的两点是：

1.  语义：语义对应的用法和样式是否与中文排版一致
2.  表现：在各浏览器中的字体、大小和缩放是否如排版预期

对于这些，_Typo.css_ 排版项目的中文偏重注意点，都添加在附录中，详见：

> **附录一**：[_Typo.css_ 排版偏重点](https://typo.sofi.sh/#appendix1)

目前已有像百姓网等全面使用 _Typo.css_ 的项目，测试平台的覆盖，特别是在
<abbr title="手机、平板电脑等移动平台">移动端</abbr>上还没有覆盖完主流平台，希望有能力的同学能加入测试行列，或者加入到 _Typo.css_
的开发。加入方法：[参与 _Typo.css_ 开发](https://github.com/sofish/Typo.css)。如有批评、建议和意见，也随时欢迎给在 Github 直接提 [issues](https://github.com/sofish/Typo.css/issues)，或给
<abbr title="Sofish Lin, author of Typo.css" role="author">我</abbr>发[邮件](mailto:sofish@icloud.com)。

## 二、排版实例：

提供2个排版实例，第一个中文实例来自于来自于
<cite class="typo-unique">张燕婴</cite>的《论语》，由于古文排版涉及到的元素比较多，所以采用《论语》中《学而》的第一篇作为排版实例介绍；第2个来自到经典的
Lorem Ipsum，并加入了一些代码和列表等比较具有代表性的排版元素。

### 例1：论语学而篇第一

<small><b>作者：</b><abbr title="名丘，字仲尼">孔子</abbr>（<time>前551年9月28日－前479年4月11日</time>）
</small>

#### 本篇引语

《学而》是《论语》第一篇的篇名。《论语》中各篇一般都是以第一章的前二三个字作为该篇的篇名。《学而》一篇包括16章，内容涉及诸多方面。其中重点是「吾日三省吾身」；「节用而爱人，使民以时」；「礼之用，和为贵」以及仁、孝、信等道德范畴。 

#### 原文

子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知，而不愠，不亦君子乎？」 

#### 译文

孔子说：「学了又时常温习和练习，不是很愉快吗？有志同道合的人从远方来，不是很令人高兴的吗？人家不了解我，我也不怨恨、恼怒，不也是一个有德的君子吗？」 

#### 评析

宋代著名学者<u class="typo-u">朱熹</u>对此章评价极高，说它是「入道之门，积德之基」。本章这三句话是人们非常熟悉的。历来的解释都是：学了以后，又时常温习和练习，不也高兴吗等等。三句话，一句一个意思，前后句子也没有什么连贯性。但也有人认为这样解释不符合原义，指出这里的「学」不是指学习，而是指学说或主张；「时」不能解为时常，而是时代或社会的意思，「习」不是温习，而是使用，引申为采用。而且，这三句话不是孤立的，而是前后相互连贯的。这三句的意思是：自己的学说，要是被社会采用了，那就太高兴了；退一步说，要是没有被社会所采用，可是很多朋友赞同
<abbr title="张燕婴">我</abbr>的学说，纷纷到我这里来讨论问题，我也感到快乐；再退一步说，即使社会不采用，人们也不理解我，我也不怨恨，这样做，不也就是君子吗？（见《齐鲁学刊》1986年第6期文）这种解释可以自圆其说，而且也有一定的道理，供读者在理解本章内容时参考。

此外，在对「人不知，而不愠」一句的解释中，也有人认为，「人不知」的后面没有宾语，人家不知道什么呢？当时因为孔子有说话的特定环境，他不需要说出知道什么，别人就可以理解了，却给后人留下一个谜。有人说，这一句是接上一句说的，从远方来的朋友向我求教，我告诉他，他还不懂，我却不怨恨。这样，「人不知」就是「人家不知道我所讲述的」了。这样的解释似乎有些牵强。

总之，本章提出以学习为乐事，做到人不知而不愠，反映出孔子学而不厌、诲人不倦、注重修养、严格要求自己的主张。这些思想主张在《论语》书中多处可见，有助于对第一章内容的深入了解。

### 例2：英文排版

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's
standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a
type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining
essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum
passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem
Ipsum.

>   Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
>   aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

#### The standard Lorem Ipsum passage, used since the 1500s

"Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

#### Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC

"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam,
eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim
ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi
consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur,
vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?"

#### List style in action

* If you wish to succeed, you should use persistence as your good friend, experience as your reference, prudence as
        your brother and hope as your sentry.

    如果你希望成功，当以恒心为良友，以经验为参谋，以谨慎为兄弟，以希望为哨兵。

* Sometimes one pays most for the things one gets for nothing.

    有时候一个人为不花钱得到的东西付出的代价最高。

* Only those who have the patience to do simple things perfectly ever acquire the skill to do difficult things
        easily.

    只有有耐心圆满完成简单工作的人，才能够轻而易举的完成困难的事。

#### You may want to create a perfect _<hr />_ line, despite the fact that there will never have one

---

<abbr title="法国作家罗切福考尔德">La Racheforcauld</abbr> said:
<mark>"Few things are impossible in themselves; and it is often for want of will, rather than of means, that man fails
to succeed".
</mark>
You just need to follow the browser's behavior, and set a right _margin_ to it。it will works nice as the
demo you're watching now. The following code is the best way to render typo in Chinese:

<pre>
/* 标题应该更贴紧内容，并与其他块区分，margin 值要相应做优化 */
h1,h2,h3,h4,h5,h6 {
    line-height:1;font-family:Arial,sans-serif;margin:1.4em 0 0.8em;
}
h1{font-size:1.8em;}
h2{font-size:1.6em;}
h3{font-size:1.4em;}
h4{font-size:1.2em;}
h5,h6{font-size:1em;}

/* 现代排版：保证块/段落之间的空白隔行 */
.typo p, .typo pre, .typo ul, .typo ol, .typo dl, .typo form, .typo hr {
    margin:1em 0 0.6em;
}
</pre>

### 三、附录

##### 1、_Typo.css_ 排版偏重点


类型  | 语义 | 标签 | 注意点
-|-|-|-
基础标签 | 标题 |  _h1_ ～ _h6_ | 全局不强制大小，_.typo_ 中标题与其对应的内容应紧贴，并且有相应的大小设置
上、下标 | _sup_/_sub_| 保持与 MicroSoft Office Word 等程序的日常排版一致
引用 | _blockquote_ | 显示/嵌套样式
缩写 | _abbr_ | 是否都有下划线，鼠标 _hover_ 是否为帮助手势
分割线 | _hr_   | 显示的 _padding_ 和 _margin_正确
列表 | _ul_/_ol_/_dl_ | 在全局没有 _list-style_，在 ._typo_ 中对齐正确
定义列表 | _dl_  | 全局 _padding_ 和 _margin_为0， ._typo_ 中对齐正确
选项 | _input[type=radio[, checkbox]]_ | 与其他 _form_ 元素排版时是否居中
斜体 | _i_ | 只设置一种斜体，让 _em_ 和 _cite_ 显示为正体
强调 | _em_ | 在全局显示正体，在 _.typo_ 中显示与 _b_ 和 _strong_ 的样式一致，为粗体
加强 | _strong/b_| 显示为粗体
标记 | _mark_ | 类似荧光笔
印刷 | _small_| 保持为正确字体的 80% 大小，颜色设置为浅灰色
表格 | _table_ | 全局不显示线条，在 _table_ 中显示表格外框，并且表头有浅灰背景
代码 | _pre_/_code_| 字体使用 _courier_ 系字体，保持与 _serif_ 有比较一致的显示效果
特殊符号 | 着重号  | _在文字下加点_ | 在支持 _:after_ 和 _:before_ 的浏览器可以做渐进增强实现  
专名号 | <u>林建锋</u> | 专名号，有下划线，使用 _u_ 或都 _.typo-u_ 类
破折号 | —— | 保持一划，而非两划
人民币 | ¥ | 使用两平等线的符号，或者 HTML 实体符号 _&yen;_
删除符 | ~~已删除（deleted）~~ | 一致化各浏览器显示，中英混排正确
加强类 | 专名号 | _.typo-u_ | 由于 _u_ 被 HTML4 放弃，在向后兼容上推荐使用 _.typo-u_
着重符 | _.typo-em_ | 利用 _:after_ 和 _:before_ 实现着重符
清除浮动 | _.clearfix_  | 与一般 CSS Reset 保持一对致 API

注意点:<br/>
（1）中英文混排行高/行距<br/>
（2）上下标在 IE 中显示效果<br/>
（3）块/段落分割空白是否符合设计原则<br/>
（4）input 多余空间问题<br/>
（5）默认字体色彩，目前采用 _#333_ 在各种浏览显示比较好<br/>

##### 2、开源许可

_Typo.css_ 基于 [MIT License](http://zh.wikipedia.org/wiki/MIT_License) 开源，使用代码只需说明来源，或者引用 [license.txt](http://typo.sofi.sh/license.txt) 即可。