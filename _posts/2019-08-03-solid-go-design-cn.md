---
layout: post
title: 译 | SOLID Go Design
---

* TOC
{:toc}


### Code review

在座的各位有谁把 code review 作为日常工作的一部分？【整个房间举起了手，鼓舞人心】。好的，为什么要进行 code review ？【有人高呼“阻止不良代码”】

如果代码审查是为了捕捉糟糕的代码，那么你如何知道你正在审查的代码是好还是糟糕？


正如你可能会说“这幅画很漂亮”或“这个房间很漂亮”，现在你可以说“代码很难看”或“源代码很漂亮”，但这些都是主观的。我正在寻找以客观方式谈论代码好或坏的特征。

### Bad code

你在 code review 中可能会遇到以下这些糟糕代码的特征：

* _Rigid_ - 代码死板吗？它是否有强类型或参数，以致难于修改？
* _Fragile_ - 代码脆弱吗？细微的改变是否会在代码库中引起不可估量的破坏？
* _Immobile_ - 代码难以重构吗？代码只需敲敲键盘就可以避免循环导入？
* _Complex_ - 有没有代码是为了炫技，是否过度设计？
* _Verbose_ - 代码使用费力吗？当阅读时，能看出来代码在做什么吗？

这些词是正向吗？你是否乐于看到这些词用于审核您的代码？

想必不会。

### Good design
但这是一个进步，现在我们可以说“我不喜欢它，因为它太难修改”，或“我不喜欢它，因为我不知道代码试图做什么”，但如何正向引导呢？

如果有一些方法可以描述糟糕的设计，以及优秀设计的特征，并且能够以客观的方式做到这一点，那不是很好吗？

#### SOLID

