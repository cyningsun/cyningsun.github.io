---
layout: post
title: Mysql字符集
category: 后台技术
tags: mysql
---
字符集有4个级别的默认设置：服务器级、数据库级、表级和连接级。
####1、服务器字符集和校对
MySQL设置服务器字符集：

- 通过重新编译

```bash
shell> ./configure --with-charset=latin1
```
- 根据运行时的设定值

```bash
shell> mysqld --default-character-set=latin1
```

####2、数据库、表、列字符集
数据库、表、列字符集都可以通过相应的语句进行指定，不再列出。     
详细参考：https://dev.mysql.com/doc/refman/5.1/zh/charset.html

####3、连接字符集
在客户端和服务器的连接处理中也涉及了字符集变量。每一个客户端有一个连接相关的字符集变量。例如查询，通过连接发送到服务器。服务器通过连接发送响应给客户端，例如结果集。           

- 当查询离开客户端后，在查询中使用哪种字符集？服务器使用character_set_client变量作为客户端发送的查询中使用的字符集。
- 当服务器接收到查询后应该转换为哪种字符集？服务器使用character_set_connection变量。它将客户端发送的查询从character_set_client系统变量转换到character_set_connection
- 当服务器发送结果集或返回错误信息到客户端之前应该转换为哪种字符集？服务器使用character_set_results变量指示服务器返回查询结果到客户端使用的字符集。

信息传递的路径如下所示：
信息输入路径：client→connection→server；
信息输出路径：server→connection→results

####4、连接字符集设置
有两个语句影响连接字符集：

```sql
SET NAMES 'charset_name'
SET CHARACTER SET charset_name
```
- SET NAMES显示客户端发送的SQL语句中使用什么字符集。它还为服务器发送回客户端的结果指定了字符集。SET NAMES 'x'语句与这三个语句等价：

	```sql
	mysql> SET character_set_client = x;
	mysql> SET character_set_results = x;
	mysql> SET character_set_connection = x;
	```
- SET CHARACTER SET语句是类似的，为默认数据库设置连接字符集和校对规则。SET CHARACTER SET x语句与这三个语句等价：

	```sql
	mysql> SET character_set_client = x;
	mysql> SET character_set_results = x;
	mysql> SET collation_connection = @@collation_database;
	```
####5、连接字符集总结
当一个客户端连接时，它向服务器发送希望使用的字符集名称。服务器为那个字符集设置character_set_client、character_set_results和 character_set_connection变量。（实际上，服务器为使用该字符集执行一个SET NAMES操作。）对于mysql客户端，如果你希望使用与默认字符集不同的字符集，不需要每次启动时执行SET NAMES语句。可以在mysql语句行中或者选项文件中添加一个--default-character-set选项设置。例如，你每次运行mysql时，以下的选项文件设置把三个字符集变量修改为koi8r：

```
[mysql]
default-character-set=koi8r
```


(完)


---

