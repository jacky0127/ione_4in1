
'use strict';
var fs = require('fs');
var path = require('path');
var os = require('os');
var app = require('electron').app;
var cp = require('child_process');
var packageJson = require('../../package.json');
exports.BuiltType = packageJson.BuiltType || 0;
exports.isTestMode = exports.BuiltType === 0;
exports.winSettings = packageJson.window || void 0;
exports.keyBoardSettings = packageJson.keyboard || void 0;
exports.isWindows = (process.platform === 'win32');
exports.isMac = (process.platform === 'darwin');
exports.isLinux = (process.platform === 'linux');
exports.osReleaseVer = getWindowsReleaseVer();
exports.isLessThenWin81 = (exports.isWindows && compareVersion(exports.osReleaseVer, '6.3.9600'));
exports.runningInstanceHandle = getRunningInstanceHandle();
//exports.appRoot = getAppRoot(); 
var APPDATADir = process.env.APPDATA;
if (exports.isMac) 
    APPDATADir = os.homedir;

if(exports.isMac)
    exports.appRoot = APPDATADir+`/${packageJson.project.projectname}`
else 
    exports.appRoot = APPDATADir+`\\${packageJson.project.projectname}`

if(exports.isMac)
    exports.appDBRoot = APPDATADir+`/${packageJson.project.projectname}/data/`
else 
    exports.appDBRoot = APPDATADir+`\\${packageJson.project.projectname}\\data\\`

exports.version = "1.0.0.0";
exports.appHome = path.join(exports.appRoot,'');
exports.appLog = path.join(exports.appHome, 'logs');

exports.appData = path.join(exports.appHome, 'data');
// exports.appData1 = path.join(exports.appHome, 'data\\HeadShot');
if(exports.isMac)
    exports.appData1 = path.join(exports.appHome, 'data/HeadShot');
else 
    exports.appData1 = path.join(exports.appHome, 'data\\HeadShot');    

if (!fs.existsSync(exports.appRoot)) {
    fs.mkdirSync(exports.appRoot);
}
if (!fs.existsSync(exports.appLog)) {
    fs.mkdirSync(exports.appLog);
}

if (!fs.existsSync(exports.appData)) 
{
    fs.mkdirSync(exports.appData);
    fs.mkdirSync(exports.appData1);
}

exports.arch = getArch();

Date.prototype.format = function(format)
{
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(),    //day
        "h+" : this.getHours(),   //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3),  //quarter
        "S" : this.getMilliseconds() //millisecond
    }
    if(/(y+)/.test(format)) 
        format = format.replace(RegExp.$1,(this.getFullYear()+"").substr(4- RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(format))
            format = format.replace(RegExp.$1,RegExp.$1.length == 1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
    return format;
};


Date.prototype.add = function(milliseconds){
    var m = this.getTime() + milliseconds;
    return new Date(m);
};
Date.prototype.addSeconds = function(second){ 
    return this.add(second * 1000);
};
Date.prototype.addMinutes = function(minute){ 
    return this.addSeconds(minute*60);
};
Date.prototype.addHours = function(hour){ 
    return this.addMinutes(60*hour);
};

Date.prototype.addDays = function(day){
    return this.addHours(day * 24);
};

Date.isLeepYear = function(year){
    return (year % 4 == 0 && year % 100 != 0)
};

Date.daysInMonth = function(year,month){
    if(month == 2){
        if(year % 4 == 0 && year % 100 != 0)
            return 29;
        else
            return 28;
    }
    else if((month <= 7 && month % 2 == 1) || (month > 7 && month % 2 == 0))
        return 31;
    else
        return 30;
};

Date.prototype.addMonth = function(){
    var m = this.getMonth();
    if(m == 11)return new Date(this.getFullYear() + 1,1,this.getDate(),this.getHours(),this.getMinutes(),this.getSeconds());
    
    var daysInNextMonth = Date.daysInMonth(this.getFullYear(),this.getMonth() + 1);
    var day = this.getDate();
    if(day > daysInNextMonth){
        day = daysInNextMonth;
    }
    return new Date(this.getFullYear(),this.getMonth() + 1,day,this.getHours(),this.getMinutes(),this.getSeconds());    
};

Date.prototype.subMonth = function(){
    var m = this.getMonth();
    if(m == 0)return new Date(this.getFullYear() -1,12,this.getDate(),this.getHours(),this.getMinutes(),this.getSeconds());
    var day = this.getDate();
    var daysInPreviousMonth = Date.daysInMonth(this.getFullYear(),this.getMonth());
    if(day > daysInPreviousMonth){
        day = daysInPreviousMonth;
    }
    return new Date(this.getFullYear(),this.getMonth() - 1,day,this.getHours(),this.getMinutes(),this.getSeconds());
};

Date.prototype.addMonths = function(addMonth){
    var result = false;
    if(addMonth > 0){
        while(addMonth > 0){
            result = this.addMonth();
            addMonth -- ;
        }
    }else if(addMonth < 0){
        while(addMonth < 0){
            result = this.subMonth();
            addMonth ++ ;
        }
    }else{
        result = this;
    }
    return result;
};

Date.prototype.addYears = function(year){
    return new Date(this.getFullYear() + year,this.getMonth(),this.getDate(),this.getHours(),this.getMinutes(),this.getSeconds());
};  


String.prototype.isPadAs = function(str)
{
    var re = new RegExp(str, 'g');
    return (this.replace(re, '').replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '') == '');
};

