import config from './config'
import util from './util'
import {
  getDateRange,
  generatTk
} from './util'
import {
  app_version,
  app_verSeq,
  allDataPageSize
} from './config'
import {
  versionObj,
  moli_host,
  frontEndHost
} from './checkVersion'
import "babel-polyfill";

let versi = versionObj();

//提前获取config内容
let configRes = null;
let currentTabId;

let allDataPage = 1; //全量获取的页码
let allDataType = 1; //抓取形式 {1-图文；2-短视频；3-直播}
let lastPage = false; //全量获取最后一页
let allDataTotalPage = 1; //全量获取总页数
let agentVersion = navigator.userAgent.toLowerCase().match(/chrome\/[\d.]+/gi).toString().match(/[\d]{1,}/g);
let bigVersion = Number(agentVersion[0]);

let kui = bigVersion >= 72 ? ["blocking", "requestHeaders", "extraHeaders"] : ["blocking", "requestHeaders"];


//set dateRange
let bDay = -1,
  eDay = -1;
const getT = async function() {
  await getDate(30, 1);
  if (bDay > -1 && eDay > -1) return;
  await getDate(30, 2);
  if (bDay > -1 && eDay > -1) return;
  await getDate(31, 2);
  if (bDay > -1 && eDay > -1) return;
}
const getDate = (bd = 30, ed = 1) => {
  let beginDay = getDateRange(bd);
  let endDay = getDateRange(ed);
  $.ajax({
    url: `https://sycm.taobao.com/xsite/daren/single/text/all.json`,
    async: false,
    data: {
      dateRange: `${beginDay}|${endDay}`,
      dateType: 'recent30',
      pageSize: 20,
      page: 1,
      order: 'desc',
      orderBy: 'browsePv',
      parentContentTypeId: '1000',
      contentTypeId: '',
      containH: true,
      keyword: '',
      startDate: '',
      endDate: '',
      indexCode: 'contentRelation,browsePv',
      _: parseInt(Math.random() * 1000000000000000),
      token: '7e967f3e9'
    },
    success(res) {
      if (!res.hasError) {
        bDay = bd;
        eDay = ed;
      }
    }
  })
}
//set dateRange




