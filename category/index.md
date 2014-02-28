---
layout: category
title: Category
---

<section class="post-archive">
<div class="year-bundle tabbable fadeInDown animated tabs-left">
<ul class="nav nav-tabs active">
{% for category in site.categories %}
{% if forloop.first %}<li class="cate active">{% else %}<li class="cate">{% endif %}<strong data-toggle="tab" onclick="javascript:document.location.href='#{{ category | first }}'">{{ category | first  | upcase}}({{ category | last | size }})</strong>
</li>
{% endfor %}
</ul>
<div class="tab-content">
{% for category in site.categories %}
{% if forloop.first %}
 <div class="{{category | first | upcase }} tab-pane active">
{% else %}
   <div class="{{category | first | upcase}} tab-pane">
{% endif %}
{% for post in category.last %}
  <div class="row gutters archive-entry">
	<a href="{{site.url}}{{ post.url }}" title="{{ post.title }}" class="col span_8">{{ post.title }}</a>
	<div class="archive-date col span_4">
	  <time datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date:"%d/%m/%Y" }}</time>
	</div>
  </div>
{% endfor %}
 </div>
 {% endfor %}
</div>
</div>
</section>