---
layout: post
title: 深入理解Mybatis工作原理
category: 后台技术
tags: MYBATIS
---
### 基本原理
本文中Mybatis基本原理切入，同时摘录Mybatis的源码，理解Mybatis框架的工作原理。首先看一段JDBC代码：

```java
	Class.forName("com.mysql.jdbc.Driver");
	String url = "jdbc:mysql://localhost:3306/localdb";
	Connection con = DriverManager.getConnection(url, "root","password");			
	String sql = "SELECT name FROM t_test_employee WHERE id = ?";
	PreparedStatement ps = con.prepareStatement(sql);
	ps.setString(1, "123");
	ResultSet rs = ps.executeQuery();
	while(rs.next()){
		System.out.println("name=" + rs.getString(1));
	}
	con.close();
```
大家应该比较熟悉这段代码，典型的jdbc流程: 建立连接->传递sql->传递参数->sql执行->处理结果->关闭连接。ORM框架的本质是抽取共性、封装逻辑。现在，如果我们来设计一个ORM框架该如何设计？
仔细考虑JDBC流程，可以发现流程中需要用户配置的输入和输出是变化的(如下，括号中部分)，而其他部分则是固定不变的逻辑。

> 建立连接(数据源配置信息)->传递sql(sql语句)->传递参数(sql参数)->sql执行->处理结果(映射关系)->关闭连接

数据源配置信息:配置文件，在启动时从配置文件中读取并建立数据源对象    
Sql语句：配置文件(代码)，在启动时抽取解析，以<Key,SQL>的形式存储      
Sql参数：java bean对象，在执行前从对象中抽取       
映射关系：配置文件(代码)，根据映射关系读取结果集并创建java bean返回。    

不难想象，Mybatis会在启动时"读取配置数据(builder)"，"建立数据源(datasource)"; 然后程序开始执行，传递sql语句的"Key"和java bean; 最后"执行SQL，处理结果(executor)"。 当然，Mybatis也要负责"连接管理(session)"和"事务管理(transaction)"等内容。

### 源码解析
Mybatis的配置分为两种：基于XML配置和基于注解配置。两者的原理大同小异，在此仅以“基于注解配置”为例解析Mybatis。

#### 启动配置解析
“基于注解配置”一般使用Mybatis-Spring，其工作原理详见[深入理解Mybatis-Spring工作原理](http://cyningsun.github.io/08-17-2014/reading-mybatis-spring-source-code.html)，可以看到启动后所有Mapper的实现类被设置为了MapperFactoryBean，。MapperFactoryBean是一个工厂类，它通过SqlSession-Configuration-MapperRegistry得到Mapper的代理类MapperProxy，以实例化Mapper属性。

#### SQL(参数)解析与执行
Mapper执行时调用MapperProxy的invoke方法，MapperProxy创建MapperMethod对象用于执行具体SQL，通过annotation获取得到参数化的sql语句，通过传递的参数获取SQL参数。
	
```java
  public MapperMethod(Class<?> mapperInterface, Method method, Configuration config) {
	//解析annotation中的SQL语句
    this.command = new SqlCommand(config, mapperInterface, method);
	//处理sql，建立①param数组
    this.method = new MethodSignature(config, method);
  }
  
   public Object execute(SqlSession sqlSession, Object[] args) {
    Object result;
    if (SqlCommandType.INSERT == command.getType()) { //判断sql类型
	  //使用①param数组建立param-Object对应关系
      Object param = method.convertArgsToSqlCommandParam(args);
	  //执行sql并处理结果集的映射
      result = rowCountResult(sqlSession.insert(command.getName(), param));
    }
	...
	
	//XXXExecutor.java
	public int doUpdate(MappedStatement ms, Object parameter) throws SQLException {
    Statement stmt = null;
    try {
      Configuration configuration = ms.getConfiguration();
      StatementHandler handler = configuration.newStatementHandler(this, ms, parameter, RowBounds.DEFAULT, null, null);
	  //使用TypeHandler处理参数
      stmt = prepareStatement(handler, ms.getStatementLog());
      return handler.update(stmt);
    } finally {
      closeStatement(stmt);
    }
  }
```

#### 结果集映射
略。

以上即是Mybatis的大致原理，更详细的当然就是RTFC咯。Mybatis的实现很明了，功能相对简单，还有更多的东西可以去扩展，譬如：多数据源、数据库切分、缓存、连接管理等等。




(完)