//设置refer
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if (details.type === 'xmlhttprequest') {
      var exists = false;
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Referer') {
          exists = true;
          details.requestHeaders[i].value = 'https://we.taobao.com/';
          break;
        }
      }

      if (!exists) {
        details.requestHeaders.push({
          name: 'Referer',
          value: 'https://we.taobao.com/'
        });
      }

      return {
        requestHeaders: details.requestHeaders
      };
    }
  }, {
    urls: ['https://*.taobao.com/*']
  },
  kui
);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  //检查版本更新
  if (request.greeting == "checkVersion") {
    versionObj().then((response) => {
      // console.log(response, response.result.verSeq, app_verSeq, response.result.verSeq > app_verSeq)
      //需要更新插件
      if (response.result.verSeq > app_verSeq) {
        chrome.tabs.getSelected(null, function(tab) {
          chrome.tabs.sendRequest(tab.id, {
            greeting: "checkV",
            res: response.result,
          }, function(response) {
            console.log(response);
          });
        });
        response.result.app_verSeq = app_verSeq;
        sendResponse(response.result);
      }
    })
  }


  //爬数开始 3个if
  //提前获取config内容
  if (request.greeting == "triggerConfig") {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tab) {
      // console.log('tab', tab)
      currentTabId = tab[0].id
    });
    console.log("正在获取配置数据，请稍候。。。")
    let config;
    $.ajax({
      url: `${moli_host}/spider/config.wb?${request.head}&version=${app_version}&vs=${app_verSeq}`,
      async: false,
      success: function(data) {
        config = data;
      }
    })
    sendResponse(config);
  }

  //返回已经取得的config结果configRes
  if (request.greeting == "fetchConfig") {
    //向前content返回消息
    sendResponse(configRes);
  }
  if (request.greeting == "spider") {
    //从淘宝获取用户信息判断是否登录
    $.ajax({
      url: 'https://sycm.taobao.com/custom/menu/getPersonalView.json',
      // async: false,
      success: function(res) {
        // let ten = tenMin();
        if (res.code == 0) {
          //向前content返回消息
          request.interFaceList.forEach((item, index) => {
            // console.log(item)
            let argumentList = [];
            let postMoliHeadParam = [];
            //exception begin
            if (!Array.isArray(item.requestArgs)) {
              let param = Object.assign({}, {
                version: app_version,
                msg: 'request.interFaceList item is not a array - > apiUrl: ' + item.apiUrl
              })
              $.ajax({
                url: `${moli_host}/spider/exception.wb`,
                type: 'POST',
                headers: request.head,
                data: param,
                success: function(data) {
                  console.log('has error :  +', item.apiUrl)
                }
              })
            } //exception end
            item.requestArgs.forEach(async function(requestArg, index) {
              let _headObj = Object.assign({}, request.head);
              //get请求
              if (item.apiMethod === "get") {
                //添加分页的参数到接口请求参数中
                if (item.pagerArg) {
                  requestArg.getArgs['pageParamField'] = {}
                  requestArg.getArgs['pageParamField'][item.pagerArg.pageSizeArg] = item.pagerArg.defaultPageSize;
                  requestArg.getArgs['pageParamField'][item.pagerArg.pageArg] = 1;
                  requestArg.getArgs['pageParamField']['totalField'] = item.pagerArg.totalField;
                  requestArg.getArgs['pageParamField']['pageArg'] = item.pagerArg.pageArg;
                }
                argumentList.push(requestArg.getArgs);
                //backArgs:
                if (Array.isArray(requestArg.backArgs)) {
                  requestArg.backArgs.forEach((backArg, ind) => {
                    _headObj[backArg] = requestArg['getArgs'][backArg];
                  })
                } else {
                  //exception begin
                  //exception end
                }
              } else { //post请求
                //添加分页的参数到接口请求参数中
                if (item.pagerArg) {
                  requestArg.postArgs['pageParamField'] = {}
                  requestArg.postArgs['pageParamField'][item.pagerArg.pageSizeArg] = item.pagerArg.defaultPageSize;
                  requestArg.postArgs['pageParamField'][item.pagerArg.pageArg] = 1;
                  requestArg.postArgs['pageParamField']['totalField'] = item.pagerArg.totalField;
                  requestArg.postArgs['pageParamField']['pageArg'] = item.pagerArg.pageArg;
                }
                argumentList.push(requestArg.postArgs);
                if (Array.isArray(requestArg.backArgs)) {
                  requestArg.backArgs.forEach((backArg, ind) => {
                    _headObj[backArg] = requestArg['postArgs'][backArg];
                  })
                } else {
                  //exception begin
                  //exception end
                }
              }
              if (item.contentType) {
                _headObj["Content-Type"] = item.contentType;
              }
              //head参数在这里设置
              postMoliHeadParam.push(_headObj);
            })
            argumentList.forEach((argument, index) => {
              //暂时默认爬数据都是GET，（此处也不应有post?）
              var search = "?";
              let pageObj = null;
              for (var key in argument) {
                if (key == "pageParamField") {
                  pageObj = Object.assign({}, argument[key]);
                } else {
                  if (search === "?") {
                    if (key !== 'syncTime') {
                      search += key + "=" + argument[key];
                    }
                  } else {
                    if (key !== 'syncTime') {
                      search += "&" + key + "=" + argument[key];
                    }
                  }
                }
              }

              //爬数
              let ajaxFn = async function(page = 1, isCallBack = false) {
                let time = parseInt(Math.random() * (config.max_interval - config.min_interval) + config.min_interval, 10);
                // util.sleep(time);

                if (pageObj) {
                  if (page > 1) {
                    pageObj[pageObj.pageArg] = page
                  }
                  // if (item.apiUrl.includes('single/detail/result.json'))
                  //   console.log('000000', pageObj)
                  Object.keys(pageObj).forEach((item, id) => {
                    if (item !== "totalField" && item !== "pageArg") {
                      //防止前面一个参数也没有
                      if (search === "?") {
                        search += item + "=" + pageObj[item];
                      } else {
                        let jsonList = {};
                        let str = search.slice(search.indexOf("?") + 1);
                        let strs = str.split("&")
                        for (let item of strs) {
                          jsonList[item.split("=")[0]] = item.split("=")[1];
                        }
                        jsonList[item] = pageObj[item]

                        let tempArr = [];
                        for (let i in jsonList) {
                          let key = encodeURIComponent(i);
                          let value = encodeURIComponent(jsonList[i]);
                          tempArr.push(key + '=' + value);
                        }
                        search = "?" + tempArr.join('&');
                      }
                    }
                  })
                }

                util.sleep(time);
                $.ajax({
                  url: item.apiUrl + search,
                  type: item.apiMethod || 'GET',
                  // async: false,
                  success: function(data) {
                    var success_flag = item.succFlag.split(":")
                    //保存出错信息
                    if (data[success_flag[0]] == undefined) {
                      let param = Object.assign({}, {
                        version: app_version,
                        msg: 'setPlugCookie.js->data[success_flag[0]](line:225)->data:' + JSON.stringify(data) + "   ->success_flag:" + success_flag + "  ->apiUrl:" + item.apiUrl
                      })
                      $.ajax({
                        url: `${moli_host}/spider/exception.wb`,
                        type: 'POST',
                        headers: request.head,
                        data: param,
                        success: function(data) {
                          console.log('has error :  +', item.apiUrl)
                        }
                      })
                    } else if (data[success_flag[0]].toString() == $.trim(success_flag[1])) {
                      // if (true) { //测试
                      var param = {};
                      //解析出每一个要传递到后台的参数
                      $.each(item.fields, function(_index, field) {
                        if (field.dataRoot) {
                          let level = field.dataRoot.split(".");
                          let _feild = field.fields.split("|");
                          // let _paramLevel = "";
                          let _paramObj = null;
                          //对象
                          if (field.dataType === "entity") {
                            for (let len = 0; len < level.length; len++) {

                              _paramObj = _paramObj ? _paramObj[level[len]] : data[level[len]];
                              // _paramLevel+=`[level[${len}]]`;
                            }
                            // console.log('_paramLevel',_paramLevel,data)
                            $.each(_feild, function(_id, _it) {
                              let _param = _it.split(":");
                              // let s=eval(`data${_paramLevel}`)
                              let s = _paramObj
                              param[_param[1]] = s[_param[0]]
                            })
                          } else if (field.dataType === "list") { //数组
                            param[field['backArg']] = new Array();
                            // let _paramLevel = "";
                            let _paramObj = null;

                            for (let len = 0; len < level.length; len++) {
                              _paramObj = _paramObj ? _paramObj[level[len]] : data[level[len]];
                              // _paramLevel+=`[level[${len}]]`;
                            }
                            // let finalData = eval(`data${_paramLevel}`);
                            let finalData = _paramObj;


                            if (finalData && finalData.length > 0) {
                              finalData.forEach((item, index) => {
                                let objItem = {}
                                $.each(_feild, function(_id, _it) {
                                  var _param = _it.split(":");
                                  objItem[_param[1]] = item['' + _param[0]]; //字段名有中文
                                })
                                param[field['backArg']].push(objItem);
                              })
                            }
                          } else {
                            param[field['dataField']] = data[field['dataField']]
                          }
                        } else {
                          param[field['dataField']] = data[field['dataField']]
                        }
                      })

                      //触发回填数据
                      let _par = param
                      if (postMoliHeadParam[index]['Content-Type']) {
                        _par = JSON.stringify(_par)
                      }
                      if (Object.keys(_par).length) {
                        // util.sleep(parseInt(Math.random() * (2500 - 100) + 120, 10);)
                        $.ajax({
                          // url: request.url,
                          url: item.serviceUrl,
                          type: 'POST',
                          async: true,
                          tiem: 2300,
                          headers: postMoliHeadParam[index],
                          data: _par,
                          success: function(res) {
                            // console.log(res);
                          }
                        })
                      }

                      if (pageObj) {
                        let paramArr = pageObj.totalField.split('.');
                        let _paramObj = null;
                        for (let i = 0; i < paramArr.length; i++) {
                          _paramObj = _paramObj ? _paramObj[paramArr[i]] : data[paramArr[i]];
                        }
                        let totalItem = _paramObj;
                        let totalPage = parseInt((parseInt(totalItem) + parseInt(pageObj.pageSize) - 1) / parseInt(pageObj.pageSize));
                        if (!isCallBack) {
                          for (let t = 2; t <= totalPage; t++) {
                            ajaxFn(t, true)
                          }
                        }
                      }
                    }
                  }
                })
              }
              ajaxFn();
              //爬数结束
            })
          })
        } else {
          //没有登录数据参谋  currentTabId
          chrome.tabs.sendRequest(currentTabId, {
            greeting: "alarmToLoginSycm",
          }, function(response) {
            console.log(response);
          });
        }
      }
    })

  }
  if (request.greeting == 'allData') {
    //从淘宝获取用户信息判断是否登录
    $.ajax({
      url: 'https://sycm.taobao.com/custom/menu/getPersonalView.json',
      // async: false,
      success: async function(res) {
        // let ten = tenMin();
        if (bDay < 0 || eDay < 0) {
          await getT();
        }
        console.log('bday', bDay, eDay)
        if (res.code == 0) {
          let beginDate = getDateRange(bDay);
          let endDate = getDateRange(eDay);
          let _tk = generatTk(13);
          let token = request.tk;
          chrome.tabs.query({
            active: true,
            currentWindow: true
          }, function(tab) {
            // console.log('tab', tab)
            let tabId = currentTabId || tab[0].id;
            if (currentTabId) {
              tabId = currentTabId;
            } else {
              currentTabId = tab[0].id
            }
            allData_text(currentTabId, token, beginDate, endDate, allDataPageSize, allDataPage);
          })
        } else {
          //spider已经做了提示，这里什么都不用做
        }
      },
    })

  }
  //爬数结束

});



