---
layout: post
title: 译｜Errors are values
last_modified_at: 2019-10-08
category: Golang
tags: Error
keywords:
  - error handle
---

* TOC
{:toc}

Go程序员，尤其是那些刚接触语言的人，常见的讨论点是如何处理错误。 谈话经常变成对以下代码段出现次数的失望
``` go
if err != nil {
    return err
}
```
我们最近扫描了我们可以找到的所有开源项目，发现这个代码段每一页或每两页只发生一次，比你们想象的更少。 尽管如此，如果必须总是写
``` go 
if err != nuil
```
的感觉持续存在, 一定是出了什么问题，明显的目标就是 `Go` 本身。

这是令人遗憾和误导性的，而且很容易纠正。事实可能正是`Go` 新程序员想问的：“如何处理错误？”，他们碰到这种模式，然后停在那里。在其他语言中，可以使用 `try-catch` 块或其他此类机制来处理错误。因此，程序员认为，当我使用旧语言的 `try-catch` 时，在 `Go` 中我只需输入 `if err != nil`。随着时间的推移，`Go` 代码汇集了许多这样的片段，结果显得很笨拙。

先不管这种解释是否合适，很明显这些 `Go` 程序员缺少关于错误的一个根本点： `Errors are values`。

值可以编程，既然错误是值，因此错误也可以编程。

当然，涉及错误值的常见语句是检测它是否为nil，但是还有无数其他可以用错误值做的事情，并且应用其中的一些东西可以使您的程序变得更好，从而消除大量如果机械的使用if语句检查每个错误会出现的样板。

