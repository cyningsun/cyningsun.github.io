var util = {};
//获取url中的参数
util.getUrlParam=function getUrlParam(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
	var r = decodeURI(window.location.search).substr(1).match(reg);  //匹配目标参数
	if (r != null) return unescape(r[2]); return null; //返回参数值
}

/*Category Page*/
var category={};
category.init=function(){
var _this=this;
_this.initPage();
_this.bindEvent();
};

category.initPage=function(){
    var cate = util.getUrlParam('cate');
	if(cate=="" ||cate==null) {
	 return;
	}
	$(".tab-pane").removeClass("active");
	$(".cate").removeClass("active");
	$("."+cate).addClass("active");
	
}
category.bindEvent=function(){
  $(".nav").on("click",function(e) {
	var areaNode = $(e.target);
	if(areaNode.prop("tagName")!="STRONG") {
	  return;
	}
	var cateStr = areaNode.text();
	var cate = cateStr.substring(0,cateStr.indexOf("("));
	$(".tab-pane").removeClass("active");
	$(".cate").removeClass("active");
	$("."+cate).addClass("active");
  });
}

/*Index Page*/