let allData_text = function(currentTabId, token, beginDate, endDate, allDataPageSize, page) {
  let list_url, detail_url;
  if (allDataType == 1) {
    list_url = `https://sycm.taobao.com/xsite/daren/single/text/all.json?dateRange=${beginDate}%7C${endDate}&dateType=recent30&pageSize=${allDataPageSize}&page=${page}&order=desc&orderBy=browsePv&keyword=&startDate=&endDate=&parentContentTypeId=1000&contentTypeId=&indexCode=&_=${generatTk(13)}&token=0c88cf3f1`;
  } else if (allDataType == 2) {
    list_url = `https://sycm.taobao.com/xsite/daren/single/video/all.json?dateRange=${beginDate}%7C${endDate}&dateType=recent30&pageSize=${allDataPageSize}&page=${page}&order=desc&orderBy=playActualMbrCnt&keyword=&startDate=&endDate=&contentTypeId=2000&indexCode=&_=${generatTk(13)}&token=6aab76e51`;
  } else if (allDataType == 3) {
    list_url = `https://sycm.taobao.com/xsite/daren/single/live/all.json?dateRange=${beginDate}%7C${endDate}&dateType=recent30&pageSize=${allDataPageSize}&page=${page}&order=desc&orderBy=watchPv&keyword=&startDate=&endDate=&contentTypeId=3000&indexCode=&_=1563178657482&token=6aab76e51`;
  }
  $.ajax({
    url: list_url,
    //contentRelation%2CbrowsePv%2CbrowseUv%2CsnsCnt%2CcontentGuideShopPv%2CcontentGuideShopUv
    async: false,
    success: function(data) {
      if (data.hasError === false) {
        allDataTotalPage = Math.ceil(data.content.data.recordCount / allDataPageSize);
        if (page <= allDataTotalPage) {
          let len = data.content.data.data.length;
          console.log(',,,,', data.content.data.data)
          data.content.data.data.forEach((item, ind) => {
            let _tit = "",
              contentId = item.contentId || '';
            let _publishTime = item.publishTime || '',
              _publisherId = item.publisherId || '',
              _publisherName = item.publisherName || '';
            if (item.title) {
              _tit = item.title;
            }
            $.ajax({
              url: `https://sycm.taobao.com/xsite/daren/single/detail/result.json?dateType=range&dateRange=${beginDate}%7C${endDate}&indexCode=&contentId=${contentId}&_=${generatTk(13)}&token=0c88cf3f1`,
              async: false,
              success: function(data) {
                let param = {
                  "contentTitle": "",
                  "contentUrl": "",
                  "browsePv": [],
                  "browseUv": "",
                  "snsCnt": "",
                  "mbrUv": "",
                  "contentGuideShopPv": "",
                  "contentGuideShopUv": "",
                  "contentGuideCartByr": "",
                  "contentGuideCltByrCnt": "",
                  "contentGuidePayOrdByr": "",
                  "contentGuidePayOrdCnt": "",
                  "contentGuideCartQty": "",
                  "contentGuidePayOrdAmt": "",

                  "contentGuideCltCnt": "",
                  "favorCnt": "",
                  "favorMbrCnt": "",
                  "shareTimes": "",
                  "shareMbrCnt": "",
                  "flwMbrAddCnt": "",
                  "cancelFlwMbrCnt": "",
                  "cmtCnt": "",
                  "mbrCnt": "",

                  "watchPv": "",
                  "watchTimeAvg": "",
                  "playCnt": "",
                  "playActualMbrCnt": "",
                  "playTimeAvg": "",
                  "statDate": "",

                  "publishTime": "",
                  "publisherId": "",
                  "publisherName": "",

                  "type": ""

                };
                for (let paramItem in param) {
                  if (paramItem == 'contentTitle') {
                    param[paramItem] = _tit
                  } else if (paramItem == 'contentUrl') {
                    param[paramItem] = `https://sycm.taobao.com/xsite/daren/contentanalysis/we/content_detail?contentId=${contentId}&contentRelation=O&dateRange=${beginDate}%7C${endDate}&dateType=range&spm=a211nc.11571543.0.0.5e91410cJH1HD1`
                  } else if (paramItem == 'publishTime') {
                    param[paramItem] = _publishTime;
                  } else if (paramItem == 'publisherId') {
                    param[paramItem] = _publisherId;
                  } else if (paramItem == 'publisherName') {
                    param[paramItem] = _publisherName;
                  } else if (paramItem == "type") {
                    param[paramItem] = allDataType;
                  } else {
                    param[paramItem] = data.content.data[paramItem]
                  }
                }


                $.ajax({
                  url: `${moli_host}/tb/daren/content/syncContentFullDetail.wb`,
                  async: false,
                  type: 'post',
                  headers: {
                    "tk": token,
                    "contentId": contentId,
                    "Content-Type": "application/json"
                  },
                  data: JSON.stringify(param),
                  success: function(data) {
                    // console.log(data)
                    // config = data;
                  },
                  complete: function() {
                    //非最后一面最后一条数据时，触发翻页事件=====
                    if (page < allDataTotalPage && ind == len - 1) {
                      allDataPage++;
                      // allData_text(token,beginDate,endDate,allDataPageSize,page);
                      chrome.tabs.sendRequest(currentTabId, {
                        greeting: "allDataTurnPage",
                      })
                    }
                    if (page == allDataTotalPage && ind == len - 1) {
                      setTimeout(function() {
                        allDataPage = 1; //全量获取的页码
                        lastPage = false; //全量获取最后一页
                        allDataTotalPage = 1;
                        if (allDataType == 1) {
                          allDataType = 2;
                          allData_text(currentTabId, token, beginDate, endDate, allDataPageSize, allDataPage);
                        } else if (allDataType == 2) {
                          allDataType = 3;
                          allData_text(currentTabId, token, beginDate, endDate, allDataPageSize, allDataPage);
                        } else {
                          allDataType = 1
                        }
                      }, 3 * 60 * 1000)

                    }
                  }
                })
              }
            })
          })
          // allDataPage++;
        }

      }

    }
  })
}