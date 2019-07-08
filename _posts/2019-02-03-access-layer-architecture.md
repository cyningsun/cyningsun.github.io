---
layout: post
title: 高可用的接入层架构细节实现
category: 后台开发
tags: architecture
---

* TOC
{:toc}

### 背景
在绝大多数互联网公司中，接入层由基础架构部门或者云服务提供商提供，是透明可靠的一层。开发者只需要关心如何做好下层业务就可以了。最近遇到需要从零开始搭建流媒体服务，进而有机会去研究如何保证服务的整体高可用，其中很大的一部分就是在于接入层的高可用。

### 接入架构
以Web服务为例，接入层的工作流程可以分为以下几个部分：
- DNS，请求经过浏览器域名解析，被转发到接入路由IP
- 数据转发，请求从到路由到负载均衡服务，保证业务服务可以平行扩展
- 业务处理，具体的业务服务，接收到请求处理返回


整个过程涉及的组件和服务包括：**DNS**、**路由**、**负载均衡服务**、**业务服务**。那么这些组件都要考虑容灾处理。话不多说先上图，然后逐个说明容灾如何做：


![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzhtqllcphj20uu0hi0us.jpg)


### DNS
了解DNS之前，首先熟悉一个概念，FQDN（Fully Qualified Domain Name），我们在浏览器中输入的域名是按照FQDN来定义的。格式指定了域名的各个部分与DNS服务对应关系，至少包括了Top-Level Domain和Second-Level Domain两个部分。以 api.aws.amazon.com 为例，该域名做以下拆解：
![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzgsa6rkr2j20m80c1did.jpg)

每个层级的解析服务使用域名的指定部分，最终将域名解析为类似如图的IP列表：
![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzj0x3prutj20ya09u75k.jpg)

在网络请求的时候，为了保证耗时，DNS查询并不是每次都会发生。浏览器及所在终端会将DNS结果缓存一段时间。假如IP绑定的路由出现故障，就需要将IP从域名记录中去掉，然而该操作并不会立刻生效。

#### 域名缓存

域名解析可能在访问终端系统、本地递归域名解析服务器两个环节被缓存住。

- 终端缓存特征<br/>
终端的缓存是由终端应用（如PC浏览器）控制的，一般情况下会遵循域名解析结果的TTL规范，也就是在域名有效期过期后会自动重新请求，因此这个时间是可预期的，也是可控的（通过修改权威TTL）。
- 递归域名服务器缓存特征<br/>
本地递归域名服务器一般由提供服务的ISP设置，服务器自身也是由ISP维护，公网上存在大量的递归域名服务器不遵循权威的TTL，导致我们的域名解析修改不生效（全球生效时间最长可能有72小时之久）。

由上面的分析可以知道，域名解析不生效最重要的诱因是递归域名服务器不能及时更新解析结果。那么为了预防这种问题出现，路由容灾就尤为重要了。

### 路由容灾
- VRRP: Virtual Router Redundancy Protocol

路由怎么容灾呢，这里就引入一个新概念VRRP（Virtual Router Redundancy Protocol，虚拟路由器冗余协议）。VRRP将局域网内的一组路由器划分在一起，称为一个备份组。备份组由一个Master路由器和多个Backup路由器组成，功能上相当于一台虚拟路由器。当一个路由出现问题可以自动切换到由Backup路由器提供给服务

VRRP具体是怎么做的呢？<br/>
- 虚拟路由器具有IP地址，称为虚拟IP地址。局域网内的主机仅需要知道这个虚拟路由器的IP地址。
- 网络内的主机通过这个虚拟路由器与外部网络进行通信。
- 备份组内的路由器根据优先级，选举出Master路由器，承担网关功能。其他路由器作为Backup路由器，当Master路由器发生故障时，取代Master继续履行网关职责，从而保证网络内的主机不间断地与外部网络进行通信。

![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzj8txuazkj20jb09o3z5.jpg)


如上图所示，两台路由R1和R2构成构成一个备份组，使用虚拟IP 10.10.10.1 对外提供服务。

请求平稳经过路由，是不是可以直接到服务了呢？答案是不可以。一个服务器性能再高，总是会有可见的顶点。要提供可靠的互联网服务，需要平行扩展的能力，那一个路由就需要对接多个服务。

![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzj9cne01ej20m20cvdg8.jpg)

但是如何保证多个服务的负载均衡呢？此时就需要引入负载均衡服务进行请求转发，也就需要保证负载均衡服务的容灾。

### 负载均衡服务容灾

常见的负载均衡服务按照工作的网络层次分为：L4负载均衡服务和L7负载均衡服务（当然，也还有L5层次的负载均衡软件）。业界主要的负载均衡软件有**LVS**、**Nginx**、**HAProxy**，我们以LVS为例来说明如何进行这一层的容灾。

#### LVS: Linux Virtual Server

![]({{ site.url }}/public/blog-img/access-layer-architecture/bcaaa65bgy1fzjaa15hlqg20ka0bogm7.gif)

LVS可以使用Keepalived等心跳服务和VIP，类似路由器容灾来完成主备服务的切换。

> Keepalived常跟Heartbeat比较，该谁来进行容灾，具体的选择标准很简单：
> 
> - a cluster-oriented product such as heartbeat will ensure that a shared resource will be present at **at most** one place. This is very important for shared filesystems, disks, etc... It is designed to take a service down on one node and up on another one during a switchover. That way, the shared resource may never be concurrently accessed. This is a very hard task to accomplish and it does it well.
> - a network-oriented product such as keepalived will ensure that a shared IP address will be present at **at least** one place. Please note that I'm not talking about a service or resource anymore, it just plays with IP addresses. It will not try to down or up any service, it will just consider a certain number of criteria to decide which node is the most suited to offer the service. But the service must already be up on both nodes. As such, it is very well suited for redundant routers, firewalls and proxies, but not at all for disk arrays nor filesystems.
> 
> 来源：[http://www.formilux.org/archives/haproxy/1003/3259.html](http://www.formilux.org/archives/haproxy/1003/3259.html)

与Nginx和HAProxy比较，LVS作为L4的负载均衡服务尤其突出，一般对性能要求比较高的架构，都会使用它来进行转发。如果有需要在再下游接入Nginx或者HAproxy作为L7的Web请求转发。

### 业务服务容灾

业务层的容灾常常是依靠上游的服务来完成，例如Keepalived的健康检查或者nginx的故障摘除模块，以达到容灾的目的。


### 总结

从以上的说明我们就能够清晰的弄清楚接入层做了什么，如何保证平行扩展的能力；如何保证在故障发生的时候，能够保证尽量少的对用户的影响和人工介入，快速恢复。