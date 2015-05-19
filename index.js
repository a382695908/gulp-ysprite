// PLUGIN_NAME: gulp-ysprite
// Vision: 1.0.0
// author: yumy
// date: 2015-04-27
var through = require('through-gulp');
var spritesmith = require('spritesmith');
var fs = require('fs');
var _path = require('path');

function ySprite(option) {
  var slicePath = option.slice;
  var spritePath = option.sprite;
  var padding = option.padding || 2;
  var sliceFolder = _path.basename(slicePath);
  var ySpriteCallBack = option.callback && typeof option.callback == 'function' ? option.callback : (function(){});
  var reg = new RegExp('background-image:[\\s]*url\\(["\']?(?!http[s]?|/)[^;]*?(' + sliceFolder + '/[\\w\\d\\s!./\\-\\_@]*\\.[\\w?#]+)["\']?\\)[^;}]*;?', 'ig');
  //var reg = new RegExp('\\bbackground-image:.+(\\b' + sliceFolder + '.+?)\\s*?\\)\\s*?;?','g');
  var reg2 = /\bbackground-size:[^;\n\t\)]+\b\s*?;?/g;
  var reg3 = /(\bbackground-size:.+?)!important;/g;
  var reg4 = /\{[^\{]*(?=background-size)[^\{]+(?=background-size)[^\{]+?\}/g;
  var cssFiles = [];

  //广度文件夹遍历
  function walk(path, callback){
    var dirList = fs.readdirSync(walkPath);
    var fileList = [];
   
    dirList.forEach(function(item){
      if(fs.statSync(walkPath + '/' + item).isFile()){
        if(_path.extname(item) == '.png' || _path.extname(item) == '.jpg' || _path.extname(item) == '.gif'){
          fileList.push(walkPath + '/' + item);
        }else {
          //console.log(item + '文件不是png,jpg,gif中的一种，已被过滤...');
        }
      }
    });
   
    callback(fileList, walkPath);

    dirList.forEach(function(item){
      if(fs.statSync(walkPath + '/' + item).isDirectory()){
        walk(walkPath + '/' + item, callback);
      }
    });
  }

  var stream = through(function(file, encoding, callback) {
      if (file.isNull()) {

      }
      if (file.isBuffer()) {
        cssFiles.push(file);
      }
      if (file.isStream()) {

      }
      callback();
    }, function(callback){
      var that = this;
      //如果没有slice文件夹
      if(!fs.existsSync(slicePath)){
        //console.log('本次任务没有slice文件夹...');
        for(var index = 0, len = cssFiles.length; index < len; index++){
          that.push(cssFiles[index]);
        }
        callback();
        ySpriteCallBack(stream);
        return;
      }

      //以下是有slice文件夹的情况
      var imgDirArr = [];
      var imgPathArr = [];
      var resultArr = [];
      var spritePreReg = new RegExp('^sprite_' + sliceFolder + '_?', '');
      var sprite2xReg = /^2x_?/;

      //广度搜索slice文件夹
      walk(slicePath, function(arr, path){
          if(!arr.length) return;
          imgDirArr.push(arr);
          imgPathArr.push(path);
      });

      //如果slice文件夹为空
      if(!imgDirArr.length){
        for(var index = 0, len = cssFiles.length; index < len; index++){
          that.push(cssFiles[index]);
        }
        callback();
        ySpriteCallBack(stream);
        return;
      }

      //合并图片
      for(var key = 0;key <imgDirArr.length;key++){
        (function(key){
          spritesmith({
              src: imgDirArr[key], 
              padding: padding,
              algorithm: 'binary-tree'
            }, function handleResult (err, result) {
            //result.image; // Binary string representation of image
            //result.coordinates; // Object mapping filename to {x, y, width, height} of image
            //result.properties; // Object with metadata about spritesheet {width, height}
            if (err) {
              throw err;
            }
             if (!fs.existsSync(spritePath)) {
              fs.mkdirSync(spritePath);
             }
            var name = ('sprite_' + sliceFolder + imgPathArr[key].split('/').join('_').split(sliceFolder)[1]).replace(spritePreReg, '') || 'index';
            //如果是h5页面的二倍图icon合并，命名为sprite_XXX@2x
            if(sprite2xReg.test(name)){
              name = (name.replace(sprite2xReg, '') || 'index') + '@2x';
            }
            console.log('sprite-name---->' + name);
            fs.writeFileSync(_path.join(spritePath, name) + '.png', result.image, 'binary');
            resultArr.push(result);
            if(key == imgDirArr.length -1){
              cssFileReplace(resultArr);
            }
          });
        })(key);
      }

      //替换样式slice部分
      function cssFileReplace(resultArr){   
        for(var index = 0, len = cssFiles.length; index < len; index++){
          var file = cssFiles[index];
          var content = file.contents.toString();
          if(reg.test(content)){
            content = content.replace(reg, function($0, $1){
              console.log('$1--->'+$1);
              var sliceArr = $1.split('/');
              sliceArr.splice(-1, 1);
              var name = ('sprite_' + sliceArr.join('_')).replace(spritePreReg, '') || 'index';
              //匹配图片和替换样式中的路径
              for(var i=0;i<resultArr.length;i++){
                var result = resultArr[i];
                for(var key in result.coordinates){
                  if(key.match($1)){
                    var x = result.coordinates[key].x;
                    var y = result.coordinates[key].y;
                    //如果是h5页面的二倍图icon合并，设置background-size
                    if(sprite2xReg.test(name)){
                      var replaceStyle = 'background-image:url(sprite/' + (name.replace(sprite2xReg, '') || 'index') + '@2x.png);background-position:' + Math.ceil(-0.5 * x) + 'px ' + Math.ceil(-0.5 * y) + 'px;background-size:' + Math.floor(result.properties.width / 2) + 'px!important;';
                    }
                    //普通PC图片合并
                    else {
                      var replaceStyle = 'background-image:url(sprite/' + name + '.png);background-position:' + (-1 * x) + 'px ' + (-1 * y) + 'px;';
                    }
                    return replaceStyle;
                  }
                }
              }
              return $0;
            });
            //如果是h5页面,要去除多余的background-size和!important;
            content = content.replace(reg4, function($0){
              //console.log('$0--->'+$0);
              $0 = $0.replace(reg2, function($1){
                if(!reg3.test($1)){
                  return '';
                }
                return $1.replace(reg3, function($2, $3){
                  console.log('$3---->'+$3);
                  return $3 + ';';  //!important截断处缺少;号
                })
              });
              return $0;
            });
            file.contents = new Buffer(content);
          }
          that.push(file);
        }
        callback();
        ySpriteCallBack(stream);
      }      
      
    });

  return stream;
};

module.exports = ySprite;