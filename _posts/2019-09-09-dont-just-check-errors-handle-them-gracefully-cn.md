---
layout: post
title: 译｜Don’t just check errors, handle them gracefully
last_modified_at: 2019-10-08
category: Golang
tags: Error
keywords:
  - error handle
---

* TOC
{:toc}


本文摘自我最近在日本东京举行的[GoCon春季](http://gocon.connpass.com/event/27521/)会议上的演讲。

![Don't just check errors, handle them gracefully](http://dave.cheney.net/wp-content/uploads/2016/04/Screen-Shot-2016-04-23-at-11.39.26.png)

#### Errors are just values

我花了很多时间考虑Go程序中错误处理的最佳方法。我真希望存在单一的错误处理方式，可以通过死记硬背教给所有Go程序员，就像教数学或英文字母表一样。

但是，我得出结论，不存在单一的错误处理方式。 相反，我认为Go的错误处理可以分为三个核心策略。


#### Sentinel errors

第一类错误处理就是我所说的_sentinel errors_。

``` go
if err == ErrSomething { … }
```

该名称源于计算机编程中使用特定值的实践，表示不可能进一步处理。 因此，对于Go，我们使用特定值来表示错误。

例子包括 `io.EOF` 类的值，或低层级的错误，如 `syscall` 包中的常 `syscall.ENOENT`。

甚至还有 `sentinel errors` 表示_没有_发生错误，比如 `go/build.NoGoError` , 和 `path/filepath.Walk` 的 `path/filepath.SkipDir`。

使用 `sentinel` 值是灵活性最小的错误处理策略，因为调用者必须使用等于运算符，将结果与预先声明的值进行比较。 当您想要提供更多上下文时就会出现问题，因为返回一个不同的错误会破坏相等检查。

即使是用心良苦的使用 `fmt.Errorf` 为错误添加一些上下文，将使调用者的相等测试失败。 调用者转而被迫查看  `error`的 `Error` 方法的输出，以查看它是否与特定字符串匹配。

##### Never inspect the output of error.Error

另外，我认为永远不应该检查  `error.Error` 方法的输出。`error` 接口上的 `Error` 方法是为人类，而不是代码。

该字符串的内容属于日志文件，或显示在屏幕上。 您不应该尝试通过检查它以更改程序的行为。

我知道有时候这是不可能的，正如有人在推特上指出的那样，此建议并不适用于编写测试。 更重要的是，在我看来，比较错误的字符串形式是一种代码气味，你应该尽量避免它。

##### Sentinel errors become part of your public API

如果您的 public 函数或方法返回特定值的错误，那么该值必须是 public 的，当然还要有文档记录。 这会增加API的面积。

如果您的API定义了一个返回特定错误的接口，则该接口的所有实现都将被限制为仅返回该错误，即使它们可能提供更具描述性的错误。

通过 `io.Reader` 看到这一点 。 像 `io.Copy` 这样的函数，需要一个 reader 实现来_精确_地返回 `io.EOF`，以便向调用者发出不再有数据的信号，但这不是错误 。

##### Sentinel errors create a dependency between two packages

到目前为止，`sentinel error values` 的最大问题是它们在两个包之间创建源代码依赖性。 例如，要检查错误是否等于 `io.EOF`，您的代码必 import `io` 包。

这个具体示例听起来并不那么糟糕，因为它很常见，但想象一下，当项目中的许多包导出 `error values`，项目中的其他包必须 import 以检查特定的错误条件时存在的耦合。

在一个玩弄这种模式的大型项目中工作过，我可以告诉你，以 import 循环的形式出现的糟糕设计的幽灵从未远离我们的脑海。

##### Conclusion: avoid sentinel errors

所以，我的建议是在你编写的代码中避免使用 `sentinel error values`。 在某些情况下，它们会在标准库中使用，但你不应该模仿这种模式。

如果有人要求您从包中导出错误值，您应该礼貌地拒绝，而是建议一种替代方法，例如我将在下面讨论的方法。

#### Error types

`Error types` 是我想讨论的Go错误处理的第二种形式。

``` go 
if err, ok := err.(SomeType); ok { … }
```

错误类型是您创建的实现错误接口的类型。 在此示例中，`MyError` 类型跟踪文件和行，以及解释所发生情况的消息。

``` go
type MyError struct {
	Msg string
	File string
	Line int
}

func (e *MyError) Error() string {
	return fmt.Sprintf("%s:%d: %s”, e.File, e.Line, e.Msg)
}

return &MyError{"Something happened", “server.go", 42}
```

由于 `MyError error` 是一种类型，因此调用者可以使用类型断言从错误中提取额外的上下文。

``` go
err := something()
switch err := err.(type) {
case nil:
// call succeeded, nothing to do
case *MyError:
fmt.Println(“error occurred on line:”, err.Line)
default:
// unknown error
}
```
`error types` 相对于 `error values` 的重大改进是，它们能够包装底层错误以提供更多上下文。

一个很好的例子是 `os.PathError` 类型，它通过它试图执行的操作和它试图使用的文件来注释底层错误。

``` go
// PathError records an error and the operation
// and file path that caused it.
type PathError struct {
	Op string
	Path string
	Err error // the cause
}

func (e *PathError) Error() string
```
##### Problems with error types

调用者可以使用类型断言或类型 switch，`error types` 必须是 public。

如果您的代码实现了一个接口，其契约需要特定的错误类型，则该接口的所有实现者都需要依赖于定义错误类型的包。

对包类型的深入了解，会建立与调用者很强耦合，从而形成一个脆弱的API。

##### Conclusion: avoid error types

虽然 `error types` 比 `sentinel error values` 更好，因为它们可以捕获更多关于错误的上下文，错误类型同样拥有许多 `error values` 的问题。

所以我的建议是避免 `error types`，或者至少避免使它们成为公共API的一部分。

#### Opaque errors

现在我们来看第三类错误处理。 在我看来，这是最灵活的错误处理策略，因为它需要的代码和调用者之间的耦合最小。

我将这种方式称为不透明的错误处理，因为虽然您知道发生了错误，但您无法查看错误内部。 作为调用者，您对操作结果的所有了解都是有效的，或者没有。

这就是不透明的错误处理 - 只返回错误而不假设其内容。 如果采用此方式，则错误处理可以作为调试辅助工具，变得非常有用。

``` go
import “github.com/quux/bar”

func fn() error {
	x, err := bar.Foo()
	if err != nil {
		return err
	}
	// use x
}
```

例如，`Foo` 的契约不保证它将在错误的上下文中返回什么。通过传递错误附带额外的上下文，`Foo` 的作者现在可以自由地注释错误，而不会违反与调用者的契约。

##### Assert errors for behaviour, not type

在少数情况下，使用二分法（是否有错误）来进行错误处理是不够的。

例如，与进程外部的服务（例如网络活动）的交互，要求调用者查看错误的性质，以确定重试操作是否合理。

在这种情况下，我们可以断言错误实现了特定的行为，而不是断言错误是特定的类型或值。 考虑这个例子：

``` go
type temporary interface {
	Temporary() bool
}

// IsTemporary returns true if err is temporary.
func IsTemporary(err error) bool {
	te, ok := err.(temporary)
	return ok && te.Temporary()
}
```

可以将任何错误传递给 `IsTemporary` 以确定错误是否可以重试。

如果错误没有实现 `temporary` 接口; 也就是说，它没有 `Temporary` 方法，那么错误不是临时的。

如果错误确实实现了 `Temporary`，那么如果 `true` 返回true ，调用者可以重试该操作。

这里的关键是，此逻辑可以在不导入定义错误的包，或者直接知道任何关于 `err`的基础类型的情况下实现 - 我们只是对它的行为感兴趣。

#### Don’t just check errors, handle them gracefully

让我想到了第二句Go谚语，我想谈谈; 不要仅仅检查错误，优雅地处理它们。 你能用以下代码提出一些问题吗？

``` go
func AuthenticateRequest(r *Request) error {
	err := authenticate(r.User)
	if err != nil {
		return err
	}
	return nil
}
```

一个明显的建议是，函数的五行可以替换为:

``` go
return authenticate(r.User)
```

但这是每个人都应该在代码审查中发现的简单问题。这段代码更根本的问题是无法分辨原始错误来自哪里。

如果 `authenticate` 返回错误，那么 `AuthenticateRequest` 会将错误返回给调用者，调用者也可能会这样做，依此类推。 在程序的顶部，程序的主体将错误打印到屏幕或日志文件，所有打印的都会是： `No such file or directory` 。 

![No such file or directory](http://dave.cheney.net/wp-content/uploads/2016/04/Screen-Shot-2016-04-27-at-07.00.21.png)

没有生成错误的文件和行的信息。 没有导致错误的调用堆栈的 `stack trace`。 该代码的作者将被迫进行一个长的会话，将他们的代码二等分，以发现哪个代码路径触发了文件未找到错误。

Donovan和Kernighan的_The Go Programming Language_建议您使用 `fmt.Errorf` 向错误路径添加上下文


``` go
func AuthenticateRequest(r *Request) error {
	err := authenticate(r.User)
	if err != nil {
		return **fmt.Errorf("authenticate failed: %v", err)**
	}
	return nil
}
```

但是正如我们之前看到的，这种模式与使用 `sentinel error values` 或类型断言不兼容，因为将错误值转换为字符串，将其与另一个字符串合并，然后使用 `fmt.Errorf` 将其转换回错误,破坏了相等性，同时完全破坏了原始错误中的上下文。

##### Annotating errors

我想建议一种方法来为错误添加上下文，为此，我将介绍一个简单的包。 该代码在 [`github.com/pkg/errors`](https://godoc.org/github.com/pkg/errors) 提供。 错误包有两个主要函数：

``` go
// Wrap annotates cause with a message.
func Wrap(cause error, message string) error
```

第一个函数是 `Wrap`，它接收一个错误和一段消息，并产生一个新的错误。

``` go
// Cause unwraps an annotated error.
func Cause(err error) error
```

第二个函数是 `Cause`，它接收可能已被包装的错误，并将其解包以恢复原始错误。

使用这两个函数，我们现在可以注释任何错误，并在需要检查时恢复底层错误。 考虑一个将文件内容读入内存的函数的例子。

``` go
func ReadFile(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, **errors.Wrap(err, "open failed")**
	}
	defer f.Close()

	buf, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, **errors.Wrap(err, "read failed")**
	}
	return buf, nil
}
```

我们将使用此函数编写一个函数来读取配置文件，然后从 `main` 调用它。

``` go
func ReadConfig() ([]byte, error) {
	home := os.Getenv("HOME")
	config, err := ReadFile(filepath.Join(home, ".settings.xml"))
	return config, **errors.Wrap(err, "could not read config")**
}

func main() {
	_, err := ReadConfig()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
```

如果 `ReadConfig` 代码路径失败，因为我们使用了 `errors.Wrap`，我们在K＆D样式中得到一个很好的注释错误。

``` sh
could not read config: open failed: open /Users/dfc/.settings.xml: no such file or directory
```

因为 `errors.Wrap` 会产生堆栈错误，所以我们可以检查该堆栈以获取其他调试信息。 这又是一个相同的例子，但这次我们用 `fmt.Println` 替换 `errors.Print`

``` go
func main() {
	_, err := ReadConfig()
	if err != nil {
		errors.Print(err)
		os.Exit(1)
	}
}
```

我们会得到如下信息：

``` sh
readfile.go:27: could not read config
readfile.go:14: open failed
open /Users/dfc/.settings.xml: no such file or directory
```

第一行来自 `ReadConfig`，第二行来自 `ReadFile` 的 `os.Open` 部分，其余部分来自 `os` 包本身，它不携带位置信息。

现在我们已经介绍了包装错误生成堆栈的概念，我们需要讨论反向操作，展开它们。 这是 `errors.Cause` 函数的域。

``` go
// IsTemporary returns true if err is temporary.
func IsTemporary(err error) bool {
	te, ok := **errors.Cause(err)**.(temporary)
	return ok && te.Temporary()
}
```

在操作中，每当您需要检查错误是否与特定值或类型匹配时，您应首先使用 `errors.Cause` 函数恢复原始错误。

#### Only handle errors once

最后，我想提一下：你应该只处理一次错误。 处理错误意味着检查错误值并做出决定。

``` go
func Write(w io.Writer, buf []byte) {
	w.Write(buf)
}
```

如果不做决定，则忽略该错误。 正如我们在这里看到的那样，`w.Write` 的错误被丢弃了。

但是，针对单个错误做出多个决策也存在问题。

``` go
func Write(w io.Writer, buf []byte) error {
	_, err := w.Write(buf)
	if err != nil {
		// annotated error goes to log file
		log.Println("unable to write:", err)

		// unannotated error returned to caller
		return err
	}
	return nil
}
```

In this example if an error occurs during `Write`, a line will be written to a log file, noting the file and line that the error occurred, and the error is also returned to the caller, who possibly will log it, and return it, all the way back up to the top of the program.

So you get a stack of duplicate lines in your log file, but at the top of the program you get the original error without any context. Java anyone?

在此示例中，如果在 `Write` 期间发生错误，则会将一行写入日志文件，注意错误发生的文件和行，并且错误也会返回给调用者，调用者可能会将其记录并返回，一路回到程序的顶部。

因此，您在日志文件中获得了重复的行的堆栈，但是在程序的顶部，您将获得没有原始错误的任何上下文。 有人使用Java吗？

``` go
func Write(w io.Write, buf []byte) error {
	_, err := w.Write(buf)
	return **errors.Wrap(err, "write failed")**
}
```
使用 `errors` 包，您可以以人和机器都可检查的方式向错误值添加上下文。

#### Conclusion

总之，错误是包 public API 的一部分，对待它们就像对待 public API 的其他部分一样小心。

为了获得最大的灵活性，我建议您尝试将所有错误都视为不透明的。在不能这样做的情况下，断言行为错误，而不是类型或值错误。

最小化程序中的 `sentinel error values`，并在错误发生时立即用 `errors.Wrap` 将其包装，从而将错误转换为不透明错误。

最后，如果需要检查，请使用 `errors.Cause` 恢复底层错误。




_原文：[Don’t just check errors, handle them gracefully](https://dave.cheney.net/2016/04/27/dont-just-check-errors-handle-them-gracefully)_