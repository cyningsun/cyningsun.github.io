---
layout: post
title: 译 | Profiling Go Programs
---

* TOC
{:toc}

### 背景
在Scala Days 2011，Robert Hundt 发表了一篇名为 [Loop Recognition in C++/Java/Go/Scala](http://research.google.com/pubs/pub37122.html) 的论文。 该论文实现了一种特定的循环查找算法，例如您可以在C++，Go，Java，Scala编译器的流分析传递中使用，然后使用这些程序得到这些语言中典型性能问题的结论。该论文中的Go程序运行速度非常慢，使它成为演示的绝佳机会：如何使用Go的分析工具来实现慢速程序并使其更快。

_通过使用Go的分析工具来识别和纠正特定的瓶颈，可以使Go loop finding程序运行速度提高一个数量级，并减少6倍的内存。_
> 更新：由于最近gcc中libstdc++优化，现在内存减少是3.7倍。

Hundt的论文没有说明他使用的C++，Go，Java和Scala工具的版本。 在这篇博文中，我们将使用6g Go编译器的最新每周快照以及Ubuntu Natty发行版附带的g++版本。（我们不会使用Java或Scala，因为我们不擅长用这两种语言编写高效的程序，所以这种比较是不公平的。因为C++是论文中最快的语言，所以这里与C++的比较应该足够了。）
> 更新：在这篇更新的帖子中，我们将使用amd64上Go编译器的最新开发快照以及2013年3月发布的最新版g++ - 4.8.0。

``` sh
$ go version
go version devel +08d20469cc20 Tue Mar 26 08:27:18 2013 +0100 linux/amd64
$ g++ --version
g++ (GCC) 4.8.0
Copyright (C) 2013 Free Software Foundation, Inc.
...
$
```

程序运行在配备3.4GHz Core i7-2600 CPU 16 GB RAM的Gentoo Linux's 3.8.4-gentoo内核的计算机上。 通过以下代码禁用了机器的CPU频率调整：
``` sh
$ sudo bash
# for i in /sys/devices/system/cpu/cpu[0-7]
do
    echo performance > $i/cpufreq/scaling_governor
done
#
```

我们采用 [Hundt's benchmark programs](https://github.com/hundt98847/multi-language-bench) 的C++和Go部分，将每个程序组合成一个单独的源文件，并删掉了除一行输出之外的所有内容。我们将使用Linux的time工具为程序计时 ，其格式显示为 user time, system time, real time, and maximum memory usage:
> Mac OS 需要 `brew install gnu-time`，使用 gtime 命令替代

``` sh
$ cat xtime
#!/bin/sh
/usr/bin/time -f '%Uu %Ss %er %MkB %C' "$@"
$

$ make havlak1cc
g++ -O3 -o havlak1cc havlak1.cc
$ ./xtime ./havlak1cc
# of loops: 76002 (total 3800100)
loop-0, nest: 0, depth: 0
17.70u 0.05s 17.80r 715472kB ./havlak1cc
$

$ make havlak1
go build havlak1.go
$ ./xtime ./havlak1
# of loops: 76000 (including 1 artificial root node)
25.05u 0.11s 25.20r 1334032kB ./havlak1
$
```

C++程序运行使用17.80秒 700 MB内存。 Go程序运行使用25.20秒 1302 MB的内存。（该结果很难与论文中的统一，但本文的重点是探索如何使用 `go tool pprof`，而不是重现论文的结果。）


### CPU Profile

要调优Go程序，我们必须启用profiling。 如果代码使用[Go testing package](https://golang.org/pkg/testing/)的benchmarking分析，可以使用gotest标准的 `-cpuprofile` 和 `-memprofile flags` 。 我们必须在程序中导入 `runtime/pprof` 并添加几行代码：
``` go
var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")

func main() {
    flag.Parse()
    if *cpuprofile != "" {
        f, err := os.Create(*cpuprofile)
        if err != nil {
            log.Fatal(err)
        }
        pprof.StartCPUProfile(f)
        defer pprof.StopCPUProfile()
    }
    ...
```

新代码定义了一个名为 `cpuprofile` 的flag，调用 [Go flag library](https://golang.org/pkg/flag/) 来解析命令行flags，如果在命令行上设置了 `cpuprofile` flag，则 [starts CPU profiling](https://golang.org/pkg/runtime/pprof/#StartCPUProfile) 重定向到该文件。 在程序退出之前，profiler 需要最后调用 [`StopCPUProfile`](https://golang.org/pkg/runtime/pprof/#StopCPUProfile) 来flush未写入文件的数据; 我们使用 `defer` 来确保在 `main` 返回前执行该调用。

添加该代码后，我们可以使用新的 `-cpuprofile` flag 运行程序，然后运行 `go tool pprof` 来解释 profile。
``` sh
$ make havlak1.prof
./havlak1 -cpuprofile=havlak1.prof
# of loops: 76000 (including 1 artificial root node)
$ go tool pprof havlak1 havlak1.prof
Welcome to pprof!  For help, type 'help'.
(pprof)
```
`go tool pprof` 程序是 [Google's `pprof` C++ profiler](https://github.com/gperftools/gperftools) 的细微变体。最重要的命令是 `topN` ，显示profile中 top `N` 的样本：
``` sh
(pprof) top10
Total: 2525 samples
     298  11.8%  11.8%      345  13.7% runtime.mapaccess1_fast64
     268  10.6%  22.4%     2124  84.1% main.FindLoops
     251   9.9%  32.4%      451  17.9% scanblock
     178   7.0%  39.4%      351  13.9% hash_insert
     131   5.2%  44.6%      158   6.3% sweepspan
     119   4.7%  49.3%      350  13.9% main.DFS
      96   3.8%  53.1%       98   3.9% flushptrbuf
      95   3.8%  56.9%       95   3.8% runtime.aeshash64
      95   3.8%  60.6%      101   4.0% runtime.settype_flush
      88   3.5%  64.1%      988  39.1% runtime.mallocgc
```
CPU profiling 启用时，Go程序每秒大约停止100次，并在当前正在执行的goroutine堆栈上记录由程序计数器组成的样本。 该 profile 有2525个样本，因此运行时间超过25秒。 在 `go tool pprof` 输出中，样本中出现的每个函数都有一行。 
- 前两列显示函数运行的样本数（而不是等待被调用函数返回），展示为原始计数和总样本的百分比。 `runtime.mapaccess1_fast64` 函数在298个样本期间运行(11.8％)。 `top10` 输出按样本计数排序。 
- 第三列显示了清单期间的运行总数：前三行占样本的32.4％。 
- 第四和第五列显示函数出现的样本数（运行或等待被调用的函数返回）。 `main.FindLoops`函数在10.6％的样本中运行，但是它在84.1％的样本中位于调用堆栈（它或它的调用正在运行）上。

要按第四和第五列排序，要使用 `-cum`（for cumulative）flag：
``` sh
(pprof) top5 -cum
Total: 2525 samples
       0   0.0%   0.0%     2144  84.9% gosched0
       0   0.0%   0.0%     2144  84.9% main.main
       0   0.0%   0.0%     2144  84.9% runtime.main
       0   0.0%   0.0%     2124  84.1% main.FindHavlakLoops
     268  10.6%  10.6%     2124  84.1% main.FindLoops
(pprof) top5 -cum
```

事实上， `main.FindLoops` 和 `main.main` 的总数应该是100％，但每个堆栈样本只包含底部的100个堆栈帧; 在大约四分之一的样本中，递归 `main.DFS` 函数比 `main.main` 深100多帧，因此完整的trace被截断。

stack trace样本包含有关函数调用关系，不是文本列表可以显示的有趣数据。 `web` 命令以SVG格式输出profile数据为图像，并在Web浏览器中打开它。 （还有一个 `gv` 命令可以编写PostScript并在Ghostview中打开它。两个命令都需要安装 [graphviz](http://www.graphviz.org/) 。）
``` sh
(pprof) web
```
[完整图形](https://rawgit.com/rsc/benchgraffiti/master/havlak/havlak1.svg)的一小部分如下：

![51e0591fac0ac7e287fccce13aedcf00.png](https://blog.golang.org/profiling-go-programs_havlak1a-75.png)

图中的每个框对应于一个函数，并且框根据函数运行的样本数来确定大小。 从方框X到方框Y的线表示X调用Y; 沿线的数字是调用在样本中出现的次数。 如果在单个样本中多次出现呼叫，例如在递归函数调用期间，则每次出现都会计入线权重。 解释了从 `main.DFS` 到自身的线的上的权重：21342。

我们可以一目了然看到该程序将大部分时间花在哈希操作上，这与使用Go的 `map` 值相对应。 我们让 `web` 只使用包含特定函数的样本，例如 `runtime.mapaccess1_fast64` ，可以清除图中的一些噪音：

``` sh
(pprof) web mapaccess1
```
![493783d8971606f7fb0eef78f95565cc.png](https://blog.golang.org/profiling-go-programs_havlak1-hash_lookup-75.png)

如果斜视，我们可以看到 `main.FindLoops` 和 `main.DFS` 对 `runtime.mapaccess1_fast64` 的调用。

现在我们已经大致了解了大局，现在是时候放大一个特定的函数了。 让我们先看看 `main.DFS`  ，因为它是一个较短的函数：
``` sh
(pprof) list DFS
Total: 2525 samples
ROUTINE ====================== main.DFS in /home/rsc/g/benchgraffiti/havlak/havlak1.go
   119    697 Total samples (flat / cumulative)
     3      3  240: func DFS(currentNode *BasicBlock, nodes []*UnionFindNode, number map[*BasicBlock]int, last []int, current int) int {
     1      1  241:     nodes[current].Init(currentNode, current)
     1     37  242:     number[currentNode] = current
     .      .  243:
     1      1  244:     lastid := current
    89     89  245:     for _, target := range currentNode.OutEdges {
     9    152  246:             if number[target] == unvisited {
     7    354  247:                     lastid = DFS(target, nodes, number, last, lastid+1)
     .      .  248:             }
     .      .  249:     }
     7     59  250:     last[number[currentNode]] = lastid
     1      1  251:     return lastid
(pprof)
```

该清单显示了 `DFS` 函数的源代码（实际上，显示了与正则表达式 `DFS` 匹配的每个函数）。 前三列是运行该行时的样本数，运行该行或该行调用的代码的样本数，以及文件中的行号。 相关命令 `disasm` 可以显示函数的反汇编而不是源代码清单; 当有足够的样本时，可以帮助您查看哪些指令很昂贵。 `weblist` 命令混合了两种模式：[它显示了一个源列表，单击一行显示反汇编](https://rawgit.com/rsc/benchgraffiti/master/havlak/havlak1.html)。

由于我们已经知道时间花费在哈希运行时函数实现的映射查找，因此我们最关注的是第二列。 在递归调用 `DFS` （第247行）中花费了很大一部分时间，符合递归遍历的期望。 排除递归，看起来时间是花费在第242,246和250行的 `number` map的访问。对于特定查找，map 不是最有效的选择。 正如它们在编译器中一样，basic block 结构具有分配给它们的唯一序列号。 我们可以使用 `[]int` 替代 `map[*BasicBlock]int`，这是一个由block number索引的slice。 当数组或slice可以使用时，没有理由使用map。

将 `number` 从map更改为slice需要在程序中编辑七行，并将其运行时间减少近1/2：
``` sh
$ make havlak2
go build havlak2.go
$ ./xtime ./havlak2
# of loops: 76000 (including 1 artificial root node)
16.55u 0.11s 16.69r 1321008kB ./havlak2
$
```
> 见: [`havlak1` vs `havlak2` diff](https://github.com/rsc/benchgraffiti/commit/58ac27bcac3ffb553c29d0b3fb64745c91c95948)


### GC Memory Profile 

我们可以再次运行 profiler 来确认 `main.DFS` 不再是运行时间中重要的组成部分：
``` sh
$ make havlak2.prof
./havlak2 -cpuprofile=havlak2.prof
# of loops: 76000 (including 1 artificial root node)
$ go tool pprof havlak2 havlak2.prof
Welcome to pprof!  For help, type 'help'.
(pprof)
(pprof) top5
Total: 1652 samples
     197  11.9%  11.9%      382  23.1% scanblock
     189  11.4%  23.4%     1549  93.8% main.FindLoops
     130   7.9%  31.2%      152   9.2% sweepspan
     104   6.3%  37.5%      896  54.2% runtime.mallocgc
      98   5.9%  43.5%      100   6.1% flushptrbuf
(pprof)
```
条目 `main.DFS` 不再出现在 profile 中，程序 runtime 的其余部分也已消失。 现在该程序花费大部分时间来分配内存和垃圾收集（ `runtime.mallocgc`，分配和运行定期垃圾收集，占54.2％的时间）。 为了找出垃圾收集器运行如此多的原因，我们必须找出分配内存的原因。 一种方法是向程序添加 memory profiling。 我们改写程序，如果提供 `-memprofile` flag，程序在循环查找一次迭代后停止，写入 memory profile，并退出：
``` go
var memprofile = flag.String("memprofile", "", "write memory profile to this file")
...

    FindHavlakLoops(cfgraph, lsgraph)
    if *memprofile != "" {
        f, err := os.Create(*memprofile)
        if err != nil {
            log.Fatal(err)
        }
        pprof.WriteHeapProfile(f)
        f.Close()
        return
    }
```

我们使用  `-memprofile` flag 调用程序写入 profile：
``` sh
$ make havlak3.mprof
go build havlak3.go
./havlak3 -memprofile=havlak3.mprof
$
```
> 见: [diff from havlak2](https://github.com/rsc/benchgraffiti/commit/b78dac106bea1eb3be6bb3ca5dba57c130268232)

我们以完全相同的方式使用 `go tool pprof`。 现在我们正在检查的样本是内存分配，而不是时钟周期。
``` sh
$ go tool pprof havlak3 havlak3.mprof
Adjusting heap profiles for 1-in-524288 sampling rate
Welcome to pprof!  For help, type 'help'.
(pprof) top5
Total: 82.4 MB
    56.3  68.4%  68.4%     56.3  68.4% main.FindLoops
    17.6  21.3%  89.7%     17.6  21.3% main.(*CFG).CreateNode
     8.0   9.7%  99.4%     25.6  31.0% main.NewBasicBlockEdge
     0.5   0.6% 100.0%      0.5   0.6% itab
     0.0   0.0% 100.0%      0.5   0.6% fmt.init
(pprof)
```

命令 `go tool pprof` 显示 `FindLoops` 分配了正在使用的大约56.3个82.4 MB; `CreateNode` 占另外的17.6 MB。 为了减少开销，内存分析器分配每半兆字节大约只记录一个块的信息。（“1-in-524288采样率”），因此这些是实际计数的近似值。

要查找内存分配，我们可以列出这些函数。

``` sh
(pprof) list FindLoops
Total: 82.4 MB
ROUTINE ====================== main.FindLoops in /home/rsc/g/benchgraffiti/havlak/havlak3.go
  56.3   56.3 Total MB (flat / cumulative)
...
   1.9    1.9  268:     nonBackPreds := make([]map[int]bool, size)
   5.8    5.8  269:     backPreds := make([][]int, size)
     .      .  270:
   1.9    1.9  271:     number := make([]int, size)
   1.9    1.9  272:     header := make([]int, size, size)
   1.9    1.9  273:     types := make([]int, size, size)
   1.9    1.9  274:     last := make([]int, size, size)
   1.9    1.9  275:     nodes := make([]*UnionFindNode, size, size)
     .      .  276:
     .      .  277:     for i := 0; i < size; i++ {
   9.5    9.5  278:             nodes[i] = new(UnionFindNode)
     .      .  279:     }
...
     .      .  286:     for i, bb := range cfgraph.Blocks {
     .      .  287:             number[bb.Name] = unvisited
  29.5   29.5  288:             nonBackPreds[i] = make(map[int]bool)
     .      .  289:     }
...
```
看起来当前的瓶颈与上一个瓶颈相同：在原本使用更简单的数据结构就足够时使用 map。 `FindLoops` 正在分配大约29.5 MB的 maps。

顺便说一句，如果我们使用`--inuse_objects` flag 运行 `go tool pprof` ，它将报告分配计数而不是大小：
``` sh
$ go tool pprof --inuse_objects havlak3 havlak3.mprof
Adjusting heap profiles for 1-in-524288 sampling rate
Welcome to pprof!  For help, type 'help'.
(pprof) list FindLoops
Total: 1763108 objects
ROUTINE ====================== main.FindLoops in /home/rsc/g/benchgraffiti/havlak/havlak3.go
720903 720903 Total objects (flat / cumulative)
...
     .      .  277:     for i := 0; i < size; i++ {
311296 311296  278:             nodes[i] = new(UnionFindNode)
     .      .  279:     }
     .      .  280:
     .      .  281:     // Step a:
     .      .  282:     //   - initialize all nodes as unvisited.
     .      .  283:     //   - depth-first traversal and numbering.
     .      .  284:     //   - unreached BB's are marked as dead.
     .      .  285:     //
     .      .  286:     for i, bb := range cfgraph.Blocks {
     .      .  287:             number[bb.Name] = unvisited
409600 409600  288:             nonBackPreds[i] = make(map[int]bool)
     .      .  289:     }
...
(pprof)
```

由于~200,000个 maps 占29.5 MB，因此初始 map 分配大约需要150个字节。 map 用于保存键值对是合理的，但是在此处map被用作简单集合的替代是不合理的。

我们可以使用简单的slice来列出元素，而不是使用map。 在使用 map 的所有情况中，一种情况要除外，map不可能插入重复的元素。在下面的的一个例子中，我们可以编写一个简单的“append”内置函数变体：
``` go
func appendUnique(a []int, x int) []int {
    for _, y := range a {
        if x == y {
            return a
        }
    }
    return append(a, x)
}
```
除了编写该函数之外，将Go程序更改为使用slices而不是maps需要更改几行代码。

``` sh
$ make havlak4
go build havlak4.go
$ ./xtime ./havlak4
# of loops: 76000 (including 1 artificial root node)
11.84u 0.08s 11.94r 810416kB ./havlak4
$
```
> 见： [diff from havlak3](https://github.com/rsc/benchgraffiti/commit/245d899f7b1a33b0c8148a4cd147cb3de5228c8a)

现在的速度比开始时快2.11倍。 让我们再看一下CPU profile。

### GC CPU Profile 

``` sh
$ make havlak4.prof
./havlak4 -cpuprofile=havlak4.prof
# of loops: 76000 (including 1 artificial root node)
$ go tool pprof havlak4 havlak4.prof
Welcome to pprof!  For help, type 'help'.
(pprof) top10
Total: 1173 samples
     205  17.5%  17.5%     1083  92.3% main.FindLoops
     138  11.8%  29.2%      215  18.3% scanblock
      88   7.5%  36.7%       96   8.2% sweepspan
      76   6.5%  43.2%      597  50.9% runtime.mallocgc
      75   6.4%  49.6%       78   6.6% runtime.settype_flush
      74   6.3%  55.9%       75   6.4% flushptrbuf
      64   5.5%  61.4%       64   5.5% runtime.memmove
      63   5.4%  66.8%      524  44.7% runtime.growslice
      51   4.3%  71.1%       51   4.3% main.DFS
      50   4.3%  75.4%      146  12.4% runtime.MCache_Alloc
(pprof)
```
现在内存分配和随后的垃圾收集（`run time.mallocgc`）占我们运行时间的50.9%。

另一种查看系统为什么进行垃圾收集的方法是查看导致收集的分配，即查看在 `mallocgc`中花费大部分时间的地方：
``` sh
(pprof) web mallocgc
```

![35ac62c841354eb45e656849967ee81a.png](https://blog.golang.org/profiling-go-programs_havlak4a-mallocgc.png)

很难看清楚图中发生了什么，因为有许多节点的样本数量很少，这些节点模糊了大样本的。我们可以让 `go tool pprof` 忽略少于10%占比的样本节点：

``` sh
$ go tool pprof --nodefraction=0.1 havlak4 havlak4.prof
Welcome to pprof!  For help, type 'help'.
(pprof) web mallocgc
```

![a9b324420bfda40b3c3a274bf4652f78.png](https://blog.golang.org/profiling-go-programs_havlak4a-mallocgc-trim.png)

我们现在可以轻松地遵循粗箭头，看看 `FindLoops` 是否触发了大部分垃圾收集。 如果我们列出 `FindLoops` 们可以看到，大部分在开始时是正确的：

``` sh
(pprof) list FindLoops
...
     .      .  270: func FindLoops(cfgraph *CFG, lsgraph *LSG) {
     .      .  271:     if cfgraph.Start == nil {
     .      .  272:             return
     .      .  273:     }
     .      .  274:
     .      .  275:     size := cfgraph.NumNodes()
     .      .  276:
     .    145  277:     nonBackPreds := make([][]int, size)
     .      9  278:     backPreds := make([][]int, size)
     .      .  279:
     .      1  280:     number := make([]int, size)
     .     17  281:     header := make([]int, size, size)
     .      .  282:     types := make([]int, size, size)
     .      .  283:     last := make([]int, size, size)
     .      .  284:     nodes := make([]*UnionFindNode, size, size)
     .      .  285:
     .      .  286:     for i := 0; i < size; i++ {
     2     79  287:             nodes[i] = new(UnionFindNode)
     .      .  288:     }
...
(pprof)
```

每次调用 `FindLoops` ，它都会分配一些相当大的 bookkeeping structures。 由于benchmark调用 `FindLoops` 50次，因此这些增加了大量的垃圾，所以垃圾收集器的工作量很大。

使用垃圾收集语言并不意味着您可以忽略内存分配问题。 在这种情况下，一个简单的解决方案是引入一个缓存，以便每次调用 `FindLoops` 时尽可能重用前一个调用的存储。
> 事实上，在Hundt的论文中，他解释说Java程序只需要进行这种改变就可以得到合理的性能，但是他没有在其他垃圾收集的实现中做出相同的改变。

我们将添加一个全局cache结构：
``` go
var cache struct {
    size int
    nonBackPreds [][]int
    backPreds [][]int
    number []int
    header []int
    types []int
    last []int
    nodes []*UnionFindNode
}
```

然后把它当作 `FindLoops` 内存分配的替代品：
``` go
if cache.size < size {
    cache.size = size
    cache.nonBackPreds = make([][]int, size)
    cache.backPreds = make([][]int, size)
    cache.number = make([]int, size)
    cache.header = make([]int, size)
    cache.types = make([]int, size)
    cache.last = make([]int, size)
    cache.nodes = make([]*UnionFindNode, size)
    for i := range cache.nodes {
        cache.nodes[i] = new(UnionFindNode)
    }
}

nonBackPreds := cache.nonBackPreds[:size]
for i := range nonBackPreds {
    nonBackPreds[i] = nonBackPreds[i][:0]
}
backPreds := cache.backPreds[:size]
for i := range nonBackPreds {
    backPreds[i] = backPreds[i][:0]
}
number := cache.number[:size]
header := cache.header[:size]
types := cache.types[:size]
last := cache.last[:size]
nodes := cache.nodes[:size]
```

当然，这样的全局变量是糟糕的工程实践：它意味着对 `FindLoops` 并发调用现在是不安全的。 目前，我们正在进行尽可能少的更改，以便了解对我们的程序的性能有什么重要意义; 这种变化很简单，并且反映了Java实现中的代码。 Go程序的最终版本将使用单独的 `LoopFinder` 实例来跟踪此内存，从而恢复并发使用的可能性。
``` sh
$ make havlak5
go build havlak5.go
$ ./xtime ./havlak5
# of loops: 76000 (including 1 artificial root node)
8.03u 0.06s 8.11r 770352kB ./havlak5
$
```
> 见 [diff from havlak4](https://github.com/rsc/benchgraffiti/commit/2d41d6d16286b8146a3f697dd4074deac60d12a4)


### 总结

我们可以做更多的事情来清理程序并使其更快，但是它们都不需要我们尚未展示的分析技术。 内部循环中使用的工作列表可以跨迭代和跨调用进行重用。 FindLoops，它可以与在该过程中生成的单独的“节点池”相结合。 类似地，循环图存储可以在每次迭代时重用，而不是重新分配。 除了这些性能变化之外， [最终版本](https://github.com/rsc/benchgraffiti/blob/master/havlak/havlak6.go)是使用惯用的Go样式编写的，使用数据结构和方法。 风格变化对运行时间的影响很小：算法和约束不变。

最终版本运行2.29秒，使用351 MB内存：
``` sh
$ make havlak6
go build havlak6.go
$ ./xtime ./havlak6
# of loops: 76000 (including 1 artificial root node)
2.26u 0.02s 2.29r 360224kB ./havlak6
$
```

这比我们开始的程序快11倍。 即使我们禁用对生成的循环图的重用，以便唯一的缓存内存是循环查找bookeeping，程序仍然比原始运行速度快6.7倍，并且使用的内存减少1.5倍。
``` sh
$ ./xtime ./havlak6 -reuseloopgraph=false
# of loops: 76000 (including 1 artificial root node)
3.69u 0.06s 3.76r 797120kB ./havlak6 -reuseloopgraph=false
$
```
当然，将这个Go程序与原始的C++程序进行比较是不公平的，因为它使用了低效的数据结构，例如 `set`s 其中 `vector`s 更合适。 作为完整性检查，我们将最终的Go程序翻译成[等效的C++代码](https://github.com/rsc/benchgraffiti/blob/master/havlak/havlak6.cc)。 它的执行时间类似于Go程序：
``` sh
$ make havlak6cc
g++ -O3 -o havlak6cc havlak6.cc
$ ./xtime ./havlak6cc
# of loops: 76000 (including 1 artificial root node)
1.99u 0.19s 2.19r 387936kB ./havlak6cc
```

Go程序的运行速度几乎和C++程序一样快。 由于C++程序使用自动删除和分配而不是显式缓存，因此C++程序更短更容易编写，但不是那么明显：
``` sh
$ wc havlak6.cc; wc havlak6.go
 401 1220 9040 havlak6.cc
 461 1441 9467 havlak6.go
$
```
> 见 [havlak6.cc](https://github.com/rsc/benchgraffiti/blob/master/havlak/havlak6.cc) 和 [havlak6.go](https://github.com/rsc/benchgraffiti/blob/master/havlak/havlak6.go)

Benchmarks与他们测量的程序一样好。 我们使用 `go tool pprof` 来研究低效的Go程序，然后将其性能提高一个数量级，并将其内存使用量减少3.7倍。 随后与等效优化的C++程序进行比较表明，当程序员小心内循环生成多少垃圾时，Go可以与C++竞争。

用于编写这篇文章的程序源代码，Linux x86-64二进制文件和配置文件可以在GitHub上的[benchgraffiti](https://github.com/rsc/benchgraffiti/)项目中找到 。

如上所述， [`go test`](https://golang.org/cmd/go/#Test_packages) 已经包含了这些 profiling flags：[benchmark function](https://golang.org/pkg/testing/) ，你就完成了。 还有一个用于 profiling 数据的标准HTTP接口。 在HTTP服务器中，添加
``` go
import _ "net/http/pprof"
```
将安装几个URL的处理程序 `/debug/pprof/`. 然后，您可以用一个参数运行 `go tool pprof`——指向服务器profiling数据的URL，它将下载并检查实时Profile文件。
``` sh
go tool pprof http://localhost:6060/debug/pprof/profile   # 30-second CPU profile
go tool pprof http://localhost:6060/debug/pprof/heap      # heap profile
go tool pprof http://localhost:6060/debug/pprof/block     # goroutine blocking profile
```
goroutine blocking profile 将在以后的文章中解释。 敬请关注。

作者：Russ Cox，2011年7月; 由Shenghou Ma更新，2013年5月


_原文：[https://blog.golang.org/profiling-go-programs](https://blog.golang.org/profiling-go-programs)<br/>_
_源代码：[https://github.com/cyningsun/go-test](https://github.com/cyningsun/go-test)_
