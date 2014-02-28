var category={};
category.init=function(){
var _this=this;
_this.bindEvent();
};
category.bindEvent=function(){
  $(".nav").on("click",function(e) {
	var areaNode = $(e.target);
	if(areaNode.prop("tagName")!="STRONG") {
	  return;
	}
	var cateStr = areaNode.text();
	var cate = cateStr.substring(0,cateStr.indexOf("("));
	$(".tab-pane").removeClass("active");
	$("."+cate).addClass("active");
	$(".cate").removeClass("active");
	areaNode.parent().addClass("active");
  });
}