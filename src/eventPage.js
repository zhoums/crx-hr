// 入口
import config from './config'
import util from './util'
import EventProxy from 'eventproxy'


// var cheerio = require('cheerio')
let codeLoaded = false;
let ep = new EventProxy();
let tabId;
let detailTabId;
let keyword=null;
let keywordIndex=0;
let refleshByPlug=false;

let cj = new EventProxy();
var tabId_51;
var getPageNum;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.greeting == "mission") {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      if(tabId){
        oprationInBack(tabId);
        return;
      }
      if (tabs[0].id >= 0) {
        tabId = tabId||tabs[0].id;
        oprationInBack(tabId);
      }else{
        alert("请在浏览器中打开正确的页面！")
      }
    });
  }
  if (request.greeting == "getDetail"){
    util.sleep(2000)
    chrome.tabs.query({active:true},(tab)=>{
      let paramObj=null;
      for (let i of tab){
        if(i.url.includes("resume/detail?")){
          util.sleep(2000)//等待详情页加载完
          paramObj=util.formatUrlParam(i.url)
          chrome.tabs.sendRequest(i.id,{
            greeting:"resumeDetail",
            resume_id:paramObj.resumeNo
          })
          break;
        }
      }
    })
  }
  if (request.greeting == "sendResume"){
    util.sleep(5000)
    chrome.tabs.query({active:true,currentWindow: true},tab=>{
      console.log(tab,'alsdk')
      // detailTabId=tab[0].id;
      chrome.tabs.remove(tab[0].id)
    })
  }
  if(request.greeting=="triggerFetchResume"){
    if(!refleshByPlug)return;
    console.log('triggerFetchResume')
    //抓取简历
    chrome.tabs.sendRequest(tabId,{
      greeting:'fetchResume',
      index:0
    },function(res){
      setTimeout(()=>{
        if(res.page<=res.totalPage&&res.itemIndex<res.totalItme){
          let itemIndex = res.itemIndex+1
          ep.emit("loopFetchResume",itemIndex)
        }
        console.log(res)
      },5000)
    });
  }
  if (request.greeting == "cj_mission") {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      console.log(tabs)
      if (tabId_51) {
        oprationInBack_cj(tabId_51);
        console.log(tabId_51)
        return;
      }
      if (tabs[0].id >= 0) {
        tabId_51 = tabId_51 || tabs[0].id;
        oprationInBack_cj(tabId_51);
      } else {
        alert("请在浏览器中打开正确的页面！")
      }
    });
  }
  if(request.greeting == "nextPage"){
    sendResponse({farewell:getPageNum})
  }
})

ep.tail("getKeyword", (getKeyword) => {
  keyword=getKeyword;
  ep.emit("oneKeyword",keyword.key[keywordIndex])
})
ep.tail("account", account => {
  // console.log(account)
  if (typeof account == "object") {
    util.getKeyword(ep);
  } else {
    console(account)
  }
})
ep.tail("oneKeyword",oneKeyword => {
  console.log('oneKeyword',oneKeyword,tabId)
  refleshByPlug=true;
  chrome.tabs.sendRequest(tabId,{
    greeting:'oprationInPage',
    keyword:oneKeyword
  },function(res){
    // keywordIndex++;//抓取完一个关健字后翻下一个
    // console.log('keywordIndex',keywordIndex,keyword.key.length)
    // if(keywordIndex<keyword.key.length){
    //   setTimeout(function(){
    //     console.log('oneKeyword again')
    //     ep.emit("oneKeyword",keyword.key[keywordIndex])//更换keyword
    //   },10000)
    // }else{
    //   keywordIndex=0;
    // }
    // alert('llll')
  })
  // util.sleep(4000) //等待页面加载完成

})
ep.tail("resumeDetail",tabid=>{
  chrome.tabs.sendRequest(tabId,{
    greeting:"resumeDetail"
  })
})
ep.tail("loopFetchResume",(itemIndex)=>{
  //抓取简历
  chrome.tabs.sendRequest(tabId,{
    greeting:'fetchResume',
    index:itemIndex
  },function(res){
    setTimeout(()=>{
      console.log(222)
      if(res.page<=res.totalPage&&res.itemIndex<res.totalItme){
        let itemIndex = res.itemIndex+1
        ep.emit("loopFetchResume",itemIndex)
      }else if(res.page<res.totalPage&&res.itemIndex==res.totalItme){
        let page=res.page+1;
        console.log(tabId,"tabId")
        chrome.tabs.sendRequest(tabId,{
          greeting:'resumeTurnpage',
          page
        })
      }
      console.log(res)
    },5000)
  });
})

