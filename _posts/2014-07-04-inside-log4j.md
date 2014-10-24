---
layout: post
title: 深入理解Log4j工作原理
category: 后台技术
tags: Log4j
---

###Log4j简介
Log4J最核心的也就5个类：

> Logger用于对日志记录行为的抽象，提供记录不同级别日志的接口
> Level对日志级别的抽象
> Appender是对记录日志形式的抽象
> Layout是对日志行格式的抽象
> LoggingEvent是对一次日志记录过程中所能取到信息的抽象

它们之间的关系如下：

![]({{ site.url }}/public/blog-img/log4j/Log4JCoreClassDiagram.png)

而，它们工作的序列图如下：

![]({{ site.url }}/public/blog-img/log4j/Log4JCoreSequence.png)

即获取Logger实例->判断Logger实例对应的日志记录级别是否要比请求的级别低->若是调用forceLog记录日志->创建LoggingEvent实例->将LoggingEvent实例传递给Appender->Appender调用Layout实例格式化日志消息->Appender将格式化后的日志信息写入该Appender对应的日志输出中。

###Logger层次与继承
Logger遵循类似包的层次。如

```java      
Logger rootLog = Logger.getRootLogger();        
Logger logA = Logger.getLogger("AClass");           
Logger logB = Logger.getLogger("AClass.BClass");           
Logger logC = Logger.getLogger("AClass.BClass.CClass"); 
```
           
那么rootLog是logA的父Logger，logA是logB的父Logger，logC是logB的Logger。Logger象Java中的类继承一样，子记录器可以继承父Logger的设置信息，也可以覆写相应的信息。

####Logger层次的继承有什么用处？
假设程序中的每个包都会输出一些公共的日志信息，而每个包的不同子包又有一些特殊的日志信息要输出，这种情况就可以象处理Java中的类一样，运用Logger中的层次关系来达到目的。假设有个名为A的包，有名为A,B的两个子包。现在需要将A包下的所有类都要把日志信息输出到控制台中；A.B包除了输出到控制台外还要输出到文件中；A.C包除了输出到控制台中还要输出到HTML文档中。

####如何使用记录器层次的继承？
通过Logger.getLogger(XXX.Class.getName())来取得Logger对象。现在我们假设A.B的包下有一个类CClass，那么当调用Logger.getLogger(CClass.class.getName())时，最理想的情况是返回名为A.B.CClass的Logger对象。但是如果不存在名为A.B.CClass的Logger时它会怎样呢？其实通过Logger类的getLogger方法取得记录器时存在下面两种情况：

> 1.如果存在与所要找的名字完全相同的Logger，则返回相应的Logger对象。  
> 2.但如果找不到，它会尝试返回记录器层次中与所要找的Logger最接近的祖先Logger对象。

###Appender层次与继承
同Logger的层次继承类似，Appender也有类似的继承关系。继承层次底层的Logger可以使用其祖先的Appender。不用每个Logger都设置Appender，底层Logger没有设置Appender的情况下，可以一次性从祖先Logger中直接将更换Logger的Appender。实现方法：从自己开始向祖先方法访问各Logger的Appenders。如果继承属性（additive）为false，则在调用了自己所有的Appender后，就直接跳出循环。 

###参考：
[http://logging.apache.org/log4j/1.2/manual.html](http://logging.apache.org/log4j/1.2/manual.html)            
[http://blog.csdn.net/shrekmu/article/details/271777](http://blog.csdn.net/shrekmu/article/details/271777)             



(完)




