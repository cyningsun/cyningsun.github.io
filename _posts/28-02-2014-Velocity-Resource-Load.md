---
layout: post
title: Velocity资源加载过程
category: 后台技术
---

以下全文根据小明哥(minghe)的讲解总结而来:）
####资源加载的主要角色：
　**ResourceManager:**　资源的管理者，负责资源的加载，过期缓存的更新。

　**ResourceCache:**　资源缓存的位置，使用线程安全的LRU Map的封装。

　**ResourceLoader:**　资源的加载者，根据数据源不同，Velocity六种类型的Loader，也可以实现自己的Loader。

　**StringResourceRepository:**　资源的寄存器，若Repository中有有效的数据则不用再从数据源读取数据。

　**Resource:**　资源的抽象：包含资源本身以及过期时间、过期检查间隔、上次修改时间等资源相关的信息。
####角色间的关系：

　在有资源请求到来的时候，ResourceManager会根据以下步骤予以响应：

　　1、查询ResourceCache中的资源并检查是否过期。有数据且未过期，直接返回数据；无数据或已过期，步骤2

　　2、遍历ResourceLoader数组，使用Loader尝试加载数据，得到数据中止返回数据(若配置了缓存，则存放缓存)。

　　Ps:若是StringResourceLoader，会首先去StringResourceRepository取数据，然后再去加载数据。

**Finally**，VelocityEngine/VelocityServlet获取模板资源，向RuntimeInStance的ResourceManager请求数据，拿到Template数据。
剩余的就是渲染引擎的工作了。

(完)


---