let oprationInBack=(tabId)=>{
  chrome.tabs.get(tabId,(tab)=>{
    if(tab.url!="https://rd5.zhaopin.com/custom/search/result"){
      setTimeout(function(){
        chrome.tabs.update(tabId, {
          'url': 'https://rd5.zhaopin.com/custom/search/result',
          'selected': true
        })
      },500)
    }
  })
  util.sleep(3000)//如果页面刷新，等待页面加载完成
  util.getAccount(ep);
}
let oprationInBack_cj = (tabId) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url != "https://ehire.51job.com/Candidate/SearchResumeNew.aspx") {
      chrome.tabs.update(tabId, {
        'url': 'https://ehire.51job.com/Candidate/SearchResumeNew.aspx',
        'selected': true
      })
    }
  })
  util.sleep(3000) //如果页面刷新，等待页面加载完成
  util.getResumeInfo(cj);
}
cj.tail("info", info => {
  console.log(info)
  getDarenInfo(info)
})
cj.tail("page", page => {
  console.log(88)
  console.log(page)
  getPageNum=page
})
let getOneResume =(sendinfo)=>{
  // console.log(sendinfo)
    $.ajax({
    url: "http://ha-web.ittun.com/web/spider/backfillData",
    type: 'post',
    data: {
      code:"1",
      data:sendinfo},
    success(response) {
      console.log("response")
    }
  })
}

