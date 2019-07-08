---
layout: post
title: 译 | Stack Traces In Go
category: Golang
tags: stacktrace golang
---

> 原文链接：[stack-traces-in-go](https://www.ardanlabs.com/blog/2015/01/stack-traces-in-go.html)

* TOC
{:toc}

#### 简介
在调试Go程序方面有一些基本技能可以为程序员节省大量时间来识别问题。我信奉log尽可能多的信息，但有时panic发生，而log的信息并不够。有时理解stack trace中的信息可能意味着立刻发现错误，抑或需要添加更多日志记录并等待它再次发生。

自从我开始写Go以来，我一直在看stack trace。在某些时候，我们都做了一些愚蠢的事情，导致运行时杀死我们的程序并抛出stack trace。我将向您展示stack trace提供的信息，包括如何识别传递到函数的每个参数的值。

##### Functions
让我们从一小段代码开始，它将产生一个stack trace:

``` go
01 package main
02
03 func main() {
04     slice := make([]string, 2, 4)
05     Example(slice, "hello", 10)
06 }
07
08 func Example(slice []string, str string, i int) {
09     panic("Want stack trace")
10 }
```
上述代码展示了一个程序，第05行其main函数调用Example函数。Example函数被声明在第08行，接受三个参数，string slices，字符串和一个整数。Example执行的唯一代码是在第09行调用内置panic函数，它立即生成stack trace：
``` go 
Panic: Want stack trace

goroutine 1 [running]:
main.Example(0x2080c3f50, 0x2, 0x4, 0x425c0, 0x5, 0xa)
        /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
        temp/main.go:9 +0x64
main.main()
        /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
        temp/main.go:5 +0x85
```
上述stack trace显示了panic时的所有goroutine，每个协程的状态以及相应goroutine下的调用堆栈。导致stack trace的运行中goroutine位于顶部。首先我们把重点放在导致panic的goroutine。
``` go
01 goroutine 1 [running]:
02 main.Example(0x2080c3f50, 0x2, 0x4, 0x425c0, 0x5, 0xa)
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:9 +0x64
03 main.main()
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:5 +0x85
```
代码第01行的stack trace 显示在panic之前goroutine 1正在运行中。第02行，我们看到panic的代码位于main包的Example函数中。缩进的行显示了此函数所在的代码文件和路径，以及正在执行的代码行。当时，第09行的代码正在运行，是一个导致panic的调用。

第03行显示调用Example的函数的名称，main包中的main函数。在函数名称下面，缩进的行显示了对Example进行调用的代码文件，路径和代码行。

stack trace显示直到panic发生时，该goroutine范围内的函数调用链。现在，我们把重点放在传递给Example函数的每个参数的值：
``` go
// Declaration
main.Example(slice []string, str string, i int)

// Call to Example by main.
slice := make([]string, 2, 4)
Example(slice, "hello", 10)

// Stack trace
main.Example(0x2080c3f50, 0x2, 0x4, 0x425c0, 0x5, 0xa)
```
上述来自stack trace显示了当main调用时传递给Example函数的值和该函数的声明。将stack trace中的值与函数声明进行比较，似乎不匹配。Example函数的声明接受三个参数，但stack trace显示六个十六进制值。**理解值如何与参数匹配的关键在于需要知道每个参数类型的实现。**

让我们从第一个参数开始，这是一个string slice。**slice**在Go中是引用类型。意味着slice的值是**header value**，带有指向某些基础数据的指针。对于slice，**header value**是三个word大小的结构，其包含指向底层数组的指针，slice的长度和容量。与slice header相关的值由stack trace中的前三个值表示：
``` go
// Slice parameter value
slice := make([]string, 2, 4)

// Slice header values
Pointer:  0x2080c3f50
Length:   0x2
Capacity: 0x4

// Declaration
main.Example(`slice []string`, str string, i int)

// Stack trace
main.Example(`0x2080c3f50, 0x2, 0x4`, 0x425c0, 0x5, 0xa)
```
上述显示了堆栈跟踪中的前三个值如何与slice参数匹配。第一个值表示指向基础字符串数组的指针。用于初始化切片的长度和容量数与第二个和第三个值匹配。这三个值表示切片标头的每个值，即第一个参数。
![](http://ww1.sinaimg.cn/large/bcaaa65bgy1g4p1x90wb3j20ex07ugmh.jpg)

现在让我们看看第二个参数，它是一个字符串。字符串也是引用类型，但此它的**header value**是不可变的。字符串的**header value**声明为三个word大小的结构，包含指向底层字节数组的指针和字符串的长度：
``` go 
// String parameter value
"hello"

// String header values
Pointer: 0x425c0
Length:  0x5

// Declaration
main.Example(slice []string, `str string`, i int)

// Stack trace
main.Example(0x2080c3f50, 0x2, `0x4, 0x425c0`, 0x5, 0xa)

```
上述显示了stack trace中的第四、五个值如何匹配string参数。第四个值表示指向底层字节数组的指针，第五个值表示字符串的长度为5.字符串“hello”需要5个字节。这两个值表示字符串（即，第二个参数）header的每个值。
![](http://ww1.sinaimg.cn/large/bcaaa65bgy1g4p1yddm5cj20ey060gmc.jpg)

第三个参数是一个整数，它是一个word的值：
``` go
// Integer parameter value
10

// Integer value
Base 16: 0xa

// Declaration
main.Example(slice []string, str string, `i int`)

// Stack trace
main.Example(0x2080c3f50, 0x2, 0x4, 0x425c0, 0x5, `0xa`)
```
上述显示了stack trace中的最后一个值如何匹配整数参数。trace中的最后一个值是十六进制数0xa，它是值10.与该参数传递的值相同。该值代表第三个参数。
![](http://ww1.sinaimg.cn/large/bcaaa65bgy1g4p1yrg3q9j20fi03wq38.jpg)

#### Methods 
我们更改程序，将Example函数改为一个成员函数：
``` go 
01 package main
02
03 import "fmt"
04
05 type trace struct{}
06
07 func main() {
08     slice := make([]string, 2, 4)
09
10     var t trace
11     t.Example(slice, "hello", 10)
12 }
13
14 func (t *trace) Example(slice []string, str string, i int) {
15     fmt.Printf("Receiver Address: %p\n", t)
16     panic("Want stack trace")
17 }
```
第5行通过声明一个新类型trace，改变原始程序，转换Example函数为的第14行的成员函数。转换是通过重新声明函数包含一个trace类型的指针接收器来实现。然后在第10行，声明一个trace类型的t变量，并在第11行使用该变量进行方法调用。

由于该方法是使用指针接收器声明的，因此Go将获取t变量的地址以支持接收器类型，即使方法调用使用的是值。这次运行程序时，stack trace略有不同

``` go
Receiver Address: `0x1553a8`
panic: Want stack trace

01 goroutine 1 [running]:
02 main.(`*trace`).Example(`0x1553a8`, 0x2081b7f50, 0x2, 0x4, 0xdc1d0, 0x5, 0xa)
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:16 +0x116

03 main.main()
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:11 +0xae
```
首先，应该注意的是第02行的stack trace清楚表明这是一个使用指针接收器的方法调用。现在，包含（* trace）的成员函数的名称显示在包名称和方法名称之间。其次，要注意的是值列表现在如何第一个显示接收器的值。成员函数调用实际上是第一个参数是接收器值的函数调用。我们从stack trace中看到了这个实现细节。

由于声明或调用Example方法没有其他任何更改，因此所有其他值保持不变。调用Example的行号和发生panic的位置发生了变化，并反映了新代码。

#### Packing
如果有多个参数适合放入单个word，那么stack trace中参数的值将打包在一起：
``` go 
01 package main
02
03 func main() {
04     Example(true, false, true, 25)
05 }
06
07 func Example(b1, b2, b3 bool, i uint8) {
08     panic("Want stack trace")
09 }
```
上述显示了一个新的示例程序，将Example函数更改为接受四个参数。前三个是布尔值，最后一个是八位无符号整数。布尔值也是一个8位值，因此所有四个参数都适合放入32位和64位架构上的单个word。当程序运行时，它会产生一个有趣的stack trace：
``` go 
01 goroutine 1 [running]:
02 main.Example(`0x19010001`)
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:8 +0x64
03 main.main()
           /Users/bill/Spaces/Go/Projects/src/github.com/goinaction/code/
           temp/main.go:4 +0x32
```
对Example的调用，stack trace中没有四个值，取而代之只有一个值。所有四个独立的8位值都拼凑成一个word：
``` go
// Parameter values
true, false, true, 25

// Word value
Bits    Binary      Hex   Value
00-07   0000 0001   `01`    true
08-15   0000 0000   `00`    false
16-23   0000 0001   `01`    true
24-31   0001 1001   `19`    25

// Declaration
main.Example(`b1, b2, b3 bool, i uint8`)

// Stack trace
main.Example(`0x19010001`)
```
上述显示出了在stack trace的值如何匹配传入的四个参数值。true的8位值对应于1的值，false的值对应0值。二进制25的值是11001，十六进制转换为19。现在，当我们查看堆stack trace中表示的十六进制值时，我们会看到它如何表示传入的值。

### 结论
Go runtime提供了大量信息来帮助我们调试程序。在这篇文章中，我们专注于stack trace。解码在整个调用堆栈中传递给每个函数的值的能力是巨大的。它不止一次帮助我快速识别我的bug。既然您已经知道如何读取stack trace，那么希望您可以在下次发生stack trace时可以利用这些知识。