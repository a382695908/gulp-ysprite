# gulp-ysprite
gulp插件gulp-ysprite，特点如下：
* 合并样式中的含有slice的背景图片
* 生成sprite文件夹，包含合并后的sprite图片
* 自动更新原CSS文件中的样式
* 适用制作普通PC和H5使用，包含生成二倍图和对应样式

## 安装
```
npm install --save-dev gulp-ysprite
```
## 参数
slice：存放需要合并图片的slice路径

sprite：生成sprite文件的路径

callback(stream)：回调函数，返回stream流

## 使用
```Javascript
var gulp = require('gulp');
var ySprite = require('gulp-ysprite');

gulp.src('style/**/*.css').pipe(ySprite({
    slice: 'test/slice',
    sprite: 'test/sprite',
    callback: function(stream){
        stream.pipe(gulp.dest(dir));
    }
}));
```
## 注意
* 需要合并的图片书写样式背景时必须是background-image的形式

* slice文件夹下可以再建立子文件夹，层级深度无限制，子文件夹内的图片会单独生成一个sprite文件

* 生成的sprite命名规范：slice根目录下的图片命名为index.png，层级深度为1的子文件夹直接按文件夹名字命名，层级大于1的文件夹命名采用“子文件夹1_子文件夹2”的命名方式，比如 slice/test/icons，生成 test_icons.png

* 针对H5有点不一样，需要首先在slice文件夹下建立一个2x文件夹，表示要生成的是二倍图，然后再在2x文件夹下放置图片，也可以放置子文件夹，和上面使用一样，但命名区别是生成的文件会带上@2x的命名规范，例如：slice/2x/test/icons文件夹下的图片会生成 test/icons@2x.png

* 此外，原样式文件中的background-image值会被替换，插件会自动添加计算后的background-position值，如果是2x文件夹下的图片，生成的样式文件中会自动生成background-size覆盖原先的值
