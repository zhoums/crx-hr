import util from './util'
localStorage.setItem("706007722-filter",'[{"filterId":-1}]');
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    // if(request.greeting=="codeLoaded"){
    //    sendResponse({codeLoaded: true});
    // }
    if(request.greeting=="turnpage"){
      console.log(request.page)
       sendResponse({codeLoaded: true});
    }
    if(request.greeting=="fetchResume"){
      console.log('fetchResume')
      let iiio= $("table.k-table .k-table__body").find("tr");

      console.log(iiio)
       // sendResponse({codeLoaded: true});
    }
    if (request.greeting == 'oprationInPage') {
      localStorage.setItem("706007722-filter","");
      localStorage.setItem("706007722-filter",'[{"filterId":-1,"input":"'+request.keyword+'"},{"filterId":9},{"filterId":38,"selected":"6,months"},{"filterId":11,"value":["773"]},{"filterId":12},{"filterId":13},{"filterId":14},{"filterId":16},{"filterId":35}]')
      location.reload()
    }
  }
);
$(function() {

})
