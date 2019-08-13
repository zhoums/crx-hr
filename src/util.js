import config from './config'
export default {
  $http: function(method, uri) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open(method, uri, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          // JSON解析器不会执行攻击者设计的脚本.
          var resp = JSON.parse(xhr.responseText);
          resolve(resp);
        }
      }
      xhr.send();
    })

  },
  sleep: function(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
      now = new Date();
      if (now.getTime() > exitTime)
        return;
    }
  },
  getDateRange : (days = 0) => {
    let now = new Date().getTime();
    let target = new Date(now - days * 24 * 60 * 60 * 1000);
    let month = target.getMonth() + 1;
    month = month > 9 ? month : "0" + month;
    let format = target.getFullYear() + '-' + month + "-" + target.getDate();
    return format;

  },
  getAccount:(eventproxy)=>{
    $.ajax({
      url:'https://rd5.zhaopin.com/api/rd/user/bind/list',
      success(res){
        console.log('getAccount',res)
        if(res.code===0){
          console.log(9990)
          eventproxy.emit('account',res.data[0])
        }else{
          eventproxy.emit('account',res.message)
        }
      }
    })
  },
  getKeyword:(eventproxy)=>{
    console.log('util.getKeyword')
    let resKeyword = {
      key:["ue","html5","javascript"],
      time:5000
    }
    if(resKeyword){
      eventproxy.emit('getKeyword',resKeyword)
    }else{// error in getKeyword
      eventproxy.emit('getKeyword',null)
    }
  }
}
