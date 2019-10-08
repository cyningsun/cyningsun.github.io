---
layout: post
title: 译｜Let’s talk about logging
last_modified_at: 2019-10-08
category: Golang
tags: Logging
keywords:
  - 日志 logging
  - 错误 error
---

本文受 [Nate Finch started on the Go Forum](https://forum.golangbridge.org/t/whats-so-bad-about-the-stdlibs-log-package/1435/) 的一个话题启发。本文专注于 Go，但是如果你能看透，我认为这里提出的想法是广泛适用的。

### Why no love ?

Go 的 [log package](https://golang.org/pkg/log/) 没有日志级别，你必须自己手动添加 debug、info、warn 和 error 等前缀。另外，Go 的 日志类型无法以包为基础打开或者关闭这些不同级别。通过比较，让我们看一些第三方的替代品：

Google 的 [glog](https://godoc.org/github.com/golang/glog) 提供以下级别：
* Info
* Warning
* Error
* Fatal (终止程序)

看看另外一个库， 我们为 Juju 开发的 [loggo](https://godoc.org/github.com/juju/loggo)，提供以下级别：

* Trace
* Debug
* Info
* Warning
* Error
* Critical

Loggo 还提供了根据每个包调整日志的详细程度的功能。

因此，以上两个示例显然受到其他语言的其他日志库的影响。实际上，它们的命令行可以追溯到 syslog(3)，甚至更早。我认为他们是错的。

我站相反的立场。我认为_所有_日志库都不好，因为它提供了_太多_的功能。一系列令人困惑的选择，使程序员必须清楚地思考如何与未来的读者沟通，而读者将要使用他们的日志。

我认为成功的日志包需要的功能要少得多，当然需要的级别也更少。

### Let’s talk about warnings

我们从最简单的一个开始。没有人需要 warning 的日志级别。

没有人阅读 warning，因为按照定义，没有出错。也许将来会出问题，但这听起来像是别人的问题。

此外，如果你在使用某种分级日志，那么为什么将级别设置为 warning? 你可以将级别设置为 info 或 error。将级别设置为 warning 是承认你可能正在以 warninng 级别打印错误日志

消除 warning 级别，因为它既可能是信息性的消息，也可能是错误的情况。（潜台词：语义不明确）

### Let’s talk about fatal

Fatal 级别，有效打印消息日志，然后调用 `os.Exit(1)`。原则上，这意味着：
* 其他goroutines中的defer语句不会运行。
* 缓冲区不刷新。
* 临时文件和目录不会被删除。

实际上，`log.Fatal` 的详细程度要比 `panic` 少，但在语义上却等同于它。

普遍认为，库不应该使用 panic<sup>1</sup>，但是如果调用 log.Fatal<sup>2</sup> 具有相同的效果，那么当然也应该将其定为非法。

解决此清理问题的建议是，可以通过在日志系统中注册 shutdown handler，但如此导致日志系统与发生清理操作的每个位置之间紧密耦合。它也违反了关注点分离。

不要以 `Fatal` 级别写日志，而要将错误返回给调用方。如果错误一直冒泡到 `main.main`, 那么退出之前，是处理所有清理操作的正确位置。

### Let’s talk about error

错误处理和日志密切相关，因此从表面上看，以 error 级别进行日志打印应该很容易解释。但，我不同意。

在 Go 中，如果函数或方法调用返回错误值，实际上您有两个选择：
* 处理错误
* 将错误返回给您的呼叫者（您可以选择包装错误，但这对于本次讨论并不重要）

如果您选择通过打印日志来处理错误，那么按照定义，你已经处理了它，错误就不存在了。打印错误处理错误的行为，意味着不再适合将其打印为错误日志。

让我尝试用以下代码片段说服您：
``` go
err := somethingHard()
if err != nil {
        log.Error("oops, something was too hard", err)
        return err // what is this, Java ?
}
```

您永远不应该在 error 级别打印任何内容的日志，因为您应该处理错误，或者将其传递回调用方。

准确地说，我并不是说您不应该将发生的情况打印日志
``` code
if err := planA(); err != nil {
        log.Infof("could't open the foo file, continuing with plan b: %v", err)
        planB()
}
```

但实际上 `log.Info` 和 `log.Error` 有异曲同工之妙。

我并不是说不要打印错误日志！相反，问题是，最小的日志API是什么？当提到错误时，我相信绝大多数打印日志为 error 级别的项目，都是通过这种简单地方式完成的，因为它们与错误相关。实际上，它们只是提供信息，意味着可以从API中删除以 error 级别打印日志。

### What’s left ?

我们已经排除了 warning，认为不应该以 error 级别打印任何内容的日志，并且表明只有应用程序的顶层应该具有某种 `log.Fatal` 行为。还剩什么 ？

我认为只有两种东西您应该打印日志：

1. 开发人员在开发或调试软件时会关心的东西。
2. 用户在使用您的软件时关心的东西。

显然，分别是 debug 和 info 级别。

`log.Info` 应该简单地将该行写入日志输出。不应有将其关闭的选项，因为仅应告知用户对他们有用的事情。如果发生_无法_处理的错误，它将冒泡到 `main.main`， 程序终止的地方。必须在最后一条日志消息前面插入 _FATAL_ 前缀，或直接用 `fmt.Fprintf` 写入 `os.Stderr` 所带来的小小不便，不足以解释日志包需要添加 `log.Fatal` 方法。

`log.Debug`，则完全不同。由开发人员或支持工程师控制。在开发过程中，调试语句应足够多，而不必求助于 trace 或 debug<sup>2</sup> 级别。日志包应支持细粒度的控制，以启用或禁用调试，并且仅在该包或可能更精细的范围内的语句调试。

### Wrapping up

如果这是推特民意调查，请您选择

* 打印日志很重要
* 打印日志很难

但是事实是，打印日志是两者兼而有之。解决这个问题的方法_必须_是解构和残酷地消除不必要的干扰。

你怎么看？这仅仅是疯狂到足以工作，还是纯粹是疯狂的？


### Notes

1. 一些库可能使用 `panic`/`recover` 作为内部控制流机制，但最重要的原则是它们一定不能让这些控制流操作泄漏到程序包边界之外。
2. 具有讽刺意味的是，尽管缺少 debug 级别的输出，但 Go 标准日志包同时具有 `Fatal` 和 `Panic` 功能。在此程序包中，导致程序突然退出的功能数量超过了没有退出功能的数量。

_原文：[https://dave.cheney.net/2015/11/05/lets-talk-about-logging](https://dave.cheney.net/2015/11/05/lets-talk-about-logging)_