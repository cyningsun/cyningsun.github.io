---
layout: post
title: 深入理解Mybatis-Spring工作原理
category: 后台技术
tags: MYBATIS
---

### Mybatis-Spring做了什么？
MyBatis-Spring 会帮助你将 MyBatis 代码无缝地整合到 Spring 中。 使用这个类库中的类, Spring 将会加载必要的 MyBatis 工厂类和 session 类。 这个类库也提供一个简单的方式来注入 MyBatis 数据映射器和 SqlSession 到业务层的 bean 中。

### Mybatis-Spring如何做到？
Mybatis需要首先扫描到所有的Mybatis的Mapper类，然后将通过session获取该Mapper对应的实例。然后Spring就可以将Mybatis的Mapper实例注入到Service中
使用了。
首先从配置入口来看

```xml
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
  <property name="basePackage" value="" />
</bean>
```

入口类为MapperScannerConfigurer, 该类实现了BeanDefinitionRegistryPostProcessor接口用来查找Mapper类，然后将MapperFactoryBean设置为Mapper的
实现类。MapperFactoryBean是一个代理类，会根据Mapper信息通过sqlSession获取对应Mapper的实例。以上就是Mybatis-Spring的所有任务。

#### MapperScannerConfigurer如何查找Mapper
了解Mapper查找的原理，首先要了解BeanDefinitionRegistryPostProcessor接口。开发人员通过 XML 文件或者 Annotation 预定义配置 bean 的各种属性后，启动 Spring 容器，Spring 容器会首先解析这些配置属性，生成对应都 Bean Definition，装入到 DefaultListableBeanFactory 对象的属性容器中去。Spring 框架会根据配置，过滤出 BeanDefinitionRegistryPostProcessor 类型的 Bean 定义，并通过 Spring 框架生成其对应的 Bean 对象。Spring 容器会在实例化开发人员所定义的 Bean 前先调用该 processor 的 postProcessBeanDefinitionRegistry(...) 方法。此处可以操作和配置Bean Definition。下面是MapperScannerConfigurer的源码

```java
  public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
    if (this.processPropertyPlaceHolders) {
      processPropertyPlaceHolders();
    }
	//配置需要查找的Mapper类的信息
    ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
    scanner.setAddToConfig(this.addToConfig);
    scanner.setAnnotationClass(this.annotationClass);
    scanner.setMarkerInterface(this.markerInterface);
    scanner.setSqlSessionFactory(this.sqlSessionFactory);
    scanner.setSqlSessionTemplate(this.sqlSessionTemplate);
    scanner.setSqlSessionFactoryBeanName(this.sqlSessionFactoryBeanName);
    scanner.setSqlSessionTemplateBeanName(this.sqlSessionTemplateBeanName);
    scanner.setResourceLoader(this.applicationContext);
    scanner.setBeanNameGenerator(this.nameGenerator);
    scanner.registerFilters();
    scanner.scan(StringUtils.tokenizeToStringArray(this.basePackage, ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS));
  }
```

ClassPathMapperScanner继承了ClassPathBeanDefinitionScanner，scanner.scan()语句会调用ClassPathMapperScanner的doScan函数。然后此函数中将MapperFactoryBean设置为查找到的Mapper的实现类

```java
 public Set<BeanDefinitionHolder> doScan(String... basePackages) {
    Set<BeanDefinitionHolder> beanDefinitions = super.doScan(basePackages);

    if (beanDefinitions.isEmpty()) {
      logger.warn("No MyBatis mapper was found in '" + Arrays.toString(basePackages) + "' package. Please check your configuration.");
    } else {
	  //遍历找到的Mapper
      for (BeanDefinitionHolder holder : beanDefinitions) {
        GenericBeanDefinition definition = (GenericBeanDefinition) holder.getBeanDefinition();

        //下面的definition.getPropertyValues().add函数均为实例化代理类设置参数，以使得MapperFactoryBean完成代理
        definition.getPropertyValues().add("mapperInterface", definition.getBeanClassName());
		// 设置Mapper的实现类为MapperFactoryBean
        definition.setBeanClass(MapperFactoryBean.class);

        definition.getPropertyValues().add("addToConfig", this.addToConfig);

        boolean explicitFactoryUsed = false;
        if (StringUtils.hasText(this.sqlSessionFactoryBeanName)) {
          definition.getPropertyValues().add("sqlSessionFactory", new RuntimeBeanReference(this.sqlSessionFactoryBeanName));
          explicitFactoryUsed = true;
        } else if (this.sqlSessionFactory != null) {
          definition.getPropertyValues().add("sqlSessionFactory", this.sqlSessionFactory);
          explicitFactoryUsed = true;
        }

        if (StringUtils.hasText(this.sqlSessionTemplateBeanName)) {
          definition.getPropertyValues().add("sqlSessionTemplate", new RuntimeBeanReference(this.sqlSessionTemplateBeanName));
          explicitFactoryUsed = true;
        } else if (this.sqlSessionTemplate != null) {
          definition.getPropertyValues().add("sqlSessionTemplate", this.sqlSessionTemplate);
          explicitFactoryUsed = true;
        }

        if (!explicitFactoryUsed) {
          definition.setAutowireMode(AbstractBeanDefinition.AUTOWIRE_BY_TYPE);
        }
      }
    }

    return beanDefinitions;
  }
```

然后就是MapperFactoryBean根据实例化的信息创建对应的Mapper实例了

```java
  public T getObject() throws Exception {
    return getSqlSession().getMapper(this.mapperInterface);
  }

```

就这样Mybatis-Spring省去了手工配置Mapper，帮助开发者实现自动的配置，使得开发快速。

#### Mybatis涉及的主要类
MapperScannerConfigurer -- ClassPathMapperScanner -- MapperFactoryBean


(完)





