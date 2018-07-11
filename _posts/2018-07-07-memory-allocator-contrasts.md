---
layout: post
title: ptmalloc、tcmalloc与jemalloc对比分析
category: 后台开发
tags: malloc
---
### 背景介绍
在开发微信看一看期间，为了进行耗时优化，基础库这层按照惯例使用tcmalloc替代glibc标配的ptmalloc做优化，CPU消耗和耗时确实有所降低。但在晚上高峰时期，在CPU刚刚超过50%之后却出现了指数上升，服务在几分钟之内不可用。最终定位到是tcmalloc在内存分配的时候使用自旋锁，在锁冲突严重的时候导致CPU飙升。为了弄清楚tcmalloc到底做了什么，仔细了解各种内存管理库迫在眉睫。


内存管理不外乎三个层面，用户程序层，C运行时库层，内核层。allocator 正是值C运行时库的内存管理模块, 它响应用户的分配请求, 向内核申请内存, 然后将其返回给用户程序。为了保持高效的分配, allocator 一般都会预先分配一块大于用户请求的内存, 并通过某种算法管理这块内存. 来满足用户的内存分配要求, 用户 free 掉的内存也并不是立即就返回给操作系统, 相反, allocator 会管理这些被 free 掉的空闲空间, 以应对用户以后的内存分配要求. 也就是说, allocator 不但要管理已分配的内存块, 还需要管理空闲的内存块, 当响应用户分配要求时, allocator 会首先在空闲空间中寻找一块合适的内存给用户, 在空闲空间中找不到的情况下才分配一块新的内存。业界常见的库包括：ptmalloc(glibc标配)、tcmalloc(google)、jemalloc(facebook)


### ptmalloc
GNU Libc 的内存分配器(allocator)—ptmalloc，起源于Doug Lea的malloc。由Wolfram Gloger改进得到可以支持多线程。

在Doug Lea实现的内存分配器中只有一个主分配区（main arena），每次分配内存都必须对主分配区加锁，分配完成后释放锁，在SMP多线程环境下，对主分配区的锁的争用很激烈，严重影响了malloc的分配效率。ptmalloc增加了动态分配区（dynamic arena），主分配区与动态分配区用环形链表进行管理。每一个分配区利用互斥锁（mutex）使线程对于该分配区的访问互斥。每个进程只有一个主分配区，但可能存在多个动态分配区，ptmalloc根据系统对分配区的争用情况动态增加动态分配区的数量，分配区的数量一旦增加，就不会再减少了。主分配区在二进制启动时调用sbrk从heap区域分配内存，Heap是由用户内存块组成的连续的内存域。而动态分配区每次使用mmap()向操作系统“批发”HEAP_MAX_SIZE大小的虚拟内存，如果内存耗尽，则会申请新的内存链到动态分配区heap data的“strcut malloc_state”。如果用户请求的大小超过HEAP_MAX_SIZE，动态分配区则会直接调用mmap()分配内存，并且当free的时候调用munmap()，该类型的内存块不会链接到任何heap data。用户向请求分配内存时，内存分配器将缓存的内存切割成小块“零售”出去。从用户空间分配内存，减少系统调用，是提高内存分配速度的好方法，毕竟前者要高效的多。


##### glibc向看内存管理
在「glibc malloc」中主要有 3 种数据结构：
- malloc_state(Arena header)：一个 thread arena 可以维护多个堆，这些堆共享同一个arena header。Arena header 描述的信息包括：bins、top chunk、last remainder chunk 等；
- heap_info(Heap Header)：每个堆都有自己的堆 Header（注：也即头部元数据）。当这个堆的空间耗尽时，新的堆（而非连续内存区域）就会被 mmap 当前堆的 aerna 里；
- malloc_chunk(Chunk header)：根据用户请求，每个堆被分为若干 chunk。每个 chunk 都有自己的 chunk header。内存管理使用malloc_chunk，把heap当作link list从一个内存块游走到下一个块。

```c
struct malloc_state {
	mutex_t mutex;
	int flags;
	mfastbinptr fastbinsY[NFASTBINS];
	/* Base of the topmost chunk -- not otherwise kept in a bin */
	mchunkptr top;
	/* The remainder from the most recent split of a small request */
	mchunkptr last_remainder;
	/* Normal bins packed as described above */
	mchunkptr bins[NBINS * 2 - 2];
	unsigned int binmap[BINMAPSIZE];
	struct malloc_state *next;
	/* Memory allocated from the system in this arena. */
	INTERNAL_SIZE_T system_mem;
	INTERNAL_SIZE_T max_system_mem;
};

typedef struct _heap_info {
	mstate ar_ptr; /* Arena for this heap. */
	struct _heap_info *prev; /* Previous heap. */
	size_t size; /* Current size in bytes. */
	size_t mprotect_size; /* Size in bytes that has been mprotected
	PROT_READ|PROT_WRITE. */
	/* Make sure the following data is properly aligned, particularly
	that sizeof (heap_info) + 2 * SIZE_SZ is a multiple of
	MALLOC_ALIGNMENT. */
	char pad[-6 * SIZE_SZ & MALLOC_ALIGN_MASK];
} heap_info;

struct malloc_chunk {
	INTERNAL_SIZE_T prev_size; /* Size of previous chunk (if free). */
	INTERNAL_SIZE_T size; /* Size in bytes, including overhead. */
	struct malloc_chunk* fd; /* double links -- used only if free. */
	struct malloc_chunk* bk;
	/* Only used for large blocks: pointer to next larger size. */
	struct malloc_chunk* fd_nextsize; /* double links -- used only if free. */
	struct malloc_chunk* bk_nextsize;
};
```

