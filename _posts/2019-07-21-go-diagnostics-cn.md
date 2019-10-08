---
layout: post
title: 译 | Diagnostics
last_modified_at: 2019-10-08
category: Golang
tags: Profile
keywords:
  - Golang Profile Trace Debug
---

* TOC
{:toc}

### Introduction

Go生态系统提供了大量API和工具来诊断Go程序中的逻辑和性能问题。 此页面总结了可用的工具，并帮助Go用户针对他们的特定问题选择正确的工具。

诊断解决方案可分为以下几组：
- **Profiling**：Profiling 工具分析Go程序的复杂性和成本，例如其内存使用情况和频繁调用的函数，以识别Go程序的昂贵部分。
- **Tracing**：Tracing 是一种检测代码的方法，用于分析调用或用户请求的整个生命周期中的延迟。 Traces 提供了每个组件对系统总体延迟影响的概览。 Traces 可以跨越多个Go进程。
- **Debugging**: Debugging 允许我们暂停Go程序并检查其执行。可以通过 debugging 验证程序状态和流程。
- **Runtime statistics and events**： 对运行时统计信息、事件的收集和分析提供了Go程序运行状况的高层次概览。 指标的尖峰/下降有助于我们识别吞吐量，利用率和性能的变化。

> 注意：某些诊断工具可能会相互干扰。 例如，精确的 memory profiling 会扭曲 CPU profiles，而goroutine blocking profiling 会影响 scheduler trace。 隔离使用工具可获得更精确的信息。

### Profiling

