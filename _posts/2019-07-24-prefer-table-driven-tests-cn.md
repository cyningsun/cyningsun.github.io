---
layout: post
title: 译 | Prefer table driven tests
category: Golang
tags: Test
keywords:
  - TDD
  - testing
---

* TOC
{:toc}


我是测试的忠实粉丝，特别是[单元测试](https://dave.cheney.net/2019/04/03/absolute-unit-test)和TDD（当然前提是， [恰当的做好](https://www.youtube.com/watch?v=EZ05e7EMOLM) ）。 围绕Go项目的一种实践是 `table driven test` 方法。 这篇文章探讨了编写 `table driven test` 的方式和原因。

假设我们有一个分割字符串的函数：
``` go
// Split slices s into all substrings separated by sep and  
// returns a slice of the substrings between those separators.  
func Split(s, sep string) []string {  
    var result []string  
    i := strings.Index(s, sep)  
    for i > -1 {  
        result = append(result, s[:i])  
        s = s[i+len(sep):]  
        i = strings.Index(s, sep)  
    }  
    return append(result, s)  
}
```

在Go中，单元测试只是常规的Go函数（有一些规则），所以我们在同一目录的文件中，使用相同的包名 `strings`，开始为这个函数编写一个单元测试。
``` go
package split  

import (  
    "reflect"  
    "testing"  
)  

func TestSplit(t *testing.T) {  
    got := Split("a/b/c", "/")  
    want := []string{"a", "b", "c"}  
    if !reflect.DeepEqual(want, got) {  
         t.Fatalf("expected: %v, got: %v", want, got)  
    }  
}
```

测试只是常规的有一些规则的Go函数：

1. 测试函数的名称必须以Test开头。
2. 测试函数必须采用\*testing.T 类型的一个参数。 \*testing.T 是测试包本身注入的类型，用于提供打印，跳过和失败测试的方法。

在我们的测试中，我们使用一些输入调用 `Split`，然后将其与我们预期的结果进行比较。

### Code coverage

接下来的问题是，这个包的覆盖范围是什么？ 幸运的是，go tool 具有内置的分支覆盖。 我们可以像这样调用它：
``` sh
% go test -coverprofile=c.out 
PASS  
coverage: 100.0% of statements  
ok      split   0.010s
```

结果表明，代码有100％的分支覆盖率，这并不奇怪，这段代码中只有一个分支。

如果我们想深入了解覆盖率报告，那么 go tool 有几个选项来打印覆盖率报告。 我们可以使用 `go tool cover -func` 来细分每个函数的覆盖率：
``` sh
% **go tool cover -func=c.out**  
split/split.go:8:       Split          100.0%  
total:                  (statements)   100.0%
```

如果在该软件包中只有一个功能，并不足令人兴奋，但我相信你会发现更多令人兴奋的软件包来测试。
#### Spray some .bashrc on that

这两个命令对我来说非常有用，因此我有一个shell alias，它可以一个命令运行测试覆盖率并得到报告：
``` sh
cover () {  
    local t=$(mktemp -t cover)  
    go test $COVERFLAGS -coverprofile=$t $@ \  
        && go tool cover -func=$t \  
        && unlink $t  
}
```

### Going beyond 100% coverage

我们编写了一个测试用例，获得了100％的覆盖率，但这并不是故事的结尾。 我们有很好的分支覆盖，但我们可能需要测试一些边界条件。 例如，如果我们尝试将使用逗号分割字符串会发生什么？
``` go
func TestSplitWrongSep(t *testing.T) {  
    got := Split("a/b/c", ",")  
    want := []string{"a/b/c"}  
    if !reflect.DeepEqual(want, got) {  
        t.Fatalf("expected: %v, got: %v", want, got)  
    }  
}
```

抑或，如果源字符串中没有分隔符会发生什么？
``` go
func TestSplitNoSep(t *testing.T) {  
    got := Split("abc", "/")  
    want := []string{"abc"}  
    if !reflect.DeepEqual(want, got) {  
        t.Fatalf("expected: %v, got: %v", want, got)  
    }  
}
```

我们开始构建一组运行边界条件的测试用例。 这相当不错。

### Introducing table driven tests

然而，我们的测试中有很多重复。 对于每个测试用例，只有输入，预期输出和测试用例的名称发生变化。 其他一切都是样板。 我们想要设置所有的输入和预期输出，感受它们在单个测试套件的效果。 这是引入 table driven test 的好时机。
``` go
func TestSplit(t *testing.T) {  
    type test struct {  
        input string  
        sep   string  
        want  []string  
    }  

    tests := []test{  
        {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        {input: "abc", sep: "/", want: []string{"abc"}},  
    }  

    for _, tc := range tests {  
        got := Split(tc.input, tc.sep)  
        if !reflect.DeepEqual(tc.want, got) {  
            t.Fatalf("expected: %v, got: %v", tc.want, got)  
        }  
    }  
}
```

我们声明了一个结构来保存我们的测试输入和预期输出。 这是我们的表。`tests` 结构通常是局部声明，因为我们希望将此名称重用于此包中的其他测试。

实际上，我们甚至不需要给类型命名，我们可以使用匿名结构字面值来减少样板文件，如下所示：
``` go
func TestSplit(t *testing.T) {  
    tests := []struct {  
        input string  
        sep   string  
        want  []string  
    }{  
        {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        {input: "abc", sep: "/", want: []string{"abc"}},  
    }   

    for _, tc := range tests {  
        got := Split(tc.input, tc.sep)  
        if !reflect.DeepEqual(tc.want, got) {  
            t.Fatalf("expected: %v, got: %v", tc.want, got)  
        }  
    }  
}
```

现在，添加一个新的测试是直截了当的事情; 只需在 `tests` 结构中添加另一行。 例如，如果我们的输入字符串有一个尾随分隔符会发生什么？

``` sh
{input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
{input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
{input: "abc", sep: "/", want: []string{"abc"}},  
**{input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}}, // trailing sep**
```

但是，当我们运行 `go test`，我们得到了
``` sh
% go test
--- FAIL: TestSplit (0.00s)  
    split_test.go:24: expected: [a b c], got: [a b c ]  
```

抛开测试失败，有一些问题需要讨论。

第一种，将每个测试从函数重写到表中的一行，我们已经丢失了失败测试的名称。 我们在测试文件中添加了一个注释来强调这种情况，但我们无法在 `go test` 输出中访问该注释。

有几种方法可以解决这个问题。 你会在Go代码库中看到混合风格的使用，因为table testing的习惯用法随着人们对该类型的不断试验而不断发展。

### Enumerating test cases

由于测试存储在 slice 中，我们可以在失败消息中打印出测试用例的索引：
``` go
func TestSplit(t *testing.T) {  
    tests := []struct {  
        input string  
        sep . string  
        want  []string  
    }{  
        {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        {input: "abc", sep: "/", want: []string{"abc"}},  
        {input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}},  
    }  

    for i, tc := range tests {  
        got := Split(tc.input, tc.sep)  
        if !reflect.DeepEqual(tc.want, got) {  
            t.Fatalf("**test %d:** expected: %v, got: %v", **i+1**, tc.want, got)  
        }  
    }  
}
```

现在，当我们运行 `go test` 我们得到了这个：
``` sh
% go test  
--- FAIL: TestSplit (0.00s)  
    split_test.go:24: **test 4:** expected: [a b c], got: [a b c ]  
```

这样好了一些。 现在我们知道第四个测试失败了，尽管我们不得不做了一点点捏造，因为 slice 索引和范围迭代是从 0 开始的。 这要求您的测试用例保持一致; 如果有些人从 0 开始报告而其他人使用 1 开始报告，那将会令人困惑。 并且，如果测试用例列表很长，则可能很难数大括号以确切地确定第4个测试用例由哪些结构构成。

### Give your test cases names

另一种常见模式是在测试结构中包含名称字段。
``` go
func TestSplit(t *testing.T) {  
    tests := []struct {  
        **name  string**  
        input string  
        sep   string  
        want  []string  
    }{  
        {name: "simple", input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        {name: "wrong sep", input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        {name: "no sep", input: "abc", sep: "/", want: []string{"abc"}},  
        {name: "trailing sep", input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}},  
    }  

    for _, tc := range tests {  
        got := Split(tc.input, tc.sep)  
        if !reflect.DeepEqual(tc.want, got) {  
            t.Fatalf("**%s:** expected: %v, got: %v", **tc.name**, tc.want, got)  
        }  
    }  
}
```

现在，当测试失败时，我们有一个描述性的名称，描述正在进行的测试。 我们不再需要尝试从输出中找出它 —— 现在还有一个字符串，我们可以搜索。
``` sh
% go test 
--- FAIL: TestSplit (0.00s)  
    split_test.go:25: **trailing sep**: expected: [a b c], got: [a b c ]  
```

我们可以使用 map 字面值语法来更详细地说明这一点：
``` go
func TestSplit(t *testing.T) {  
    tests := **map[string]struct {  
        input string  
        sep   string  
        want  []string  
    }**{   
        "simple":       {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},   
        "wrong sep":    {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        "no sep":       {input: "abc", sep: "/", want: []string{"abc"}},  
        "trailing sep": {input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}},  
    }  

    for name, tc := range tests {  
        got := Split(tc.input, tc.sep)  
        if !reflect.DeepEqual(tc.want, got) {  
            t.Fatalf("**%s:** expected: %v, got: %v", **name**, tc.want, got)  
        }  
    }  
}
```

使用 map 字面值语法，我们不再将测试用例定义为结构的 slice，而是作为测试名到测试结构的 map。 使用可能会提高测试效果的 map 还有一个好处。

map 迭代顺序是 _undefined_ [<sup>1</sup>][1] 这意味着每次运行 `go test`，我们的测试都可能以不同的顺序运行。

这对于发现在按语句顺序运行时测试通过的条件非常有用，但不适用于其他情况。如果您发现这种情况发生了，您可能是有一些全局状态，被一次测试改变，而后续测试取决于该修改。

### Introducing sub tests

在我们修复失败的测试之前，还有一些其他问题需要在我们的 table driven test 工具中解决。

第一，我们在其中一个测试用例失败时调用t.Fatalf。 这意味着在第一次失败的测试用例之后我们停止测试其他情况。 因为测试用例是以未定义的顺序运行的，所以如果测试失败，那么知道它是唯一的失败还是只是第一次失败会更好。

如果我们努力将每个测试用例写出来作为测试包的函数，测试包将为我们做到这一点，但是这很冗长。 好消息是，自从Go 1.7添加了一项新功能，让我们可以轻松地进行 table driven test。 它们被称为 [sub tests](https://blog.golang.org/subtests)。

``` go
func TestSplit(t *testing.T) {  
    tests := map[string]struct {  
        input string  
        sep   string  
        want  []string  
    }{  
        "simple":       {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        "wrong sep":    {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        "no sep":       {input: "abc", sep: "/", want: []string{"abc"}},  
        "trailing sep": {input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}},  
    }  

    for name, tc := range tests {  
**t.Run(name, func(t *testing.T) {  
            got := Split(tc.input, tc.sep)  
            if !reflect.DeepEqual(tc.want, got) {  
                t.Fatalf("expected: %v, got: %v", tc.want, got)  
            }  
        })**  
    }  
}
```

由于每个 sub test 现在都有一个名称，我们可以在任何测试运行中自动打印出该名称。

``` sh
% go test 
--- FAIL: TestSplit (0.00s)  
    --- FAIL: **TestSplit/trailing_sep** (0.00s)  
        split_test.go:25: expected: [a b c], got: [a b c ]  

```

每个 subtest 都是它自己的匿名函数，因此我们可以使用 `t.Fatalf`，`t.Skipf` 和所有其他 `testing.T` helper，同时保留table driven test 的紧凑性。

#### Individual sub test cases can be executed directly

由于 sub tests 具有名称，因此您可以使用 `go test -run` flag 按名称运行一系列 sub tests。
``` sh
% **go test -run=.*/trailing -v**  
=== RUN   TestSplit  
=== RUN   TestSplit/trailing_sep  
--- FAIL: TestSplit (0.00s)  
    --- FAIL: TestSplit/trailing_sep (0.00s)  
        split_test.go:25: expected: [a b c], got: [a b c ]  
```

### Comparing what we got with what we wanted

现在我们已准备好修复测试用例。 我们来看看错误。
``` sh
--- FAIL: TestSplit (0.00s)  
    --- FAIL: TestSplit/trailing_sep (0.00s)  
        split_test.go:25: expected: [a b c], got: [a b c ]
```

你能发现问题吗？ 很明显，切片是不同的，这就是 `reflect.DeepEqual` 令人烦恼的原因。 但是要找到实际的差异并不容易，你必须发现在 `c` 之后额外的空格。 在这个简单的例子中，这可能看起来很简单，但是当你比较两个复杂的深层嵌套的gRPC结构时，它是任何东西（不一定是空格）。

如果我们切换到 `%#v` 语法以将值视为Go（ish）声明，则可以改进输出：

``` go
got := Split(tc.input, tc.sep)  
if !reflect.DeepEqual(tc.want, got) {  
    t.Fatalf("**expected: %#v, got: %#v**", tc.want, got)  
}
```

现在，当我们运行测试时，很明显问题在于 slice 中有一个额外的空白元素。
``` sh
% go test 
--- FAIL: TestSplit (0.00s)  
    --- FAIL: TestSplit/trailing_sep (0.00s)  
        split_test.go:25: **expected: []string{"a", "b", "c"}, got: []string{"a", "b", "c", ""}**  
```

但是在我们开始修复测试失败之前，我想多谈一点关于选择正确的方法来呈现测试失败的问题。我们的 `Split` 函数很简单，它接受一个原始的字符串并返回一段字符串，但是如果它处理结构，或者更糟的，指向结构的指针呢？

下面是一个例子，其中 `%v` 不起作用：
``` go
func main() {  
    type T struct {  
        I int  
    }  
    x := []*T{ {1}, {2}, {3} }
    y := []*T{ {1}, {2}, {4} }
    fmt.Printf("%v %v\n", x, y)  
    fmt.Printf("%#v %#v\n", x, y)  
}
```

第一个 `fmt.Printf` 打印毫无帮助但符合预期的 addresses slice；`[0xc000096000 0xc000096008 0xc000096010] [0xc000096018 0xc000096020 0xc000096028]`。 但是，我们的 `%#v` 并没有做任何改进。打印一个 addresses slice 强制转换为 `*main.T`；`[]*main.T{(*main.T)(0xc000096000), (*main.T)(0xc000096008), (*main.T)(0xc000096010)} []*main.T{(*main.T)(0xc000096018), (*main.T)(0xc000096020), (*main.T)(0xc000096028)}`


由于使用任何 `fmt.Printf` verb 的局限性，我想从Google引入 [go-cmp](https://github.com/google/go-cmp) 库。

cmp 库的目标是专门比较两个值。这类似于 `reflect.DeepEqual`，但它有更多的功能。所以，使用cmp pacakge，你可以编写如下：
``` go
func main() {  
    type T struct {  
        I int  
    }  
    x := []*T{ {1}, {2}, {3} }
    y := []*T{ {1}, {2}, {4} }
    fmt.Println(cmp.Equal(x, y)) **// false**  
}
```

但是对于我们的测试函数来说，更有用的是 `cmp.Diff` 函数，它将产生一个文本描述，递归地描述两个值之间的区别。
``` go
func main() {  
    type T struct {  
        I int  
    }  
    x := []*T{ {1}, {2}, {3} }
    y := []*T{ {1}, {2}, {4} }
    diff := cmp.Diff(x, y)  
    fmt.Printf(diff)  
}
```

取而代之输出：
``` sh
% go run  
{[]*main.T}[2].I:  
         -: 3  
         +: 4
```

以上表明，在类型 `T` 的 slice 第二个元素，`I` 字段应该是3，但实际上是4。

综上所述，我们进行了 table driven go-cmp test
``` go
func TestSplit(t *testing.T) {  
    tests := map[string]struct {  
        input string  
        sep   string  
        want  []string  
    }{  
        "simple":       {input: "a/b/c", sep: "/", want: []string{"a", "b", "c"}},  
        "wrong sep":    {input: "a/b/c", sep: ",", want: []string{"a/b/c"}},  
        "no sep":       {input: "abc", sep: "/", want: []string{"abc"}},  
        "trailing sep": {input: "a/b/c/", sep: "/", want: []string{"a", "b", "c"}},  
    }  

    for name, tc := range tests {  
        t.Run(name, func(t *testing.T) {  
            got := Split(tc.input, tc.sep)  
**diff := cmp.Diff(tc.want, got)  
            if diff != "" {  
                t.Fatalf(diff)  
            }**  
        })  
    }  
}
```

运行，我们得到
``` sh
% go test  
--- FAIL: TestSplit (0.00s)  
    --- FAIL: TestSplit/trailing_sep (0.00s)  
        split_test.go:27: {[]string}[?->3]:  
                -: <non-existent>  
                +: ""  
FAIL  
exit status 1  
FAIL    split   0.006s
```

使用 `cmp.Diff` 我们的测试工具不仅仅是告诉我们，我们得到的和想要的是不同的。我们的测试告诉我们，字符串的长度是不同的，结构中的第三个索引不应该存在，但是实际输出得到一个空字符串，“”。从此开始，修复测试失败是直接了当的。


[1]:https://golang.org/ref/spec#For_statements "请不要给我发电子邮件，认为地图迭代顺序是random. 事实并非如此."

_原文：[https://dave.cheney.net/2019/05/07/prefer-table-driven-tests](https://dave.cheney.net/2019/05/07/prefer-table-driven-tests)_

