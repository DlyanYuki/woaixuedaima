//定义getID(id)

function getID(id){
	return document.getElementById(id)
}

function getTag(tag,obj){
	return (typeof obj=='object'?obj:getID(obj)).getElementsByTagName(tag); 
}
function mainfun(mainObj,t){
	
	//调用mainfun,mainObj=movePic1,t=2000
	
		var cut = 0;
		var timer='';	
		
		
		var getpic = getTag('li',getTag('div',getID(mainObj))[0]);
		var num = getpic.length;
		var getbtn = getTag('li',getTag('div',getID(mainObj))[1]);
		var gettext = getTag('li',getTag('div',getID(mainObj))[2]); 
		
		
		for(i=0;i<num;i++){
			getpic[i].style.display="none";
			gettext[i].style.display="none";
			getbtn[i].onclick=(function(i){
			return function(){ 
					getbtn[i].className="sel";
					changePic(i);}
			})(i);
		}		
		
		getpic[cut].style.display="block";
		getbtn[cut].className="sel";
		gettext[cut].style.display="block";
		getID(mainObj).onmouseover=function(){clearInterval(timer);}
		getID(mainObj).onmouseout=function(){
			
				timer = setInterval(autoPlay,t);
				
		}
		function changePic(ocut){
			for(i=0;i<num;i++){
					cut=ocut;
					getpic[i].style.display="none";
					getbtn[i].className=""			
					gettext[i].style.display="none";
			}
			getpic[cut].style.display="block";
			getbtn[cut].className="sel";
			gettext[cut].style.display="block"				   
		}
							   
		function autoPlay(){
				if(cut>=num-1){cut=0 ;}
				else{cut++ ;}
				changePic(cut);
		}
		timer = setInterval(autoPlay,t);//调用mainfun,mainObj=movePic1,t=2000
}	
mainfun("movePic1",3000);






/* 焦点图 */
$(function(){
    var $root = $('#show'),
        root_w = $root.width();
    var p = $root.find('> div.img > span'),
        n = p.children().length;
    	p.children().eq(0).clone().appendTo(p);
    function onoff(on, off) {
        (on !== -1) && btns.eq(on).addClass('on');
        (off !== -1) && btns.eq(off).removeClass('on');
    }
    function dgo(n, comp) {
        var idx = n > max ? 0 : n;
        onoff(idx, cur);
        cur = idx;
        p.stop().animate({left: -1 * root_w * n}, {duration: dur, complete: comp});
				if(idx == 0 ){p.children().eq(n-1).clone().appendTo('.mk1');}else{$('.mk1').empty()};
    }
    // slast -> 如果播放完最后1张，要如何处理
    //    true 平滑切换到第1张
    var cur = 0,
        max = n - 1,
        pt = 0,
        stay = 5 * 1000, /* ms */
        dur = .6 * 1000, /* ms */
        btns;
    function go(dir, slast) {
        pt = +new Date();
        if (dir === 0) {
            onoff(cur, -1);
            p.css({left: -1 * root_w * cur});
            return;
        }
        var t;
        if (dir > 0) {
            t = cur + 1;
            if (t > max && !slast) {
                t = 0;
            }
            if (t <= max) {
                return dgo(t);
            }
            return dgo(t, function(){
                p.css({left: 0});
            });
        } else {
            t = cur - 1;
            if (t < 0) {
                t = max;
                p.css({left: -3 * root_w * (max + 1)});
                return dgo(t);
            } else {
                return dgo(t);
            }
        }
    }
    btns = $((new Array(n + 1)).join('<i></i>'))
        .each(function(idx, el) {
            $(el).data({idx: idx});
        });
    var pn_btn = $('<s class="prev"><i></i></s><s class="next"><i></i></s>');
    $('<div class="btns"/ >')
        .append(
            $('<b/>')
                .append(btns)
                .delegate('i', 'click', function(ev) {
                    dgo($(this).data('idx'));
                })
                .css({width: n * 20, marginLeft: -10 * n})
        )
        .delegate('s', 'click', function(ev) {
            go($(this).is('.prev') ? -1 : 1, true);
        })
        .append(pn_btn)
        .appendTo($root);

    go(1);
    // 自动播放
    var ie6 = $.browser.msie && $.browser.version < '7.0';
    $root.hover(function(ev) { 
        // $root[(ev.type == 'mouseenter' ? 'add' : 'remove') + 'Class']('show-hover');
        if (ie6) {
            pn_btn[ev.type == 'mouseenter' ? 'show' : 'hide']();
        } else {
            pn_btn.stop()['fade' + (ev.type == 'mouseenter' ? 'In' : 'Out')]('fast');
        }
    });
    if ($root.attr('rel') == 'autoPlay') {
       var si = setInterval(function(){
            var now = +new Date();
            if (now - pt < stay) {
                return;
            }
            go(1, true);
        }, 1000);
			 p.mouseover(function(){ clearInterval(si);})
			 p.mouseout(function(){
						si = setInterval(function(){
            var now = +new Date();
            if (now - pt < stay) {
                return;
            }
            go(1, true);
        }, 1000);})
    }
		var wid = $(document.body).width();
		var swid = (wid-1000)/2;
		var bwid = root_w * n;
		$('#show').css('width',wid);$('#show .img').css('width',wid);
		$('#show .btns').css('left',swid)
		$('.masks').css('width',swid);$('.mk2').css('right',0);
		$('#show .img span').css(({paddingLeft: swid }))
})();