以下是 `bufio` 包 [`Scanner`](https://golang.org/pkg/bufio/#Scanner) 类型的一个简单示例。它的 [`Scan`](https://golang.org/pkg/bufio/#Scanner.Scan) 方法执行底层 `I/O`，这当然会导致错误。然而，该 `Scan` 方法根本不暴露错误。相反，它返回一个布尔值和一个单独的方法，在扫描结束时运行，报告是否发生了错误。客户端代码如下所示：
``` go
scanner := bufio.NewScanner(input)
for scanner.Scan() {
    token := scanner.Text()
    // process token
}
if err := scanner.Err(); err != nil {
    // process the error
}
```

当然，有出现错误的空值检查，但它只出现并执行一次。 可以将 `Scan` 方法定义为
``` go
func (s *Scanner) Scan() (token []byte, error)
```
然后示例用户代码可能是（取决于如何取回 token），
``` go
scanner := bufio.NewScanner(input)
for {
    token, err := scanner.Scan()
    if err != nil {
        return err // or maybe break
    }
    // process token
}
```

并没有太大的不同，但有一个重要的区别。 在此代码中，客户端必须在每次迭代时检查错误，但在真正的 `Scanner` API 中，错误处理从关键 API 元素抽象出来，而关键 API 元素正在迭代 token。 使用真正的 API，客户端的代码更自然：循环直到完成，最后进行错误处理。错误处理不会掩盖控制流。

当然，幕后是，只要 `Scan` 遇到 I/O 错误，它就会记录它并返回 false。 一个单独的 [`Err`](https://golang.org/pkg/bufio/#Scanner.Err) 方法 在客户端调用时报告错误值。 虽然很微不足道，但它与到处敲
``` go
if err != nil
```
或要求客户端在每个 token 之后检查错误不同。它正在用错误值编程。简洁的编程，对，仍还是编程。


值得强调的是，无论设计如何，程序检查错误都是至关重要的。这里的讨论不是关于如何避免检查错误，而是关于使用语言，优雅的处理错误。


当我参加2014年秋季东京的 GoCon 时，出现了重复性错误检查代码的主题。一位热心的Gopher，Twitter上称呼为 [_@jxck__](https://twitter.com/jxck_)，响应了我们熟悉的关于错误检查的失望。他有一些代码看起来像这样：
``` go
_, err = fd.Write(p0[a:b])
if err != nil {
    return err
}
_, err = fd.Write(p1[c:d])
if err != nil {
    return err
}
_, err = fd.Write(p2[e:f])
if err != nil {
    return err
}
// and so on
```

代码重复性很高。 在实际代码中，会更长，还有更多内容，因此使用 helper 函数重构它并不容易，但在如此理想化的情况下，封装错误变量的函数字面值会有用：
``` go
var err error
write := func(buf []byte) {
    if err != nil {
        return
    }
    _, err = w.Write(buf)
}
write(p0[a:b])
write(p1[c:d])
write(p2[e:f])
// and so on
if err != nil {
    return err
}
```
该模式很有效，但每个执行写操作的函数都需要一个闭包; 单独的 helper 函数使用起来比较笨拙，因为 err 变量需要跨调用维护（试试看）。

通过借鉴上述 `Scan` 方法的想法，我们可以使代码更清洁，更通用和可重复使用 。我在讨论中提到过这种技术，但 _@jxck_ 没有明白如何应用它。经过长时间的交流，受到语言障碍的阻碍，我问我是否可以借用他的笔记本电脑，通过写一些代码给他看。

我定义了一个名为 `errWriter` 的对象，如下所示：
``` go
type errWriter struct {
    w   io.Writer
    err error
}
```

并给它一种方法，`write`。小写部分是为了突出区别, 它不需要有标准的 `Write` 签名。该 `write` 方法调用底层 `Writer` 的 `Write` 方法 并记录第一个错误以供将来引用：
``` go
func (ew *errWriter) write(buf []byte) {
    if ew.err != nil {
        return
    }
    _, ew.err = ew.w.Write(buf)
}
```
一旦发生错误，`write` 方法就会变为无操作，但会保存错误值。

有了 `errWriter` 类型及其 `write` 方法，可以重构上面的代码如下：
``` go
ew := &errWriter{w: fd}
ew.write(p0[a:b])
ew.write(p1[c:d])
ew.write(p2[e:f])
// and so on
if ew.err != nil {
    return ew.err
}
```

现在甚至比之前使用闭包还要清晰，并且更容易看到纸上实际的写入顺序。 再没有杂乱。 使用错误值（和接口）进行编程使代码更好。

可能同一包中其他地方的代码也可以使用这种思想，甚至可以直接使用 `errWriter`。

此外，一旦 `errWriter` 存在，它可以做更多事情，尤其是在更实用的例子中。 它可以累积字节数。 它可以将写入合并到一个缓冲区中，然后可以原子的传输。 等等。

实际上，这种模式经常出现在标准库中。 [`archive/zip`](https://golang.org/pkg/archive/zip/) 和 [`net/http`](https://golang.org/pkg/net/http/) 包在使用。该讨论最显著的是， [`bufio` 包的 `Writer`](https://golang.org/pkg/bufio/) 实际上是 `errWriter` 想法的实现。 尽管 `bufio.Writer.Write` 返回错误，但主要是在于实现 [`io.Writer`](https://golang.org/pkg/io/#Writer) 接口。 `bufio.Writer` 的 `Write` 方法就像我们上面的 `errWriter.write` 方法一样， `Flush` 报告错误，因此我们的示例可以像这样编写：
``` go
b := bufio.NewWriter(fd)
b.Write(p0[a:b])
b.Write(p1[c:d])
b.Write(p2[e:f])
// and so on
if b.Flush() != nil {
    return b.Flush()
}
```

至少对于某些应用程序， 这种方法有一个明显的缺点：在错误发生之前无法知道完成了多少处理。 如果该信息很重要，则需要采用更细粒度的方法。 但是，通常，最后全有或全无检查就足够了。

我们只研究了一种避免重复错误处理代码的技术。 请记住，使用 `errWriter` 或 `bufio.Writer` 并不是简化错误处理的唯一方法，并且这种方法并不适合所有情况。 然而，关键的一课是 `errors are values`，并且Go编程语言的全部功能可用于处理它们。

使用语言简化错误处理。

但请记住：无论你怎么做，一定要检查自己的错误！

最后，关于我与 _@jxck_ 互动的完整故事，包括他录制的一个小视频，请访问他的[博客](http://jxck.hatenablog.com/entry/golang-error-handling-lesson-by-rob-pike) 。


_原文：[Errors are values](https://blog.golang.org/errors-are-values)_