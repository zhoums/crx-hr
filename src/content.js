import util from './util'
// localStorage.setItem("706007722-filter", '[{"filterId":-1}]');
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == 'oprationInPage') {
      localStorage.setItem("706007722-filter","");
      localStorage.setItem("706007722-filter",'[{"filterId":-1,"input":"'+request.keyword+'"},{"filterId":9},{"filterId":38,"selected":"6,months"},{"filterId":11,"value":["773"]},{"filterId":12},{"filterId":13},{"filterId":14},{"filterId":16},{"filterId":35}]')
      location.reload()
    }
    if(request.greeting=="fetchResume"){
      util.sleep(2000)
      console.log($("table.k-table .k-table__body"))
      let item= $("table.k-table .k-table__body").find("tr.resume-item__basic a")
      console.log(item,item.length)
      if(item.length<=0){
        util.sleep(1000)
        item= $("table.k-table .k-table__body").find("tr.resume-item__basic a")
      }
      item[0].click();//打开详情页面

    }
    if(request.greeting=="resumeDetail"){
      let $resume=$("#resumeDetail");
      let div=$resume.find("div");
      let header = $(".resume-content.is-mb-0 .resume-content__header").text();
      let candidateWarp=$(".resume-content__candidate-basic");
      let candidate = {
        name:candidateWarp.find(".resume-content__candidate-name").text(),
        age_workYears:candidateWarp.find(".resume-content__labels").text(),
        address:candidateWarp.find(".resume-content__labels--sub").text()
      };

      let resumeFile={
        headTxt:header,
        catchDate:util.retrunDate(),
        resumeId:request.resume_id.split("_")[0],
        candidate,
      };
      for(let i of div){
        //careerObjective
        if($(i).hasClass("is-career-objective")){
          let cont = $(i).find(".resume-content__section-body .resume-content__property");
          let txt="";
          Array.from(new Set(cont.children())).forEach((item,k)=>{
            if(k%2==0){
              if(k!=0){
                txt+=("; "+$(item).text());
              }else{
                txt+=$(item).text()
              }
            }else{
              txt+=(":"+$(item).text())
            }
          })
          resumeFile.careerObjective=txt;
        }else if($(i).hasClass("resume-content__section")){ //resume 正文内容
          let objItemName = $(i).attr("data-bind").split(':')[1].split(".")[0].replace("()","");
          let title=$(i).find(".resume-content__section-header").text().split(" ")[0];
          let content=[];
          resumeFile[objItemName]={title,content}
          if(title){
            let wrap = $(i).find(".resume-content__section-body");//详情内容wrap
            if(wrap.children().length==0){
              resumeFile[objItemName].content.push($.trim(wrap.text()))
            }else{
              let contList = new Set(wrap.find(".timeline__item"))
              contList.forEach((contItem,key)=>{
                resumeFile[objItemName].content.push($.trim($(contItem).text()))
              })
            }
          }
        }//resume 正文内容 end
      }
      chrome.runtime.sendMessage({
        greeting:'sendResume',
        resume:resumeFile
      })
    }
});

$(function(){
  console.log(location.href)
  if(location.href.includes('rd5.zhaopin.com/resume/detail')){
    console.log('jsdfaldsalklkl')
    let item= $("table.k-table .k-table__body").find("tr.resume-item__basic a")
    chrome.runtime.sendMessage({
      greeting:'getDetail',
      page:111111,
      totalPage:100,
      current:0,
      length:item.length
    })
  }
  if(location.href=="https://rd5.zhaopin.com/custom/search/result"){
    chrome.runtime.sendMessage({
      greeting:'triggerFetchResume'
    })
  }
})