let getDarenMain = darenId => { //51job
  // console.log("开了");
  var resumeList = [];
  return new Promise((resolve, reject) => {
    try {
      $.ajax({
        url: `https://ehire.51job.com/Candidate/SearchResumeNew.aspx`,
        success(data) {
          var $ = cheerio.load(data);

          var header = "https://ehire.51job.com";
          var len = ($(".Common_list-table table tbody tr").length - 1);
          // var keyList =[]

          $(".Common_list-table table tr").each((item, i) => { //获取简历的链接
            if (item % 2 != 0) {
              var id = $(i).find("td").eq(1).find('a').attr('href');
              var getUrl = header + id;
              resumeList.push(getUrl);
            }
          })
          // resumeList.push("https://ehire.51job.com/Candidate/ResumeView.aspx?hidUserID=468682478&hidEvents=23&pageCode=3&hidKey=45954645acf6b22a28ed3a3dd7da7a23")
          getDarenInfo(resumeList);
          util.sleep(Math.ceil(Math.random() * 2000))
        },
        error(data) {
          // resolve(null)
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
let getDarenInfo = darenId => {
  return new Promise((resolve, reject) => {
    try {
      // console.log(darenId.length); //抓取简历的份数darenId.length
      var personList = {
        resumeItem: {}
      }
      for (var i = 0; i < darenId.length; i++) {
        var resume = {
          res1: {},
          res2: {},
          res3: {},
          res4: {}
        }
        var resume1 = {}
        var resume2 = {}
        var resume3 = {}
        var resume4 = {
          personInfo: {},
          getyearInfo: {},
          jobWantedInfo: {},
          jobExprInfo: {},
          eduExprInfo: {},
          atschoolInfo: {},
          skillInfo: {}
        }
        $.ajax({
          url: darenId[i],
          async: false,
          success(data) {

            var $ = cheerio.load(data);
            var allTab = $("#divResume table").eq(1).html();
            var box1 = $(allTab).find('table.box1');
            var box2 = $(allTab).find('table.box2');
            var box3 = $(allTab).find('table #divInfo');

            // var resume1 ={}
            resume1.img = $(box1).find('td').eq(0).find('img').attr('src')
            resume1.id = $(box1).find('td').eq(0).find('span').text().split(":")[1]
            resume1.workStatus = $(box1).find('td').eq(1).find('table tr').eq(1).find('td').eq(0).contents().filter(function() {
              return this.nodeType == 3
            }).text()
            resume1.phone = $(box1).find('td').eq(1).find('table tr').eq(1).find('td').eq(1).contents().filter(function() {
              return this.nodeType == 3
            }).text().replace(/\ +/g, "").replace(/[\r\n]/g, "")
            resume1.mail = $(box1).find('td').eq(1).find('table tr').eq(1).find('td').eq(2).find('.blue').eq(0).text().replace(/\ +/g, "").replace(/[\r\n]/g, "")
            resume1.sex = $(box1).find('td').eq(1).find('table tr').eq(2).text().split("|")[0].replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume1.age = $(box1).find('td').eq(1).find('table tr').eq(2).text().split("|")[1].replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume1.adress = $(box1).find('td').eq(1).find('table tr').eq(2).text().split("|")[2].replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume1.experience = $(box1).find('td').eq(1).find('table tr').eq(2).text().split("|")[3].replace(/[\r\n]/g, "").replace(/\ +/g, "")
            // console.log(resume1);
            resume.res1 = resume1


            // var resume2 = {};
            resume2.recentWorkTime = $(box2).find('tr td table tr td.tb2').eq(0).find('table tr').eq(0).find('.normal').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume2.recentWorkName = $(box2).find('tr td table tr td.tb2').eq(0).find('table tr').eq(1).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume2.recentWorkCompany = $(box2).find('tr td table tr td.tb2').eq(0).find('table tr').eq(2).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume2.recentWorkIndstry = $(box2).find('tr td table tr td.tb2').eq(0).find('table tr').eq(3).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            // console.log(resume2)
            resume.res2 = resume2


            // var resume3 ={}
            resume3.eduPoss = $(box2).find('tr td table tr td.tb2').eq(1).find('table tr').eq(1).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume3.eduSchool = $(box2).find('tr td table tr td.tb2').eq(1).find('table tr').eq(2).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            resume3.eduBg = $(box2).find('tr td table tr td.tb2').eq(1).find('table tr').eq(3).find('.txt2').text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
            // console.log(resume3)
            resume.res3 = resume3


            // resume4 = {personInfo: {},getyearInfo:{},jobWantedInfo:{},jobExprInfo:{},eduExprInfo:{},atschoolInfo:{},skillInfo:{}}
            var keylist1 = ["QQ号：", "政治面貌：", "身高:", "户口/国籍：", "婚姻状况：", "家庭地址：", "个人主页："]
            var proplist1 = ["QQ", "zzmm", "sg", "hkgj", "hyzk", "jtdz", "grzy"]

            var keylist2 = ["关键字：", "期望薪资：", "地点：", "职能/职位：", "行业：", "到岗时间：", "工作类型：", "自我评价："]
            var proplist2 = ["keyword", "qwxz", "dd", "znzw", "hy", "dgsj", "gzlx", "zwpj"]

            for (var i = 0; i < $(box3).find('table.box').find('.plate1').length; i++) {
              if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "个人信息") {
                // console.log("personInfo")
                for (var j = 0; j < $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.keys').length; j++) {
                  var key = $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.keys').eq(j).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                  keylist1.forEach(function(value, k) {　　
                    if (key == value) {
                      resume4.personInfo[proplist1[k]] = $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.txt2').eq(j).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                      // console.log(resume4.personInfo[proplist1[k]])
                    }
                  })
                }
              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "目前年收入：") {
                // console.log("getyearInfo")
                resume4.getyearInfo["salary"] = $(box3).find('table.box').eq(i).find('.plate1').eq(0).find('.f16').eq(0).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") + $(box3).find('table.box').eq(i).find('.plate1').eq(0).find('.f12').eq(0).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "求职意向") {
                //                     console.log($(box3).find('table.box').eq(i).html())//内容为空，所以打印出来无数据
                for (var j = 0; j < $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.keys').length; j++) {
                  var key = $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.keys').eq(j).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                  keylist2.forEach(function(value, k) {
                    if (key == value) {
                      resume4.jobWantedInfo[proplist2[k]] = $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.txt2').eq(j).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                      // console.log(resume4.jobWantedInfo[proplist2[k]])
                    }
                  })
                }
              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "工作经验") {
                for (var j = 0; j < $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.p15').length; j++) {
                  var p15 = $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.p15').eq(j)

                  var jobDescribe = {}
                  jobDescribe.time = $(p15).find('tr').eq(0).find('.time').eq(0).text()
                  jobDescribe.companyName = $(p15).find('tr').eq(0).find('.bold').eq(0).text() + $(p15).find('tr').eq(0).find('.gray').eq(0).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                  var firmNtype = $(p15).find('tr').eq(1).find('.rtbox').eq(0).text()
                  jobDescribe.companyFirm = firmNtype.split("|")[0] //公司业务

                  jobDescribe.companyType = firmNtype.split("|")[1] //公司类型
                  jobDescribe.department = $(p15).find('tr').eq(2).find('.txt3').eq(0).text()
                  jobDescribe.position = $(p15).find('tr').eq(2).find('.txt3').eq(1).text()
                  jobDescribe.content = $(p15).find('tr').eq(3).find('.txt1').eq(0).text()
                  resume4.jobExprInfo["joblist" + j] = jobDescribe
                }
              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "教育经历") {
                for (var j = 0; j < $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.p15').length; j++) {
                  var p15 = $(box3).find('table.box').eq(i).find('.tba').eq(0).find('.p15').eq(j)

                  var eduDescribe = {}
                  eduDescribe.time = $(p15).find('tr').eq(0).find('.time').eq(0).text()
                  eduDescribe.schoolName = $(p15).find('tr').eq(0).find('.txt3').eq(0).text()
                  eduDescribe.schoolType = $(p15).find('tr').eq(1).find('.tb1').eq(0).text().split("|")[0] //公司业务.contents().filter(function(){return this.nodeType==3})
                  eduDescribe.departments = $(p15).find('tr').eq(1).find('.tb1').eq(0).text().split("|")[1] //所在院系
                  eduDescribe.content = $(p15).find('tr').eq(2).find('.txt1').eq(0).text()
                  resume4.eduExprInfo["edulist" + j] = eduDescribe
                }
              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "在校情况") {
                // console.log($(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tit').length)
                // console.log($(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tit').eq(0).text())
                var zxqk = {
                  xnry: {},
                  zxzw: {}
                }
                if ($(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tit').eq(0).text() == "校内荣誉") {
                  // console.log("xnry存在")
                  for (var x = 0; x < $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tb3').length; x++) {
                    var tb3 = $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tb3').eq(x)
                    var atschoDescribe = {}
                    atschoDescribe.awardsTime = $(tb3).find('tr').eq(0).find('.time').eq(0).text()
                    atschoDescribe.awardsName = $(tb3).find('tr').eq(0).find('.txt3').eq(0).text() + $(tb3).find('tr').eq(0).find('.rtbox').eq(0).find('span').eq(0).text().replace(/[\r\n]/g, "").replace(/\ +/g, "")
                    // resume4.atschoolInfo["edulist"+x]=atschoDescribe
                    zxqk.xnry["xnrylist" + x] = atschoDescribe
                  }

                }
                if (($(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tit').eq(0).text() == "校内职务") || ($(box3).find('table.box').eq(i).find('.tit').eq(1).text() == "校内职务")) {
                  // console.log("xnzw存在")
                  for (var y = 0; y < $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.p15').length; y++) {
                    var p15 = $(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.p15').eq(y)
                    var atschoDescribe2 = {}
                    atschoDescribe2.zxzwTime = $(p15).find('tr').eq(0).find('.time').eq(0).text()
                    atschoDescribe2.zxzwName = $(p15).find('tr').eq(0).find('.txt3').eq(0).text()
                    atschoDescribe2.zxzwDesc = $(p15).find('tr').eq(1).find('.txt1').eq(0).text()
                    zxqk.zxzw["zxzwlist" + y] = atschoDescribe2
                    // resume4.atschoolInfo["edulist"+j]=atschoDescribe
                  }

                }
                // console.log(zxqk)
                resume4.atschoolInfo = zxqk
                // console.log(resume4.atschoolInfo)

              } else if ($(box3).find('table.box').find('.plate1').eq(i).contents().filter(function() {
                  return this.nodeType == 3
                }).text().replace(/[\r\n]/g, "").replace(/\ +/g, "") == "技能特长") {
                // console.log("技能"+$(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.tit').length)
                var num = 0
                var skill = {
                  languge: {},
                  ver: {},
                  peixun: {}
                }
                var trLenght = $(box3).find('table.box').eq(i).find('.tbb').eq(0).children('table').eq(0).children('tbody').eq(0).children('tr')
                // console.log("tr" + trLenght.length)
                if (($(trLenght).eq(num).find('.tit').eq(0).text() == "技能/语言")) {
                  for (var j = 0; j < $(trLenght).eq(num + 1).find('.skco').length; j++) {
                    var skillDescribe = {}
                    skillDescribe.awardsTime = $(trLenght).eq(num + 1).find('.txt3').eq(j).text()
                    skillDescribe.awardsName = $(trLenght).eq(num + 1).find('.skco').eq(j).text()
                    skill.languge["langugelist" + j] = skillDescribe
                  }
                  num += 2
                  // console.log(skill.languge)
                }
                if (($(trLenght).eq(num).find('.tit').eq(0).text() == "证书")) {
                  for (var h = 0; h < $(trLenght).eq(num + 1).find('.txt3').length; h++) {
                    var skillVer = {}
                    skillVer.verTime = $(trLenght).eq(num + 1).find('.time').eq(h).text()
                    skillVer.verName = $(trLenght).eq(num + 1).find('.txt3').eq(h).text()
                    skill.ver["verlist" + h] = skillVer
                  }
                  num += 2


                  // console.log(skill.ver)
                }
                if (($(trLenght).eq(num).find('.tit').eq(0).text() == "培训经历")) {
                  // console.log(num)
                  // console.log($(box3).find('table.box').eq(i).find('.tbb').eq(0).find('.p15').length)
                  for (var f = 0; f < $(trLenght).eq(num + 1).find('.p15').length; f++) {
                    var skillPeixun = {}
                    skillPeixun.peixunTime = $(trLenght).eq(num + 1).find('.p15').eq(f).find('.time').eq(f).text()
                    skillPeixun.peixunName = $(trLenght).eq(num + 1).find('.p15').eq(f).find('.txt3').eq(f).text()

                    for (var k = 0; k < $(trLenght).eq(num + 1).find('.p15').eq(f).find('.tb2').length; k++) {
                      if ($(trLenght).eq(num + 1).find('.p15').eq(f).find('.tb2').eq(k).find('.keys').eq(0) == "培训机构：") {
                        skillPeixun.peixunCompany = $(trLenght).eq(num + 1).find('.tb2').eq(k).find('.txt2').eq(0)
                      }
                      if ($(trLenght).eq(num + 1).find('.p15').eq(f).find('.tb2').eq(k).find('.keys').eq(0) == "培训地点：") {
                        skillPeixun.peixunAdress = $(trLenght).eq(num + 1).find('.tb2').eq(k).find('.txt2').eq(0)
                      }
                    }

                    skillPeixun.peixunDesc = $(trLenght).eq(num + 1).find('.p15').eq(f).find('.txt1').eq(f).text()

                    skill.peixun["peixunlist" + f] = skillPeixun
                  }

                  // console.log(skill.peixun)
                }
                resume4.skillInfo = skill
              } else {}
              resume.res4 = resume4
            }
            getOneResume(JSON.stringify(resume))
          },
          error(data) {
            console.log("bad")
          }
        })
        personList.resumeItem["resumelist" + i] = resume
        // console.log(personList)
        util.sleep(Math.ceil(Math.random() * 2000))
      }
    } catch (err) {
      reject(err)
    }
    // console.log(personList);//一整页数据
  })
}
