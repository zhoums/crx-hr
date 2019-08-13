$(function(){
	
  $("#ck").on("click", () => {
    chrome.runtime.sendMessage({
      greeting: "mission",
    });
    
  })


})
// chrome.tabs.query(
//     {active: true, currentWindow: true},
//     function (tabs) {
//         var port = chrome.tabs.connect(//建立通道
//             tabs[0].id,
//             {name: "ma"}//通道名称
//         );
//         $("#pagerBottomNew_btnNum2").click(function () {//给web页面的按钮绑定点击事件，通过点击事件来控制发送消息
//             port.postMessage({jia: "aaaaaaa"});//向通道中发送消息
//         });
//         port.onMessage.addListener(function (msg) {//这里同时利用通道建立监听消息，可以监听对方返回的消息
//             if(msg.jia== "yuuuuu"){//如果对方(popup.js)返回的消息是{jia: "yuuuuu"}则将扩展里面的input框的值设置为"yuuuuuuu"
//                 // $('#input').val("yuuuuuuu");
//                 console.log("yuuuuuuu")
//             };
//         });
//     });
