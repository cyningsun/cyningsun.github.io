---
layout: post
title:  值得一读的文章和博客
category: 后台开发
tags:  
---

### 文章列表
[C语言：数组和指针的区别](http://coolshell.cn/articles/17225.html)：数组就是数组，只是右值表示的对象，左值表示对象的起始地址，而C语言允许内存地址的直接操作，仅此而已。

[语言的数据亲和力](http://www.cnblogs.com/weidagang2046/archive/2011/06/27/2091765.html)：选择语言的根本原因是利用这个语言的优势，C语言的字节亲和力；Shell/Python等脚本语言的文本亲和力；JavaScript弱类型语言对结构化文本的亲和力

[实例分析Java Class的文件结构](http://coolshell.cn/articles/9229.html):Java的Class文件对应了内存的对象模型。

[C/C++ Volatile关键词深度剖析](http://hedengcheng.com/?p=725):C语言的volatile关键字是一个很尴尬的关键字，只防止编译器优化导致指令重排的问题，但是却没有解决CPU指令执行的的乱序。并发的内存模型涉及到三点：操作的原子性、缓存一致性(Java的可见性)、顺序一致性(Java有序性)。  
[《C++0x漫谈》系列之：多线程内存模型](http://blog.csdn.net/pongba/article/details/1659952)：详细介绍当前C++在多线程环境下面临的问题。

[深入理解Java内存模型](http://www.infoq.com/cn/author/%E7%A8%8B%E6%99%93%E6%98%8E#文章):系列文章，主要是从Happens-before原则说明指令重排对并发的影响，如果了解linux的内存屏障机制可能会更好理解些，然后重点说明了并发中的volatile和锁

[REST构架风格介绍之一：状态表述转移](http://www.cnblogs.com/weidagang2046/archive/2009/05/08/1452322.html)   
[REST构架风格介绍之二：CRUD](http://www.cnblogs.com/weidagang2046/archive/2009/05/09/1453065.html)  
[理解本真的REST架构风格](http://www.infoq.com/cn/articles/understanding-restful-style):三篇文章可以帮助理解REST起源和Web服务的关系

[理解HTTP幂等性](http://www.cnblogs.com/weidagang2046/archive/2011/06/04/2063696.html):从事务的幂等性角度分析HTTP的GET、DELETE、PUT、POST四种主要方法的语义。Web开发中应该选择合适的方法对应合适的语义，在只有POST和GET的世界里我们是否已经偏离太远。

[跨域资源共享 CORS 详解](http://www.ruanyifeng.com/blog/2016/04/cors.html)：介绍清楚了跨域情况下浏览器为什么会request cancled

[浏览器缓存知识小结及应用](http://www.cnblogs.com/lyzg/p/5125934.html):浏览器的强制缓存和协商缓存的字段和机制


[SQL中的where条件，在数据库中提取与应用浅析](http://hedengcheng.com/?p=577)    
[MYSQL查询计划KEY_LEN全知道](http://www.innomysql.com/article/25241.html)：清晰SQL执行过程使用了索引的哪部分。
[MySQL查询优化浅析](http://hedengcheng.com/?p=372)：简明清晰的介绍了Where语句中的条件是如何使用索引的，如果了解数据库以B+树构建索引等基础知识能弄清楚该怎么优化一条SQL(附带推荐《MySQL技术内幕:InnoDB存储引擎》)


[利用tcpcopy引流做模拟在线测试](http://www.searchtb.com/2012/05/using-tcpcopy-to-simulate-traffic.html)：tcpcopy进行线上流量的转发，interception进行应答拦截丢弃。使用线上流量验证和测试，保证服务平稳迭代上线。


[分布式系统的事务处理](http://coolshell.cn/articles/10910.html)：十分清晰的介绍了分布式系统的算法和模型，例如微信后台系统常用的NWR模型、Paxos算法


### 精品博客
[Todd Wei](http://www.cnblogs.com/weidagang2046)

[酷壳](http://coolshell.cn/)

[何登成的技术博客](http://hedengcheng.com/) 

[刘未鹏\|C++的罗浮宫](http://blog.csdn.net/pongba)


(未完待续~)