function padLeft(str,lenght)
{ 
    if(str.length >= lenght) 
       return str; 
    else 
      return padLeft(" " +str,lenght);   
} 

function padRight(str,lenght){
    if(str.length >= lenght)
        return str;
    else
        return padRight(str+" ",lenght);
}

var LEVEL = {  ERROR: "ERROR",  WARN: "WARN",  INFO: "INFO",  DEBUG:"DEBUG" };

exports.level = LEVEL;

function logToFile(ClassName,functionName,info) 
{
    try
    {
        //if(exports.isTestMode)
        //{   
                // if(level != LEVEL.DEBUG)
                // {
                //     var msg = new Date().format('yyyy-MM-dd hh:mm:ss.S');
                //     msg = `${msg}    ${padRight(ClassName,20)}   ${padRight(functionName,30)}   ${info}`;
                //     var CurrentDate = new Date().format('yyyyMMdd');        
                //     var LogFilePath = path.join(exports.appHome, 'logs');      
                //     if(!fs.existsSync(LogFilePath)){  fs.mkdirSync(LogFilePath);   }
                //     LogFilePath = path.join(LogFilePath, CurrentDate + '.log');
                //     fs.appendFileSync(LogFilePath, msg +"\r\n");
                // }
        //}else
        {
                var msg = new Date().format('yyyy-MM-dd hh:mm:ss.S');
                if(typeof info == 'object')
                    info = JSON.stringify(info)
                msg = `${msg}    ${padRight(ClassName,20)}   ${padRight(functionName,30)}   ${info}`;
                var CurrentDate = new Date().format('yyyyMMdd');        
                var LogFilePath = path.join(exports.appHome, 'logs');      
                if(!fs.existsSync(LogFilePath)){ fs.mkdirSync(LogFilePath); }
                LogFilePath = path.join(LogFilePath, CurrentDate + '.log');
                fs.appendFileSync(LogFilePath, msg +"\r\n");
        }
        console.log(ClassName,functionName,info)

    }catch(ex){
        console.error(ex);
    }
}

exports.log = logToFile; 

 
function walkLog(dir)
 {
        var results = [];
        var list = fs.readdirSync(dir)
        list.forEach(function(file) 
        {
            var file1 = dir + '/' + file
            var stat = fs.statSync(file1)
            if (stat && stat.isDirectory()) results = results.concat(walkLog(file1))
            else {
                  if(path.extname(file) =='.log')   results.push(file)
            }
        })
        return results
}

function deleteLogs(){  
        logToFile('env','logToFile','Clear Logs .')  ;
        var date = new Date(); date.setDate(date.getDate() -7);
        var tmp = date.format('yyyyMMdd');
        walkLog(path.join(exports.appHome, 'logs')).forEach(function(item){
                let aFile = item.substr(0,item.length-4);
                if(aFile<tmp){
                    fs.unlinkSync(path.join(exports.appHome, 'logs','/')+item);
                }
        })
}


