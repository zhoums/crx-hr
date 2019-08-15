import util from './util'
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.greeting == 'oprationInPage') {
      localStorage.setItem("706007722-filter","");
      localStorage.setItem("706007722-filter",'[{"filterId":-1,"input":"'+request.keyword+'"},{"filterId":9},{"filterId":38,"selected":"6,months"},{"filterId":11,"value":["773"]},{"filterId":12},{"filterId":13},{"filterId":14},{"filterId":16},{"filterId":35}]')
      location.reload()
    }
    if(request.greeting=="fetchResume"){
      function todo(item){
        console.log('kljdsfakldsj',item)
        item.click();
        chrome.runtime.sendMessage({
          greeting:'getDetail'
        })
      }
      let item= $("table.k-table .k-table__body").find("tr.resume-item__basic a");
      //@param {number} item:indexof resume in page
      if(item[0]){
        todo(item[0])
      }else{

        util.sleep(300)
        item= $("table.k-table .k-table__body").find("tr.resume-item__basic a");
        todo(item[0])
      }

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
          console.log($(i).text())
          let cont = $(i).find(".resume-content__section-body .resume-content__property");
          cont.children().forEach((item,i)=>{
            
          })
          console.log('cont',cont.children())
          let _new = cont.filter(c=>c!=="" )
          resumeFile.careerObjective=_new;
        }
      }
      console.log(resumeFile)
    }
});
