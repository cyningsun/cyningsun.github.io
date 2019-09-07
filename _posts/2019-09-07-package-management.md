---
layout: post
title: 一张图看懂Go包管理历史
---

* TOC
{:toc}


![]({{ site.url }}/public/blog-img/go-package-management/package-management.png)

#### 时间线
- 2012年3月 Go 1 发布，此时没有版本的概念
- 2013年 Golang 团队在 FAQ 中提议开发者保证相同 `import path` 的兼容性，后来成为一纸空文
- 2013年10月 [Godep](https://github.com/tools/godep)
- 2014年7月 [glide](https://github.com/Masterminds/glide)
- 2014年 有人提出 `external packages` 的概念，在项目的目录下增加一个 vendor 目录来存放外部的包
- 2015年8月  Go 1.5 实验性质加入 vendor 机制
- 2015年 有人提出了采用语义化版本的草案
- 2016年2月 Go 1.6 vendor 机制 默认开启
- 2016年5月 Go 团队的 Peter Bourgon 建立委员会，讨论依赖管理工具，也就是后面的 dep
- 2016年8月 Go 1.7: vendor 目录永远启用
- 2017年1月 Go 团队发布 [Dep](https://github.com/golang/dep)，作为准官方试验
- 2018年8月 Go 1.11发布 [Modules](https://golang.org/doc/go1.11#modules) 作为官方试验
- 2019年2月 Go 1.12发布 [Modules](https://golang.org/doc/go1.12#modules) 默认为 auto

#### 混沌初开
Go 从 Google 走出来，内部使用 blaze 系统，所以项目的源代码公用一个 repo, 任何修改都要跑 test 保证整个 repo 不出问题。因此 go get仅仅支持获取 master branch 上的 latest 代码，没有指定 version、branch 或 revision 的能力。

对应的开源的方案就是一个 $GOPATH 走天下，并没有关心依赖问题。如此做法会给gopher带来不便：依赖的第三方包总是在变。一旦第三方包提交了无法正常build或接口不兼容的代码，依赖方立即就会受到影响，但开源社区是无穷多个小 repo 的合集，像 go get 直接拉个最新的 master 版本带来了隐患：依赖一更新，已有代码就可能编译不过。

> “If you’re using an externally supplied package and worry that it might change in unexpected ways, the simplest solution is to copy it to your local repository. (This is the approach Google takes internally.) Store the copy under a new import path that identifies it as a local copy. For example, you might copy `original.com/pkg` to `you.com/external/original.com/pkg`.” - [Go FAQ](https://golang.org/doc/faq#get_version)

#### 八龙治水
第一个主要的社区工具是 [Godep](https://github.com/tools/godep)。早期它提供了一种方法来快照您在您使用的VCS修订版GOPATH，然后将其恢复到GOPATH。这为不同的应用程序提供了一种使用相同依赖项的不同修订版的方法。

Godep 确实有一些在应用程序之间切换时必须执行的手动步骤。例如，您需要将该应用程序的依赖项修订版还原到GOPATH。但是，它可以与Google工作流程一起工作，因此它可以工作。

大约在同一时间，社区自发形成了其他各式各样的包管理工具，仅[官方推荐的包管理工具](https://github.com/golang/go/wiki/PackageManagementTools)总数就有15种之多，大部分工具都解决了差不多的问题，只是使用上有些许的区别。这些眼花缭乱工具，对选择困难症来说，不是什么好事情。

#### 乾坤始奠
时间走到了 2015 年，Golang 官方终于看不下去了，在推出 go1.5 版本的同时，首次实验性质的加入了 vendor 机制 功能。vendor 标准化了项目依赖的第三方库的存放位置（不再需要Godeps/\_workspace了），同时也无需对GOPATH环境变量进行“偷梁换柱”了，go compiler原生优先感知和使用vendor下缓存的第三方包。

只是有了 vendor，就有了官方的正名！项目的形态也跟以前的统一起来了，好处显而易见。但即便有了vendor的支持，vendor内第三方依赖包的代码的管理依旧是不规范的，要么是手动的，要么是借助godep这样的第三方包管理工具。 Go 项目自身对 vendor 中代码的管理方式也是手动更新，Go自身并未使用任何第三方的包管理工具。

从Go官方角度出发，官方go包依赖的解决方案的下一步就应该是解决对vendor下的第三方包如何进行管理的问题：依赖包的分析、记录和获取等，进而实现项目的reproducible build。

#### 继往开来
2018年初，Go team 的技术 Leader，[Russ Cox](https://research.swtch.com/) 在[博客](https://research.swtch.com/)上连续发表[七篇文章](https://research.swtch.com/vgo)，系统阐述了 Go team “包依赖管理”方案: [vgo](https://github.com/golang/vgo)。vgo 主要思路包括：[Semantic Import Versioning](https://research.swtch.com/vgo-import)、[Minimal Version Selection](https://research.swtch.com/vgo-mvs)、[引入Go module](https://research.swtch.com/vgo-module)等。文章引发了Go社区激烈地争论，让很多 Go 包管理工具的维护者“不满”，其中包括“准官方工具”：[dep](https://github.com/golang/dep)。vgo方案的提出也意味着dep项目等一系列包管理工具的生命周期即将进入尾声。

2018年5月，Russ Cox的 [Proposal “cmd/go: add package version support to Go toolchain”](https://github.com/golang/go/issues/24301) 被 accepted，此后 vgo 代码 merge 到 Go 主干，并正式命名为“modules”。后续Go modules机制将直接在Go主干上继续演化。



#### 参考
- [https://xuanwo.io/2019/05/27/go-modules/](https://xuanwo.io/2019/05/27/go-modules/)
- [https://blog.lab99.org/post/golang-2017-10-09-video-the-new-era-of-go-package-management.html](https://blog.lab99.org/post/golang-2017-10-09-video-the-new-era-of-go-package-management.html)
- [https://www.zhihu.com/question/52177662](https://www.zhihu.com/question/52177662)
- [https://dave.cheney.net/tag/dependency-management](https://dave.cheney.net/tag/dependency-management)
- [https://juejin.im/entry/5b04fb8c51882542ac7d99e5](https://juejin.im/entry/5b04fb8c51882542ac7d99e5)
- [https://nathany.com/go-packages/](https://nathany.com/go-packages/)
- [https://www.ardanlabs.com/blog/2013/10/manage-dependencies-with-godep.html](https://www.ardanlabs.com/blog/2013/10/manage-dependencies-with-godep.html)
- [https://golang.org/doc/devel/release.html](https://golang.org/doc/devel/release.html)
- [https://tonybai.com/2018/07/15/hello-go-module/](https://tonybai.com/2018/07/15/hello-go-module/)