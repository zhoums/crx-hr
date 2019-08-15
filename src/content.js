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

      let item= $("table.k-table .k-table__body").find("tr.resume-item__basic a")
      item[0].click();
      chrome.runtime.sendMessage({
        greeting:'getDetail'
      })
    }
    if(request.greeting=="resumeDetail"){
      let $resume=$("#resumeDetail");
      let div=$resume.find("div");
      let resumeFile={
        catchDate:util.today(),
        resumeId:request.resume_id.split("_")[0]
      };
      for(let i of div){
        console.log(i)
        if($(i).hasClass("is-career-objective")){
          let cont = $(i).find(".resume-content__section-body .resume-content__property");
          let txt="";
          console.log(new Set(cont.children()))
          Array.from(new Set(cont.children())).forEach((item,k)=>{
            console.log("k",k,item)
            if(k%2==0){
              if(k!=0){
                console.log('fadsfds',k)
                txt+=("; "+$(item).text());
              }else{
                console.log('444444',k)
                txt+=$(item).text()
              }
            }else{
              txt+=(":"+$(item).text())
            }
          })
          resumeFile.careerObjective=txt;
        }
      }
      console.log(resumeFile)
    }
});
