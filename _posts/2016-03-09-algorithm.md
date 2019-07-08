---
layout: post
title: 常用算法文档汇总
category: 后台技术
tags:  算法
---

* TOC
{:toc}

### 哈希算法

http://www.cnblogs.com/Jack47/p/bloom_filter_intro.html Bloom Filter  多哈希函数映射的快速查找算法

http://coolshell.cn/articles/17225.html   Cuckoo Filter  多哈希函数映射的快速查找算法



###字符串匹配算法
Trie、KMP、BM算法、Sunday算法、AC自动机、后缀树







#### 更新记录
 2016-03-09 新增Bloom/Cuckoo Filter算法
 2016-03-22 听取了QQ关系链和用户资料平台的存储，多阶哈希可以用于对读写要求较高的热点数据的存储还是挺不错的选择，但是需要容忍Master-nSlave架构下的数据丢失以及写不可用。