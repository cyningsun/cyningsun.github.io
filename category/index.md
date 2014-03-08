---
layout: category
title: 分类
---

<section class=" fadeInDown animated">
<ul class="span2 nav nav-tabs">
{% for category in site.categories %}
{% if forloop.first %}<li class="{{ category | first  | upcase}} cate active">{% else %}<li class="{{ category | first  | upcase}} cate">{% endif %}
<strong>{{ category | first  | upcase}}({{ category | last | size }})</strong>
</li>
{% endfor %}
</ul>

<ul class="offset2 span10 nav tab-content active">
	{% for category in site.categories %}
		{% if forloop.first %}
		 <ul class="{{category | first | upcase }} tab-pane active">
		{% else %}
		   <ul class="{{category | first | upcase}} tab-pane">
		{% endif %}
		{% for post in category.last %}
			<li onClick="javascript:location.href='{{ site.url }}{{ post.url }}'" >
			 <a class="span7" >{{ post.title }}</a>
			 <a class="span4 time">{{ post.date | date:"%Y-%m-%d" }}</a>
			</li>
		{% endfor %}
	</ul>
	{% endfor %}
</ul>
</section>