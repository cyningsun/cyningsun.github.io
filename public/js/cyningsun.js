var util = {};
//��ȡurl�еĲ���
util.getUrlParam=function getUrlParam(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //����һ������Ŀ�������������ʽ����
	var r = decodeURI(window.location.search).substr(1).match(reg);  //ƥ��Ŀ�����
	if (r != null) return unescape(r[2]); return null; //���ز���ֵ
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