logToFile('env','logToFile', `AppVersion:${exports.version},${os.type()},${os.arch()},${process.platform},${exports.osReleaseVer},BuiltType:${exports.BuiltType}`);
deleteLogs();

function getArch(){
    if (exports.isWindows){
        return os.arch();
    }
    return process.platform;
}
function getAppRoot() {
    return path.resolve(path.join(__dirname, '..', '..'));
}
function getRunningInstanceHandle() {
//    var handleName  = app.getName();
     var handleName  = `${packageJson.project.projectname}`;
    // Windows: use named pipe
    if (process.platform === 'win32') {
        return '\\\\.\\pipe\\' + handleName + '-sock';
    }
    // Mac/Unix: use socket file
    return path.join(os.tmpdir(), handleName + '.sock');
}

function privateGetPlatformIdentifier() {
    if (process.platform === 'linux') {
        return "linux-" + process.arch;
    }
    return process.platform;
}
exports.getPlatformIdentifier = privateGetPlatformIdentifier;

function privateDeleteLogFile()
{
    try
    {   
        var files = [] ; var CurrentDate = new Date().format('yyyyMMdd');
        var LogFilePath = path.join(exports.appHome, 'logs');  
        if(fs.existsSync(LogFilePath)) 
        {
                files = fs.readdirSync(LogFilePath);
                for (var file of files)
                {
                    var curPath = path.join(LogFilePath, file);
                    var f = file.split(".");
                    if (f[0]!=CurrentDate){   fs.unlinkSync(curPath); } 
                }             
        }
    }
    catch(e){     }
    
}

exports.DeleteLogFile = privateDeleteLogFile ;



//????????????????????????
function privateGetNumberHiLo(num){
    if(num>=0x10000)
        num = num % 0x10000;
    var hex=Number(num).toString(16);
    hex = "0000".slice(0, 4 - hex.length) + hex;
    var ret={};
    ret.Hi=parseInt(hex.slice(0,2),16);
    ret.Lo=parseInt(hex.slice(2,4),16);
    return ret;
}
exports.GetNumberHiLo = privateGetNumberHiLo;

//????????????????????????
function privateMergeHiLoToNumber(hi,lo){
    var hex=Number(hi).toString(16);
    hex = "00".slice(0, 2 - hex.length) + hex;
    var hexLow=Number(lo).toString(16);
    hexLow = "00".slice(0, 2 - hexLow.length) + hexLow;
    hex = hex + hexLow;
    return parseInt(hex,16)
}
exports.MergeHiLoToNumber = privateMergeHiLoToNumber;

function IsNum(s)
{
    if (s != null && s != ""){
        return !isNaN(s);
    }
    return false;
}

function compareVersion(oldVer, newVer){
    if (IsNum(oldVer) && IsNum(newVer)){
        return Number(oldVer) < Number(newVer);
    }
    var oldArr = oldVer.split('.');
    var newArr = newVer.split('.');
    var len = oldArr.length < newArr.length ? oldArr.length : newArr.length;
    var bResult = false;
    for (var i = 0; i < len; i++) {
        if (Number(oldArr[i]) !== Number(newArr[i])){
            bResult = (Number(oldArr[i]) < Number(newArr[i]));
            break;
        }     
    }
    return bResult;
}
exports.CompareVersion = compareVersion;

function getWindowsReleaseVer(){
    var strVer = os.release();
    if (exports.isWindows && strVer == '6.2.9200'){
        var getVer = cp.execSync('ver.exe').toString('ascii').replace(/\0/g, '');
        var re = /\s[\d\.]+/i;
        if (re.test(getVer))
            strVer = re.exec(getVer)[0].replace(/(^\s*)|(\s*$)/g, '');
    }
    return strVer;
}

function deleteFolderRecursive (aPath, isDelRoot) {
    var files = [];
    if(fs.existsSync(aPath)) {
        files = fs.readdirSync(aPath);
        for (var file of files){
            var curPath = path.join(aPath, file);
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath, true);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        }
        if (isDelRoot)
            fs.rmdirSync(aPath);
    }
}
exports.DeleteFolderRecursive = deleteFolderRecursive;