Profiling 对于识别昂贵或经常调用的代码段很有用。 Go runtime 以 [pprof 可视化工具](https://github.com/google/pprof/blob/master/doc/README.md)所期望的格式提供 [profiling data](https://golang.org/pkg/runtime/pprof/)。 在测试期间可以通过 `go test` 或 [net/http/pprof](https://golang.org/pkg/net/http/pprof/) 包提供的 endpoints 收集 profiling data。 用户需要收集 profiling data 并使用 pprof 工具来过滤和可视化顶部代码路径。

[runtime/pprof](https://golang.org/pkg/runtime/pprof) 包提供的预定义 profiles：

- **cpu**: CPU profile 确定程序在活跃的消耗CPU周期（而不是在睡眠或等待I/O时）花费时间的位置。
- **heap**: Heap profile  报告内存分配样本; 用于监视当前和历史内存使用情况，并检查内存泄漏。
- **threadcreate**: Thread creation profile 报告程序中导致创建新OS线程的部分。
- **goroutine**: Goroutine profile 报告所有当前 goroutines 的 stack traces。
- **block**: Block profile 显示goroutine阻止等待同步原语（包括 timer channels）的位置。 Block profile 默认情况下未开启; 使用 `runtime.SetBlockProfileRate` 启用。
- **mutex**: Mutex profile 报告锁竞争。 如果您认为由于互斥竞争而未充分利用您的CPU，请使用此 profile。 Mutex profile 默认情况下未开启，请参阅 `runtime.SetMutexProfileFraction` 启用。


**我可以使用其他哪些 profilers 来介绍Go程序？**

在Linux上，[perf tools](https://perf.wiki.kernel.org/index.php/Tutorial) 可用于分析Go程序。 Perf 可以 profile 和展开 cgo/SWIG 代码和内核，因此深入了解native/内核性能瓶颈非常有用。 在macOS上， [Instruments](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/) 套件可以用来 profile Go 程序。

**我可以 profile 我的生产环境的服务吗？**

是的。 在生产环境中对程序进行 profile 是安全的，但启用某些 profiles（例如：CPU profile）会增加消耗。 您应该会看到性能降级。 在生产中打开探测器之前，可以通过测量 profiler 的开销来估计性能损失。

您可能希望定期分析您的生产服务。 特别是在具有单进程多副本的系统中，定期选择随机副本是安全的选择。 选择一个生产服务，  每隔Y秒 profile X秒并保存结果以进行可视化和分析; 然后定期重复。 可以 手动/自动 检查结果以发现问题。 profiles 收集可能会相互干扰，因此建议一次只收集一个 profile。

**可视化分析数据的最佳方法是什么？**

Go tools使用 [`go tool pprof`](https://github.com/google/pprof/blob/master/doc/README.md) 提供文本，图形和 [callgrind](http://valgrind.org/docs/manual/cl-manual.html) 可视化的 profile data。 阅读 [Profiling Go programs](https://blog.golang.org/profiling-go-programs) 以查看它们的实际使用。

![738fb1d54bd36c74ac3c98052ed7db24.png](https://storage.googleapis.com/golangorg-assets/pprof-text.png)

> 文本方式查看最大的消耗的调用

![9271bb2658eb3b3fb8bf034d2675f4d2.png](https://storage.googleapis.com/golangorg-assets/pprof-dot.png)

> 图片方式可视化最大的消耗的调用

Weblist视图在HTML页面中逐行显示源代码最大消耗的部分。 在以下示例中，530ms用于 `runtime.concatstrings`，每行的消耗显示在列表中。

![18b069d57a4f697cc580ea69478dea77.png](https://storage.googleapis.com/golangorg-assets/pprof-weblist.png)

> weblist方式可视化最大的消耗的调用

另一种可视化轮廓数据的方法是[火焰图](http://www.brendangregg.com/flamegraphs.html)。 火焰图允许您在特定的祖先路径中移动，因此您可以放大/缩小特定的代码段。[upstream pprof](https://github.com/google/pprof)支持火焰图。

![77471e15e5c54e282982377b454320c5.png](https://storage.googleapis.com/golangorg-assets/flame.png)

> 火焰图方式可视化以发现最昂贵的代码路径

**我是否仅限于内置profiles？**

除了 runtime 提供的工具之外，Go用户还可以通过 [pprof.Profile](https://golang.org/pkg/runtime/pprof/#Profile) 创建自定义 profiles，并使用现有工具对其进行检查。

**我可以在不同的路径和端口上提供 profiler handlers(/debug/pprof/...) 吗？**

是的。 默认情况下， `net/http/pprof` 包将其 handlers 注册到默认的mux，但您也可以使用从包中导出的handler net/http/pprof注册它们。

例如，以下示例将在7777端口/custom_debug_path/profile上提供 pprof.Profile handler：

``` go
package main

import (
	"log"
	"net/http"
	"net/http/pprof"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/custom_debug_path/profile", pprof.Profile)
	log.Fatal(http.ListenAndServe(":7777", mux))
}
```

### Tracing

Tracing 是一种检测代码的方法，用于分析一系列调用的生命周期中的延迟。 Go提供 [golang.org/x/net/trace](https://godoc.org/golang.org/x/net/trace) 包作为每个Go节点的最小 tracing backend，并提供一个带有简单仪表板的最小检测库。 Go还提供了一个执行跟踪器来跟踪时间间隔内的 runtime events。

Tracing 使我们能够：

- 检测和分析Go进程中应用程序延迟。
- 衡量一长串调用中特定调用的耗时。
- 弄清楚使用情况和性能改进点。 没有tracing数据，瓶颈并不总是显而易见。

在单机系统中，从程序的构成模块收集诊断数据相对容易。 所有模块都位于一个进程中，并共享公共资源以报告日志，错误和其他诊断信息。一旦您的系统超出单个进程并开始变为分布式，跟踪从前端Web服务器到其所有后端的调用，直到将响应返回给用户，将变得更加困难。这就是分布式 tracing 在检测和分析生产系统方面发挥重要作用的地方。

分布式 tracing 是一种检测代码的方法，用于分析用户请求在整个生命周期中的延迟。 当系统分布式化，并且传统的分析和调试工具无法scale时，您可能希望使用分布式 tracing 工具来分析用户请求和RPC的性能。

分布式 tracing 使我们能够：

- 检测和分析在大系统中的应用延迟。
- 跟踪用户请求生命周期内的所有RPC，并发现仅在生产中可见的集成问题。
- 找出可应用于我们系统的性能改进点。 在收集 tracing 数据之前，许多瓶颈并不明显。

GO生态系统为每个跟踪系统提供了不同的分布式跟踪库和后端无关的跟踪库。

**有没有办法自动拦截每个函数调用并创建 tracing ？**

Go没有提供自动拦截每个函数调用和创建trace spans的方法。 您需要手动检测代码以创建，结束和注释 spans。

**我应该如何在Go库中传播 trace headers ？**

您可以在 [`context.Context`](https://golang.org/pkg/context#Context) 传播trace标识符和标记。 目前行业中还没有 trace key 的规范和 trace headers 的通用表示。 每个tracing提供程序都负责在其Go库中提供传播工具。

**标准库或 runtime 中的其他低级事件可以包含在 trace 中吗？**

标准库和 runtime 试图公开几个额外的API来通知低级内部事件。 例如， [`httptrace.ClientTrace`](https://golang.org/pkg/net/http/httptrace#ClientTrace) 提供API以跟踪传出请求生命周期中的低级事件。 目前正在努力从 runtime execution tracer 中检索低级运行时事件，并允许用户定义和记录其用户事件。

### Debugging

Debugging 是识别程序错误行为的过程。调试器允许我们理解程序的执行流程和当前状态。有几种调试方式；本节只关注将调试器 attach 到程序和 core dump 调试。

GO用户主要使用以下调试器：
- [Delve](https://github.com/derekparker/delve) ：Delve是Go编程语言的调试器。 它支持Go的 runtime 概念和内置类型。 Delve正试图成为Go程序的全功能可靠调试器。
- [GDB](https://golang.org/doc/gdb) ：Go通过标准Go编译器和 Gccgo 提供 GDB 支持。 堆栈管理、线程和运行时包含的方面与 GDB 执行模型有足够的不同，因此可能会使调试器难以理解。即使程序是使用 gccgo 编译的。 尽管GDB可用于调试Go程序，但它并不理想，可能会造成混乱。

**调试器与 Go 程序的兼容性如何？**

`gc` 编译器执行优化，例如函数内联和变量注册。 这些优化有时会使调试器调试更困难。 目前正在努力提高优化后的二进制文件的DWARF 信息的质量。 在这些改进可用之前，我们建议在构建正在调试的代码时禁用优化。 以下命令构建一个没有编译器优化的包：

``` sh
$ go build -gcflags=all="-N -l"
```

作为改进工作的一部分，Go 1.10引入了一个新的编译器flag  `-dwarflocationlists`。 该标志使编译器添加位置列表，以帮助调试器使用优化后的二进制文件。 以下命令构建使用优化但包含 DWARF 位置列表的包：

``` sh
$ go build -gcflags="-dwarflocationlists=true"
```

**推荐的用户界面调试器是什么？**

尽管 delve 和 gdb 都提供了 CLI，但大多数集成编辑器和IDE都提供了特定于调试的用户界面。

**是否可以使用Go程序进行事后调试？**

core dump 文件是包含正在运行的进程及其进程状态的 memory dump 文件。 它主要用于程序的事后调试，并了解它仍在程序运行时的状态。 这两种情况使 core dump 的调试成为一种良好的诊断工具，可用于事后分析和分析生产服务。 可以从Go程序获取core文件，并使用delve或gdb进行调试，请参阅 [core dump debugging](https://golang.org/wiki/CoreDumpDebugging) 页面以获取分步指南。


### Runtime statistics and events

runtime 为用户提供内部事件的统计信息和报告，以便在 runtime 级别诊断性能和利用率问题。

用户可以监控这些统计数据，以更好地了解Go程序的整体运行状况和性能。 一些经常监控的统计数据和状态：

- `[runtime.ReadMemStats](https://golang.org/pkg/runtime/#ReadMemStats)` 报告与堆分配和垃圾回收相关的metrics。 内存统计信息对于监视进程正在消耗多少内存资源，进程是否可以很好地利用内存以及捕获内存泄漏非常有用。
- `[debug.ReadGCStats](https://golang.org/pkg/runtime/debug/#ReadGCStats)` 读取有关垃圾收集的统计信息。 查看有多少资源用于GC暂停非常有用。 它还报告垃圾收集器暂停和暂停时间百分比的 timeline。
- `[debug.Stack](https://golang.org/pkg/runtime/debug/#Stack)` 返回当前 stack trace。stack trace 有助于查看当前正在运行的 goroutine 数量，它们正在执行的操作，以及它们是否被阻塞。
- `[debug.WriteHeapDump](https://golang.org/pkg/runtime/debug/#WriteHeapDump)` 挂起所有 goroutine 的执行，并允许您将堆 dump 到文件中。 heap dump 是给定时间Go进程的内存快照。 它包含所有已分配的对象以及 goroutine，finalizers 等。
- `[runtime.NumGoroutine](https://golang.org/pkg/runtime#NumGoroutine)` 返回当前 goroutine 的数量。 可以监视该值以查看是否使用了足够的goroutine，或检测goroutine泄漏。

#### Execution tracer

Go附带了一个runtime execution tracer，用于捕获各种运行时事件。 调度，系统调用，垃圾收集，堆大小和其他由 runtime 收集的事件，并可通过 go tool trace 进行可视化。 Execution tracer 是一种检测延迟和利用率问题的工具。 您可以检查CPU的使用情况，以及当网络或系统调用成为goroutines抢占的原因。

Tracer 使我们能够：
- 了解你的 goroutines 如何执行。
- 了解一些核心 runtime 事件，例如GC运行。
- 识别并行化不足的执行。

但是，识别热点（如分析内存过多或CPU使用率的原因）并不是很好用。 首先使用 profiling tools 来解决它们。

![229748672006e67fead3212695e267cc.png](https://storage.googleapis.com/golangorg-assets/tracer-lock.png)

以上，go tool trace 可视化显示执行开始正常，然后它变得顺序化。 它表明可能存在共享资源的锁竞争导致的瓶颈。

请参阅 [`go tool trace`](https://golang.org/cmd/trace/) 以收集和分析 runtime traces。

#### GODEBUG

如果相应地设置了 [GODEBUG](https://golang.org/pkg/runtime/#hdr-Environment_Variables) 环境变量，Runtime 也会发出事件和信息。

- GODEBUG=gctrace=1 在每个集合中打印垃圾收集器事件，总结收集的内存量和暂停的长度。
- GODEBUG=schedtrace=X 每X毫秒打印一次调度事件。

GODEBUG 环境变量可用于禁用标准库和 runtime 中 instruction set extensions 的使用。

- GODEBUG=cpu.all=off 禁用所有可选指令集扩展的使用。
- GODEBUG=cpu._extension_=off 禁止使用指定指令集扩展中的指令。 
> extension 是指令集扩展名的小写名称，例如 sse41 或 avx 。

_原文：[https://golang.org/doc/diagnostics.html](https://golang.org/doc/diagnostics.html)_