2002年，Robert Martin 出版了他的书 [_Agile Software Development, Principles, Patterns, and Practices_](https://www.amazon.co.uk/dp/0135974445/ref=pd_lpo_sbs_dp_ss_2/253-1946330-6751666?pf_rd_m=A3P5ROKL5A1OLE&pf_rd_s=lpo-top-stripe&pf_rd_r=23C4AHYV7EXGYHKD6G8Q&pf_rd_t=201&pf_rd_p=569136327&pf_rd_i=0132760584) 其中描述了可重用软件设计的五个原则，并称之为 [`SOLID`](https://zh.wikipedia.org/wiki/SOLID_(%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E8%AE%BE%E8%AE%A1))（英文首字母缩写）原则:

- 单一职责原则（Single Responsibility Principle）
- 开放/封闭原则（Open / Closed Principle）
- 里氏替换原则（Liskov Substitution Principle）
- 接口隔离原则（Interface Segregation Principle）
- 依赖倒置原则（Dependency Inversion Principle）

这本书有点过时了，它所讨论的语言是十多年前使用的语言。但是，也许 `SOLID` 原则的某些方面可以给我们提供些线索，关于怎样谈论一个精心设计的 Go 程序。


##### 单一职责原则（Single Responsibility Principle）

SOLID的第一个原则，S，是单一责任原则。

> A class should have one, and only one, reason to change. `– Robert C Martin`

现在 Go 显然没有 `classses` - 相反，我们有更强大的组合概念 - 但是如果你能回顾一下 `class` 这个词的用法，我认为此时会有一定价值。

为什么一段代码只有一个改变的原因很重要？嗯，就像你自己的代码可能会改变一样令人沮丧，发现您的代码所依赖的代码在您脚下发生变化更痛苦。当你的代码必须改变时，它应该响应直接刺激作出改变，而不应该成为附带损害的受害者。

因此，具有单一责任的代码修改的原因最少。

###### Coupling & Cohesion

描述改变一个软件是多么容易或困难的两个词是：耦合和内聚。

- 耦合只是一个词，描述了两个一起变化的东西 —— 一个运动诱导另一个运动。
- 一个相关但独立的概念是内聚，一种相互吸引的力量。

在软件上下文中，内聚是描述代码片段之间自然相互吸引的特性。
 
为了描述Go程序中耦合和内聚的单元，我们可能会将谈谈函数和方法，这在讨论 `SRP` 时很常见，但是我相信它始于 Go 的 package 模型。
> SRP: Single Responsibility Principle

###### Package names

在 Go 中，所有的代码都在某个 package 中，一个设计良好的 package 从其名称开始。包的名称既是其用途的描述，也是名称空间前缀。Go 标准库中的一些优秀 package 示例：
- `net/http` - 提供 http 客户端和服务端
- `os/exec` - 执行外部命令
- `encoding/json` - 实现JSON文档的编码和解码

当你在自己的内部使用另一个 pakcage 的 symbols 时，要使用 `import` 声明，它在两个 package 之间建立一个源代码级的耦合。 他们现在彼此知道对方的存在。

###### Bad package names

这种对名字的关注可不是迂腐。命名不佳的 package 如果真的有用途，会失去罗列其用途的机会。

- `server` package 提供什么？ ..., 嗯，希望是服务端，但是它使用哪种协议？
- `private` package 提供什么？我不应该看到的东西？它应该有公共符号吗？
- `common` package，和它的伴儿 `utils` package 一样，经常被发现和其他'伙伴'一起发现


我们看到所有像这样的包裹，就成了各种各样的垃圾场，因为它们有许多责任，所以经常毫无理由地改变。

###### Go’s UNIX philosophy

在我看来，如果不提及 Doug McIlroy 的 Unix 哲学，任何关于解耦设计的讨论都将是不完整的；小而锋利的工具结合起来，解决更大的任务，通常是原始作者无法想象的任务。

我认为 Go package 体现了 Unix 哲学的精神。实际上，每个 Go package 本身就是一个小的 Go 程序，一个单一的变更单元，具有单一的责任。

##### 开放/封闭原则（Open / Closed Principle）

第二个原则，即 O，是 `Bertrand Meyer` 的开放/封闭原则，他在1988年写道：

> Software entities should be open for extension, but closed for modification. ` – Bertrand Meyer, Object-Oriented Software Construction`

该建议如何适用于21年后写的语言？
``` go
package main

type A struct {
        year int
}

func (a A) Greet() { fmt.Println("Hello GolangUK", a.year) }

type B struct {
        A
}

func (b B) Greet() { fmt.Println("Welcome to GolangUK", b.year) }

func main() {
        var a A
        a.year = 2016
        var b B
        b.year = 2016
        a.Greet() // Hello GolangUK 2016
        b.Greet() // Welcome to GolangUK 2016
}
```

我们有一个类型 A ，有一个字段 year 和一个方法 Greet。我们有第二种类型，B 它嵌入了一个 A，因为 A 嵌入，因此调用者看到 B 的方法覆盖了 A 的方法。因为A作为字段嵌入B ，B可以提供自己的 Greet 方法，掩盖了 A 的 Greet 方法。

但嵌入不仅适用于方法，还可以访问嵌入类型的字段。如您所见，因为A和B都在同一个包中定义，所以 B 可以访问 A 的私有 year 字段，就像在 B 中声明一样。

因此嵌入是一个强大的工具，允许 Go 的类型对扩展开放。

``` go 
package main

type Cat struct {
        Name string
}

func (c Cat) Legs() int { return 4 }

func (c Cat) PrintLegs() {
        fmt.Printf("I have %d legs\n", c.Legs())
}

type OctoCat struct {
        Cat
}

func (o OctoCat) Legs() int { return 5 }

func main() {
        var octo OctoCat
        fmt.Println(octo.Legs()) // 5
        octo.PrintLegs()         // I have 4 legs
}
```
在这个例子中，我们有一个 Cat 类型，可以用它的 Legs 方法计算它的腿数。我们将 Cat 类型嵌入到一个新类型 OctoCat 中，并声明 Octocats 有五条腿。但是，虽然 OctoCat 定义了自己的 Legs 方法，该方法返回5，但是当调用 PrintLegs 方法时，它返回4。

这是因为 PrintLegs 是在 Cat 类型上定义的。 它需要 Cat 作为它的接收器，因此它会发送到 Cat 的 Legs 方法。Cat 不知道它嵌入的类型，因此嵌入时不能改变其方法集。

因此，我们可以说 Go 的类型虽然对扩展开放，但对修改是封闭的。

事实上，Go 中的方法只不过是围绕在具有预先声明形式参数（即接收器）的函数的语法糖。

``` go
func (c Cat) PrintLegs() {
        fmt.Printf("I have %d legs\n", c.Legs())
}

func PrintLegs(c Cat) {
        fmt.Printf("I have %d legs\n", c.Legs())
}
```

接收器正是你传入它的函数，函数的第一个参数，并且因为Go不支持函数重载，OctoCat不能替代普通的Cat 。 这让我想到了下一个原则。

##### 里氏替换原则（Liskov Substitution Principle）

由Barbara Liskov 提出的里氏替换原则粗略地指出，如果两种类型表现出的行为使得调用者无法区分，则这两种类型是可替代的。

在基于类的语言中，里氏替换原则通常被解释为，具有各种具体子类型的抽象基类的规范。 但是Go没有类或继承，因此无法根据抽象类层次结构实现替换。



###### Interfaces

相反，替换是Go接口的范围。在Go中，类型不需要指定它们实现特定接口，而是任何类型实现接口，只要它具有签名与接口声明匹配的方法。

我们说在Go中，接口是隐式地而不是显式地满足的，这对它们在语言中的使用方式产生了深远的影响。

设计良好的接口更可能是小型接口; 流行的做法是一个接口只包含一个方法。从逻辑上讲，小接口使实现变得简单，反之则很难。因此形成了由普通行为的简单实现组成的 package。

###### io.Reader

``` go
type Reader interface {
        // Read reads up to len(buf) bytes into buf.
        Read(buf []byte) (n int, err error)
}
```

这令我很容易想到了我最喜欢的 Go 接口 `io.Reader`。

 `io.Reader` 接口非常简单; `Read` 将数据读入提供的缓冲区，并将读取的字节数和读取期间遇到的任何错误返回给调用者。看起来很简单，但非常强大。

因为 `io.Reader` 可以处理任何表示为字节流的东西，所以我们几乎可以在任何东西上创建 `Reader`; 常量字符串，字节数组，标准输入，网络流，gzip的tar文件，通过ssh远程执行的命令的标准输出。

并且所有这些实现都可以互相替代，因为它们实现了相同的简单契约。

因此，适用于Go的里氏替换原则，可以通过已故 Jim Weirich 的格言来概括。

> Require no more, promise no less.
> `– Jim Weirich`

顺利转入”SOLID”第四个原则。

##### 接口隔离原则（Interface Segregation Principle）
第四个原则是接口隔离原则，其内容如下：

> Clients should not be forced to depend on methods they do not use.
> –Robert C. Martin

在Go中，接口隔离原则的应用可以指的是，隔离功能完成其工作所需的行为的过程。举一个具体的例子，假设我已经完成了‘编写一个将Document结构保存到磁盘的函数’的任务。

``` go
// Save writes the contents of doc to the file f.
func Save(f *os.File, doc *Document) error
```
我可以定义此函数，让我们称之为 `Save`，它将给定的 Document 写入到 `*os.File`。 但是这样做会有一些问题。

Save的签名排除了将数据写入网络位置的选项。假设网络存储可能以后成为需求，此功能的签名必须改变，并影响其所有调用者。

由于 `Save` 直接操作磁盘上的文件，因此测试起来很不方便。要验证其操作，测试必须在写入后读取文件的内容。 此外，测试必须确保将 `f` 写入临时位置并随后将其删除。

`*os.File` 还定义了许多与 `Save` 无关的方法，比如读取目录并检查路径是否是文件链接。 如果 `Save` 函数的签名能只描述 `*os.File` 相关的部分，将会很实用。


我们如何处理这些问题呢？
``` go
// Save writes the contents of doc to the supplied ReadWriterCloser.
func Save(rwc io.ReadWriteCloser, doc *Document) error
```

使用 `io.ReadWriteCloser` 我们可以应用接口隔离原则，使用更通用的文件类型的接口来重新定义 `Save`。

通过此更改，任何实现了 `io.ReadWriteCloser` 接口的类型都可以代替之前的 `*os.File`。使得 `Save` 应用程序更广泛，并向 `Save` 调用者阐明，`*os.File` 类型的哪些方法与操作相关。

做为`Save`的编写者，我不再可以选择调用 `*os.File` 的那些不相关的方法，因为它隐藏在 `io.ReadWriteCloser` 接口背后。我们可以进一步采用接口隔离原理。

首先，如果 `Save` 遵循单一责任原则，它将不可能读取它刚刚编写的文件来验证其内容 - 这应该是另一段代码的责任。因此，我们可以将我们传递给 `Save` 的接口的规范缩小，仅写入和关闭。
``` go
// Save writes the contents of doc to the supplied WriteCloser.
func Save(wc io.WriteCloser, doc *Document) error
```

其次，通过向 `Save` 提供一个关闭其流的机制，我们继续这种机制以使其看起来像文件类型的东西，这就产生一个问题，`wc` 会在什么情况下关闭。`Save` 可能会无条件地调用 `Close`，抑或在成功的情况下调用 `Close`。

这给 `Save` 的调用者带来了问题，因为它可能希望在写入文档之后将其他数据写入流。
``` go
type NopCloser struct {
        io.Writer
}

// Close has no effect on the underlying writer.
func (c *NopCloser) Close() error { return nil }
```
一个粗略的解决方案是定义一个新类型，它嵌入一个 `io.Writer` 并覆盖 `Close` 方法，以阻止`Save`方法关闭底层数据流。

但这样可能会违反里氏替换原则，因为NopCloser实际上并没有关闭任何东西。

``` go
// Save writes the contents of doc to the supplied Writer.
func Save(w io.Writer, doc *Document) error
```

一个更好的解决方案是重新定义 `Save` 只接收 `io.Writer`，完全剥离它除了将数据写入流之外做任何事情的责任。

通过应用接口隔离原则，我们的Save功能，同时得到了一个在需求方面最具体的函数 - 它只需要一个可写的参数 - 并且具有最通用的功能，现在我们可以使用 `Save` 保存我们的数据到任何一个实现 `io.Writer` 的地方。

> A great rule of thumb for Go is **accept interfaces, return structs**.
> `– Jack Lindamood`

退一步说，这句话是一个有趣的模因，在过去的几年里，它渗透入 Go 思潮。

这个推特大小的版本缺乏细节，这不是Jack的错，但我认为它代表了第一个正当有理的Go设计传统

##### 依赖倒置原则（Dependency Inversion Principle）
最后一个SOLID原则是依赖倒置原则，该原则指出：

> High-level modules should not depend on low-level modules. Both should depend on abstractions.
> Abstractions should not depend on details. Details should depend on abstractions.
> `– Robert C. Martin`


但是，对于Go程序员来说，依赖倒置在实践中意味着什么呢？

如果您已经应用了我们之前谈到的所有原则，那么您的代码应该已经被分解为离散包，每个包都有一个明确定义的责任或目的。您的代码应该根据接口描述其依赖关系，并且应该考虑这些接口以仅描述这些函数所需的行为。 换句话说，除此之外没什么应该要做的。

所以我认为，在Go的上下文中，Martin所指的是 import graph 的结构。

在Go中，import graph 必须是非循环的。 不遵守这种非循环要求将导致编译失败，但更为严重地是它代表设计中存在严重错误。

在所有条件相同的情况下，精心设计的Go程序的 import graph 应该是宽的，相对平坦的，而不是高而窄的。 如果你有一个 package，其函数无法在不借助另一个 package 的情况下运行，那么这或许表明代码没有很好地沿 pakcage 边界分解。


依赖倒置原则鼓励您将特定的责任，沿着 import graph 尽可能的推向更高层级，推给 main package 或顶级处理程序，留下较低级别的代码来处理抽象接口。


#### SOLID Go Design

回顾一下，当应用于Go时，每个SOLID原则都是关于设计的强有力陈述，但综合起来它们具有中心主题。

- 单一职责原则，鼓励您将功能，类型、方法结构化为具有自然内聚的包; 类型属于彼此，函数服务于单一目的。
- 开放/封闭原则，鼓励您使用嵌入将简单类型组合成更复杂的类型。
- 里氏替换原则，鼓励您根据接口而不是具体类型来表达包之间的依赖关系。通过定义小型接口，我们可以更加确信，实现将忠实地满足他们的契约。
- 接口隔离原则，进一步采用了这个想法，并鼓励您定义仅依赖于他们所需行为的函数和方法。如果您的函数仅需要具有单个接口类型的参数的方法，则该函数更可能只有一个责任。
- 依赖倒置原则，鼓励您按照从编译时间到运行时间的时序，转移 package 所依赖的知识。在Go中，我们可以通过特定 package 使用的import语句的数量减少看到了这一点。


如果要总结一下本次演讲，那可能就是这样：`interfaces let you apply the SOLID principles to Go programs`。

因为接口让Go程序员描述他们的 package 提供了什么 - 而不是它怎么做的。换个说法就是“解耦”，这确实是目标，因为越松散耦合的软件越容易修改。

正如Sandi Metz所说：

> Design is the art of arranging code that needs to work **today**, and to be easy to change **forever**.
> `– Sandi Metz`

因为如果Go想要成为公司长期投资的语言，Go程序的可维护性，更容易变更，将是他们决策的关键因素。

### 结尾

最后，让我们回到我打开本次演讲的问题; 世界上有多少Go程序员？这是我的猜测：

> By 2020, there will be 500,000 Go developers.
> `- me`

50万Go程序员会用他们的时间做些什么？好吧，显然，他们会写很多Go代码，实话实说，并不是所有的都是好的代码，有些会很糟糕。


请理解，我如此说并非残酷，但是，在这个房间里，每一个有着其他语言发展经验的人——你们来自的语言，来到Go——从你自己的经验中知道，这个预言有一点是真的。

> Within C++, there is a much smaller and cleaner language struggling to get out.
> `– Bjarne Stroustrup, The Design and Evolution of C++`


所有的程序员都有机会让我们的语言成功，依靠我们的集体能力，不要把人们开始谈论Go的事情弄得一团糟，就像他们今天对C++的笑话一样。

嘲弄其他语言的叙述过于冗长、冗长和过于复杂，总有一天会转向GO，我不想看到这种情况发生，所以我有一个请求。

Go程序员需要少谈框架，多谈设计。我们需要停止不惜一切代价关注性能，转而全力以赴地专注于重用。


我想看到的是人们在谈论如何使用我们今天使用的语言，无论其选择和限制，设计解决方案和解决实际问题。

我想听到的是人们在谈论如何以精心设计，解耦，重用，最重要的是响应变化的方式设计Go程序。

### … one more thing

今天在座的各位都能听到来自众多演讲者的演讲，这太好了，但事实是，无论这次会议规模有多大，与Go生命周期中使用Go的人数相比，我们只是一小部分。

因此，我们需要告诉世界上其他地方应该如何编写好软件。优秀的软件，可组合的软件，易于更改的软件，并向他们展示如何使用Go进行更改。从你开始。


我希望你开始谈论设计，也许使用我在这里提出的一些想法，希望你能做自己的研究，并将这些想法应用到你的项目中。那我想要你：

- 写一篇关于设计的博客文章。
- 教一个关于设计的workshop。
- 写一本关于你学到的东西的书。
- 明年再回到这个会议，谈谈你取得的成就。

因为通过做这些事情，我们可以建立一种Go开发人员的文化，他们关心设计用于持久的程序。

谢谢。


_原文：[SOLID Go Design](https://dave.cheney.net/2016/08/20/solid-go-design)_