![skiplist]({{ site.url }}/public/blog-img/allocator/ptmalloc-logical.png)

>
注意：Main arena 无需维护多个堆，因此也无需 heap_info。当空间耗尽时，与 thread arena 不同，main arena 可以通过 sbrk 拓展堆段，直至堆段「碰」到内存映射段；
 
	 
##### 线程间内存管理

当某一线程需要调用malloc()分配内存空间时，该线程先查看线程私有变量中是否已经存在一个分配区，如果存在，尝试对该分配区加锁，如果加锁成功，使用该分配区分配内存，如果失败，该线程搜索循环链表试图获得一个没有加锁的分配区。如果所有的分配区都已经加锁，那么malloc()会开辟一个新的分配区，把该分配区加入到全局分配区循环链表并加锁，然后使用该分配区进行分配内存操作。在释放操作中，线程同样试图获得待释放内存块所在分配区的锁，如果该分配区正在被别的线程使用，则需要等待直到其他线程释放该分配区的互斥锁之后才可以进行释放操作。

>
For 32 bit systems:    
    Number of arena = 2 * number of cores + 1.    
For 64 bit systems:    
    Number of arena = 8 * number of cores + 1.  
	

##### 线程中内存管理
对于空闲的chunk，ptmalloc采用分箱式内存管理方式，每一个内存分配区中维护着[bins]的列表数据结构，用于保存free chunks。根据空闲chunk的大小和处于的状态将其放在四个不同的bin中，这四个空闲chunk的容器包括fast bins，unsorted bin， small bins和large bins。

从工作原理来看：
- Fast bins是小内存块的高速缓存，当一些大小小于64字节的chunk被回收时，首先会放入fast bins中，在分配小内存时，首先会查看fast bins中是否有合适的内存块，如果存在，则直接返回fast bins中的内存块，以加快分配速度。
- Usorted bin只有一个，回收的chunk块必须先放到unsorted bin中，分配内存时会查看unsorted bin中是否有合适的chunk，如果找到满足条件的chunk，则直接返回给用户，否则将unsorted bin的所有chunk放入small bins或是large bins中。
- Small bins用于存放固定大小的chunk，共64个bin，最小的chunk大小为16字节或32字节，每个bin的大小相差8字节或是16字节，当分配小内存块时，采用精确匹配的方式从small bins中查找合适的chunk。
- Large bins用于存储大于等于512B或1024B的空闲chunk，这些chunk使用双向链表的形式按大小顺序排序，分配内存时按最近匹配方式从large bins中分配chunk。

从作用来看：
- Fast bins 可以看着是small bins的一小部分cache，主要是用于提高小内存的分配效率，虽然这可能会加剧内存碎片化，但也大大加速了内存释放的速度！
- Unsorted bin 可以重新使用最近 free 掉的 chunk，从而消除了寻找合适 bin 的时间开销，进而加速了内存分配及释放的效率。
- Small bins 相邻的 free chunk 将被合并，这减缓了内存碎片化，但是减慢了 free 的速度；
- Large bin 中所有 chunk 大小不一定相同，各 chunk 大小递减保存。最大的 chunk 保存顶端，而最小的 chunk 保存在尾端；查找较慢，且释放时两个相邻的空闲 chunk 会被合并。

其中fastbins保存在malloc_state结构的fastbinsY变量中，其他三者保存在malloc_state结构的bins变量中。
![skiplist]({{ site.url }}/public/blog-img/allocator/ptmalloc-free-bins.png)

##### Chunk说明
一个 arena 中最顶部的 chunk 被称为「top chunk」。它不属于任何 bin 。当所有 bin 中都没有合适空闲内存时，就会使用 top chunk 来响应用户请求。当 top chunk 的大小比用户请求的大小小的时候，top chunk 就通过 sbrk（main arena）或 mmap（ thread arena）系统调用扩容。

「last remainder chunk」即最后一次 small request 中因分割而得到的剩余部分，它有利于改进引用局部性，也即后续对 small chunk 的 malloc 请求可能最终被分配得彼此靠近。当用户请求 small chunk 而无法从 small bin 和 unsorted bin 得到服务时，分配器就会通过扫描 binmaps 找到最小非空 bin。正如前文所提及的，如果这样的 bin 找到了，其中最合适的 chunk 就会分割为两部分：返回给用户的 User chunk 、添加到 unsorted bin 中的 Remainder chunk。这一 Remainder chunk 就将成为 last remainder chunk。当用户的后续请求 small chunk，并且 last remainder chunk 是 unsorted bin 中唯一的 chunk，该 last remainder chunk 就将分割成两部分：返回给用户的 User chunk、添加到 unsorted bin 中的 Remainder chunk（也是 last remainder chunk）。因此后续的请求的 chunk 最终将被分配得彼此靠近。

##### 问题
- 如果后分配的内存先释放，无法及时归还系统。因为 ptmalloc 收缩内存是从 top chunk 开始,如果与 top chunk 相邻的 chunk 不能释放, top chunk 以下的 chunk 都无法释放。
- 内存不能在线程间移动，多线程使用内存不均衡将导致内存浪费
- 每个chunk至少8字节的开销很大
- 不定期分配长生命周期的内存容易造成内存碎片，不利于回收。 

从上述来看ptmalloc的主要问题其实是内存浪费以及内存碎片。频繁进行整理碎片与释放内存，需要付出的是性能的代价。


### tcmalloc



http://core-analyzer.sourceforge.net/index_files/Page335.html
https://blog.csdn.net/maokelong95/article/details/51989081
