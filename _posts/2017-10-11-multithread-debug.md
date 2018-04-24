---
layout: post
title: 多线程调试—原理与实践
category: 后台开发
tags: debug
---
### 背景
最近搜索在切换新搜索平台，在切换过程中发现一个case会在检索过程中触发coredump。借助这个case详细讲述下GDB和线程调度的细节，进而更好的理解多线程调试。

### 正文
搜索系统收到检索请求，会将请求按照库进行任务分解，放到任务队列，线程池中的工作线程拿到任务执行检索。本次出现coredump的点就是工作线程执行的代码。
![threads]({{ site.url }}/public/blog-img/multithread-debug/threads.jpg)   
对于多线程调试就涉及到一个概念**All-Stop Mode**。先按下这个概念不提，如果没有设置All-Stop Mode，就进行调试，会发生什么：

```cpp
(gdb) break word_element.cpp:39
Breakpoint 1 at 0x109b5dc: file word_element.cpp, line 39.
(gdb) c
Continuing.
[New Thread 0x7fca27926700 (LWP 76457)]
[New Thread 0x7fca27125700 (LWP 76458)]
[Switching to Thread 0x7fca27926700 (LWP 76457)]

Breakpoint 1, WordElement::Reset (this=0x3a5fe020, node=...) at word_element.cpp:39
39     word_element.cpp: No such file or directory.
(gdb) <b>print node.PrintDebugString()</b>
[Switching to Thread 0x7fca27125700 (LWP 76458)]

Breakpoint 1, WordElement::Reset (this=0x44b21420, node=...) at word_element.cpp:39
39     in word_element.cpp
<b>The program stopped in another thread while making a function call from GDB.</b>

(google::protobuf::Message::PrintDebugString() const) will be abandoned.
When the function is done executing, GDB will silently stop.
```

由于执行函数调用，当前进程因为另外一个线程执行而停止，调试进行不下去了。回到刚刚的概念

### 什么是“All-Stop Mode”？
GDB无法单步调试所有线程，由于线程的调度策略取决于调试的操作系统，当调试线程执行一步时，其他线程可能执行不止一条语句。当调试线程continue或者单步执行时，一旦其他线程在当前线程的执行结束之前触发断点、异常、信号，可能会发现程序终止（program stopped）。由于触发，GDB会自动切换到触发线程并提示“ [Switching to Thread n]”。因此，如果想要顺利调试需要使用“set scheduler-locking on”锁定操作系统调度器，只允许调试线程执行。

```cpp
(gdb) break word_element.cpp:39
Breakpoint 1 at 0x109b5dc: word_element.cpp, line 39.
(gdb) c
Continuing.
[New Thread 0x7f42de3af700 (LWP 52695)]
[New Thread 0x7f42ddbae700 (LWP 52696)]

[Switching to Thread 0x7f42de3af700 (LWP 52695)]

Breakpoint 1, WordElement::Reset (this=0x42c76020, node=...) at word_element.cpp:39
39     word_element.cpp: No such file or directory.
(gdb) <b>set scheduler-locking on</b>
(gdb) print node.PrintDebugString()
node_level: 3
node_weight: 0.49673182
hit_field: 0
```

如上，就可以愉快的排查堆栈，查看coredump发生的原因了




