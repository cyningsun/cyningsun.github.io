---
layout: post
title: 软件安装方法总结(YouCompleteMe总结)
category: 后台技术
tags:  VIM
---

###背景
最近从Java转回C++开发，于是开始搭建环境，相较于几年以前使用cscope、ctag、OmniComplete，Linux环境下的开发有了更好的工具，YouCompleteMe。由于菜鸟出炉，花费了若干天才在自己的开发机器上把理想的开发环境搭建起来。客观来讲，Linux下软件安装都是类似的，总结一下Linux下安装的必备素质，希望能够应用于以后的开发中。

###正文
平常所有的开发文档，在网上总是有大量的文档，讲述软件是怎么安装的，甚至很多文档都十分详细。如果你足够幸运，你的Linux系统的基础环境与网文一致，那么你可能很快把环境搭建起来。即使出现一些小问题，在网上也都有相应的解决方法。这种思想可能更适用于一无所知的Linux小白，无所知晓，照猫画虎就行。


作为有独立意识的Linux开发者，应该有一通百通的软件安装流程。

首先，应该能认知到系统基础环境的复杂性，安装所需的工具是否完备，依赖库是否存在，前两者的版本是否符合要求，OS位数，硬件架构等等。认真阅读软件安装的ReadMe，确认Requirement。
如，安装YouCompleteMe，确认[http://llvm.org/docs/GettingStarted.html#requirements](http://llvm.org/docs/GettingStarted.html#requirements)

其次，确认编译时依赖的库路径的查找优先级是否正确，指定合适的库路径。有时机器上可能有多个库版本，尤其是公司开发机上环境存在这种问题的可能性更大。例如，/usr/lib、/usr/local/lib很有可能存在不同版本的libc.so库

最后，根据平台选择合适的编译安装方式。

PS：网文可以用来做什么，网文可以用来参考，一般一些常用的选项，注意事项等等参考。

###结尾
以上根据YouCompleteMe安装有感，根据网文编译LLVM几次因为机器环境的各种问题导致失败。特别是此种大型的软件，每次编译个把小时然后中间失败，总会让人累觉不爱。以下附上主要的安装参数
**LLVM：**   
C=/usr/local/bin/gcc CXX=/usr/local/bin/g++ cmake -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/usr/local/lib64 -L/usr/local/lib64"  -DCMAKE_BUILD_TYPE=Release -DLLVM_BUILD_RUNTIME=Off -DLLVM_INCLUDE_TESTS=Off -DLLVM_INCLUDE_EXAMPLES=Off -DLLVM_ENABLE_BACKTRACES=Off -LLVM_TARGETS_TO_BUILD=x86 -DCMAKE_INSTALL_PREFIX=prefix=/home/cyningsun/local/llvm ..
**YouCompleteMe：**  
cmake -G "Unix Makefiles" -DCMAKE_C_COMPILER=/usr/local/bin/gcc -DCMAKE_CXX_COMPILER=/usr/local/bin/g++ -DPATH_TO_LLVM_ROOT=~/local/llvm -DPYTHON_INCLUDE_DIR=~/local/python/include/python2.7/ -DPYTHON_LIBRARY=~/local/python/lib/python2.7/ ~/.vim/YouCompleteMe/third_party/ycmd/cpp/


