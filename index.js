/**
 *@Author: 谭生虎
 *@Description: 业余时间没事，想到了阿里好像有个seajs的combo功能 于是自己尝试写下js、css文件的combo   < 类似于阿里或支付宝的combo功能 >
 *@Demo: http://www.xxx.com/libs/jquery.js,libs/common.js,pages/main.js    http://www.xxx.com/libs/jqueryui.css,pages/style.css
 */
const __dirpath = '/Volumes/workroom/wwwroot/';
let http = require('http');
let url = require('url');
let path = require('path');
let fs = require('fs');

let app = http.createServer();
app.listen(8008);

app.on('request', function(request, response) {
    var now = Date.now();
    var _url = url.parse(request.url);
    var params = _url.query || '';
    var urls = _url.pathname.split(',');
    // 异常 格式文件的判断
    var IsJs = urls.every(n => getextname(n) === '.js'),
        IsCss = urls.every(n => getextname(n) === '.css');

    response.setHeader('Content-Type', IsJs ? 'application/javascript' : IsCss ? 'text/css' : 'text/html;charset=utf-8');
    if (IsJs || IsCss) {

        getContents(urls, params).then(function(content) {
            response.setHeader('X-Response-Time', Date.now() - now + 'ms');
            response.end(content);
        }).catch(function(err) {
            response.setHeader('X-Response-Time', Date.now() - now + 'ms');
            response.end(err.toString());
        });
    } else {
        response.setHeader('X-Response-Time', Date.now() - now + 'ms');
        response.end('Get File Is Error!');
    }

});

// 取文件扩展名
function getextname(f) {
    return path.extname(url.parse(f).pathname);
}

// 获取文件内容
function getContents(urls, params) {
    return new Promise((resolve, reject) => {
        var contents = '';
        var len = urls.length;
        var sumlen = 0;
        var options = { contents, sumlen, len, resolve, reject };
        urls.forEach(f => {
            options.fp = __dirpath + f;
            // params.indexOf('sync') == -1 ? _async(options) : _sync(options);
            // 不管是css还是js都需要按顺序同步输出
            _sync(options);
        });
    })

}

// 内容简单处理
function dealContent(type, content) {
    if (type === 'IsJs') {
        content += ';';
    } else {
        content = content.toString().replace(/[\n\t\r]/mg, '');
    }
    return content;
}

// 异步走向 大多情况 css
function _async(args) {
    var { fp, contents, sumlen, len, resolve, reject } = args;
    var type = fp.slice(-3) === '.js' ? 'IsJs' : 'IsCss';
    fs.exists(fp, ext => {
        if (ext) {
            fs.readFile(fp, (err, info) => {
                if (err) { reject('File Read Error!'); }
                // 数据内容处理
                args.contents += dealContent(type, info);
                args.sumlen++;
                if (args.sumlen === len) {
                    resolve(args.contents);
                }
            });
        } else {
            reject('File Is Not Found!');
        }
    });
}

// 同步走向 js 如果有依赖性的如依赖jQuery之类的就要用同步
function _sync(args) {
    var { fp, contents, sumlen, len, resolve, reject } = args;
    var type = fp.slice(-3) === '.js' ? 'IsJs' : 'IsCss';
    if (fs.existsSync(fp)) {
        args.contents += dealContent(type, fs.readFileSync(fp));
        args.sumlen++;
        if (args.sumlen === len) {
            resolve(args.contents);
        }
    } else {
        reject('File Is Not Found!');
    }
}