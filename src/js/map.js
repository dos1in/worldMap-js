/*
 * World map built using Raphael.js.
 * Licensed under the MIT.
 * Copyright (c) 2013 DosLin
 * @name     worldMap-js
 * @author   DosLin (http://doslin.com)
 */

;(function(exports){

	var _this = exports;

	var datasStack = [],
		administrativeAttr = {
			"fill": "#3FA9F5",
			"stroke": "#ddd",
			"stroke-width": 1,
			"stroke-linejoin": "round"
		};

	exports.draw = function (datas, ops) {
		_this.drawMap(datas, ops);
	};

	exports.drawMap = function (datas, ops) {
			_this.datas = datas;
			
			if (!_this.hasOwnProperty("ops")) {
				_this.ops = ops;
			}

			// initialize canvas
			if (!_this.paper) {
				_this.paper = Raphael(_this.ops.owner, _this.ops.width, _this.ops.height);
			}
			
			var mapData = _this.datas.mapData;
			var areaData = _this.datas.areaData;
			
			if(mapData == undefined) { // no map area data
				_this.paper.text(_this.ops.width/2, _this.ops.height/2, "No area data in mapData.js！").attr('font-size',12);
				return;
			}
			
			mapData = _this.splitIdData(mapData);

			_this.mapId = mapData.mapId;

			var administrativeData = mapData.administrativeData;
			var circleData = mapData.circleData;

			// draw area map
			_this.drawAdministrativeMap(administrativeData);
			// set animation according to 'areaData'
			administrativeData && _this.initAreaMarkAnimate(administrativeData, areaData);
			// create floating tips
			_this.mapInfo = _this.createMapInfoDiv();

	};

	exports.splitIdData = function (mapData) {
		var circleData = {};
		var areaData = {};
		var id = "";
		for (var data in mapData) {
			if(mapData[data].path) {
				areaData[data] = mapData[data];
			} else {
				id = mapData[data];
			}
		}
		return {'administrativeData': areaData, mapId: id};
	};

	exports.reDraw = function (datas) {
		_this.paper.clear();
		_this.drawMap(datas, null);
		
		if (datasStack.length > 0) {
			(_this.backBtn == null) ? (_this.backBtn = _this.drawBackButton())
								 	:_this.backBtn.show();
		} else {
			_this.backBtn && _this.backBtn.hide();
		}

	};

	exports.mouseIn = function (areaDataState, e) {
		_this.mapInfo.innerHTML = _this.createMapInfoTips(areaDataState);
									  
		var xPos,
			yPos;
									  
		if (isNaN(e.pageX)) {		
			xPos = e.clientX + document.body.scrollLeft - document.body.clientLeft;
			yPos = e.clientY + document.body.scrollTop - document.body.clientTop;
		} else {
			xPos = e.pageX;
			yPos = e.pageY;	
		}
		_this.mapInfo.style.left = xPos + 5 + "px";
		_this.mapInfo.style.top = yPos + 20 + "px";
		_this.mapInfo.style.display = "block";
		_this.paper.safari();
	};

	exports.mouseOut = function (e) {
		_this.mapInfo.style.display = "none";
		_this.paper.safari();	
	};

	exports.createMapInfoTips = function (areaDataState) {
		var infoHtml = [];
		for (var key in areaDataState) {
			infoHtml.push(areaDataState[key], "<br />");
		}
		return infoHtml.join('');
	};

	exports.createMapInfoDiv = function () {
		var div = document.getElementById("mapInfo");
		if (div) {
			return div;
		}
		div = document.createElement('div');
		div.className = "mapInfo";
		div.setAttribute('id', "mapInfo");
		document.body.insertBefore(div, document.body.childNodes[0]);

		return div;
	};
	
	exports.blinker = function (obj, initColor, endColor, t) {
		var loop = function(){
				obj.animate({fill: (obj.attr("fill")==initColor? endColor : initColor)}, t, loop);
			};
		loop();
	};

	exports.mouseClick = function (obj, areaDataState, e) {		
		var subArea = obj['subArea'];
		if(subArea){			
			_this.mouseOut(e);
			datasStack.push(_this.datas);
			_this.reDraw({
				mapData :subArea, 
				areaData: _this.datas.areaData
			});	
		} else{
			window.open(areaDataState.url);
		}
	};

	exports.drawAdministrativeMap = function (area) {
		if(_this.ops.animation) {
			var anim = Raphael.animation({"opacity":1},1200,"elastic");
			for(var mData in area){
				area[mData].pathE = _this.paper.path(area[mData].path).attr(administrativeAttr).attr("opacity", 0).animate(anim.delay(500));
			}
			for(var mData in area){
				_this.setAdText(area[mData]);
			}
		} else {
			for(var mData in area){
				area[mData].pathE = _this.paper.path(area[mData].path).attr(administrativeAttr);
			}
			for(var mData in area){
				_this.setAdText(area[mData]);
			}
		}
	};

	exports.setAdText = function (st) {
		var pos = st.pos;
		if (!pos) {
			return;
		}
		if (_this.ops.animation) {
			var anim = Raphael.animation({opacity:1},1200);
			st.adText = _this.paper.text(pos.xPos, pos.yPos, st.areaName).attr({font:"12px 宋体 Arial",opacity:0,'text-anchor':'start'}).animate(anim.delay(500));
		} else {
			st.adText = _this.paper.text(pos.xPos, pos.yPos, st.areaName).attr({font:"12px 宋体 Arial",'text-anchor':'start'});
		}

	};

	exports.initAreaMarkAnimate = function (area, areaData) {
		if(areaData == undefined){
			return;
		}
		var current = null;
		
		var over = function(e) {
			var pathObj = this.pathE;
			current = pathObj;
			
			_this.mouseIn(pathObj.markArea,e);

			pathObj.attr("cursor","pointer");
			if (this.hasOwnProperty("adText")) {
				this.adText.attr("cursor","pointer");
			}	
			pathObj.animate({'stroke-width':"2", 'opacity':"0.7"},300,">");
		};

		var out = function(e) {
			_this.mouseOut(e);

			this.pathE.animate({'stroke-width':"1", 'opacity':"1"},300,">");
		};
		
		for(var state in area) {
			var markArea = areaData[state];

			if(!markArea) continue;

			var pathObj = area[state]['pathE'];
			
			var endColor = "#3FA9F5";
			
			pathObj.attr({fill: endColor}) ;		
			
			(function(pathObj,st){

				if (st.hasOwnProperty("adText")) {
					_this.blinker(st.adText, "#000", "#FFF", 500);
				} else {
					setTimeout(function(){
						_this.drawPin(pathObj);
					}, 500);
				}
				
			})(pathObj,area[state]);
			
			pathObj.areaCurr = state;
			
			pathObj.markArea = markArea;
			var pathText = _this.paper.set();
			pathText.push(pathObj);
			if(area[state].hasOwnProperty("adText")) {
				pathText.push(area[state].adText);
			}
			pathText.hover(over, out, area[state]);
			pathText.click(
				function(e){
					_this.mouseClick(area[current.areaCurr], current.markArea, e);
				}
			);
		}
		
	};
	
	exports.drawBackButton = function () {
		var bBtn = _this.paper.path("M21.122,22.041L38.5,32.074v-5.155c0,0,3.83,0,7.529,0c3.7,0,7.885,4.854,7.885,4.854s-1.141-11.417-5.326-13.32C44.399,16.551,38.5,17.161,38.5,17.161v-5.154L21.122,22.041z");
		bBtn.attr({fill:"#929293",stroke:"none",title:"back to top area",'cursor':'pointer'});
		bBtn.hover(function(){
			this.animate({stroke: "#8A8A8A","stroke-width":2}, 500);
		},function(){
			this.animate({stroke:"none","stroke-width":0}, 500);
		});
		bBtn.click(function(){
			//if(window.confirm('whether to go back？')){
			var datas = datasStack.pop();
			_this.reDraw(datas);
			//}
		});
	};

	exports.drawPin = function (obj) {
		var bbox = obj.getBBox();
		var x = Math.floor(bbox.x + bbox.width/2.0)-15;
		var y = Math.floor(bbox.y + bbox.height/2.0)-30;
		var pin = _this.paper.path("M16,3.5c-4.142,0-7.5,3.358-7.5,7.5c0,4.143,7.5,18.121,7.5,18.121S23.5,15.143,23.5,11C23.5,6.858,20.143,3.5,16,3.5z M16,14.584c-1.979,0-3.584-1.604-3.584-3.584S14.021,7.416,16,7.416S19.584,9.021,19.584,11S17.979,14.584,16,14.584z");
		obj.pin = pin;
		var start = "t"+x+","+(y-15);
		var end = "t"+x+","+(y);
		pin.attr({fill:"#F92672",stroke:"#fff",opacity:0}).animate({opacity:1},1200);
		pin.transform(start);
		pin.toFront();
		var loop = function(){
			var result = pin.transform()== start ? end : start;
			pin.animate({transform:result}, 500, '<>', loop);
		};
		loop();
	};

}(typeof exports === 'undefined' ? this['map'] = {} : exports));
