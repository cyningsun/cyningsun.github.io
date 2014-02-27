---
layout: default
title: Category
---

<section class="post-archive">
<div class="year-bundle tabbable fadeInDown animated tabs-left">
<ul class="nav nav-tabs active">
{% for category in site.categories %}
<li class=""><strong data-toggle="tab" onclick="javascript:document.location.href='#{{ category | first }}'">{{ category | first }}({{ category | last | size }})</strong></li>
{% endfor %}
</ul>
<div class="tab-content">
{% for category in site.categories %}
 <div class="tab-pane active" name="{{category | first}}">
{% for post in category.last %}
  <div class="row gutters archive-entry">
	<a href="{{site.url}}{{ post.url }}" title="{{ post.title }}" class="col span_8">{{ post.title }}</a>
	<div class="archive-date col span_4">
	  <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date:"%d/%m/%Y" }}</time>
	</div>
  </div>
{% endfor %}
 </div>
  <hr>
 {% endfor %}
</div>
</div>
</section>