---
layout: post
title: 译 | Share Memory By Communicating
---

传统的线程模型（例如，通常在编写Java，C++ 和 Python 程序时使用）要求程序员使用共享内存在线程之间进行通信。通常，共享数据结构受锁保护，线程争夺这些锁以访问数据。在某些情况下，通过使用线程安全的数据结构可以使操作变得更容易，例如 Python 的 Queue。

Go的并发原语 — goroutine 和 chan nel— 提供了一种优雅而独特的方式来构造并发软件（ 这些概念有一个[有趣的历史](https://swtch.com/~rsc/thread/)，始于 C. A. R. Hoare 的 [Communicating Sequential Processes](http://www.usingcsp.com/) ）。Go 并未显式地使用锁来达成对共享数据的访问，而是鼓励使用 channel 在goroutine 之间传递对数据的引用。该方法可确保在给定时间只有一个 goroutine 可以访问数据。该概念在[Effective Go](https://golang.org/doc/effective_go.html)（Go程序员必读）中进行了总结：

> Do not communicate by sharing memory; instead, share memory by communicating.
> 不要通过共享内存进行通信；而是通过通信共享内存。

考虑一个轮询 URL 列表的程序。在传统的线程环境中，人们可能会如下构造其数据：
``` go
type Resource struct {
    url        string
    polling    bool
    lastPolled int64
}

type Resources struct {
    data []*Resource
    lock *sync.Mutex
}
```
然后，Poller 函数（许多类似的函数会运行在单独的线程中）如下：
``` go 
func Poller(res *Resources) {
    for {
        // get the least recently-polled Resource
        // and mark it as being polled
        res.lock.Lock()
        var r *Resource
        for _, v := range res.data {
            if v.polling {
                continue
            }
            if r == nil || v.lastPolled < r.lastPolled {
                r = v
            }
        }
        if r != nil {
            r.polling = true
        }
        res.lock.Unlock()
        if r == nil {
            continue
        }

        // poll the URL

        // update the Resource's polling and lastPolled
        res.lock.Lock()
        r.polling = false
        r.lastPolled = time.Nanoseconds()
        res.lock.Unlock()
    }
}
```
此功能大约一页纸长，并且需要更多细节才能完成。它甚至不包括 URL 轮询逻辑（它本身只有几行），也不能优雅地应对资源池耗尽。

让我们看一下使用 Go 风格实现的相同功能。在此示例中，Poller 函数从输入 channel 接收要轮询的资源，并在完成后将其发送到输出 channel。
``` go
type Resource string

func Poller(in, out chan *Resource) {
    for r := range in {
        // poll the URL

        // send the processed Resource to out
        out <- r
    }
}
```
前一个例子中的微妙逻辑显然没有了，并且 Resource 数据结构不再包含记账数据。实际上，剩下的都是重要的部分。以上应该使您对这些简单的语言功能的威力有所了解。

上面的代码片段有很多遗漏之处。如需走读使用以上想法的，完整的、惯用的 Go 程序，请参阅 Codewalk [Share Memory By Communicating](https://golang.org/doc/codewalk/sharemem/)。

_原文：[https://blog.golang.org/share-memory-by-communicating](https://blog.golang.org/share-memory-by-communicating)_
_源代码：[https://github.com/cyningsun/go-test](https://github.com/cyningsun/go-test)_