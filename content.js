
var port = chrome.runtime.connect({name: "knockknock"});
document.addEventListener('click', function (e) {
  port.postMessage({});
});

document.addEventListener('wheel', function (e) {
  port.postMessage({});
});

chrome.extension.onMessage.addListener(function(msg, sender, sendResponse) {

  if (msg.action == 'open_dialog_box') {
    $("#result").append(msg.content)
    // alert(msg.content)
  } else if (msg.action === "get_document") {
    port.postMessage({'document': document});
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg, sendingPort) {
    // updateTabLastUpdated(sendingPort.sender.tab.id, undefined, sendingPort.sender.tab.url);
    // updateInteractionTime();
    console.log("background connected on port " + sendingPort + " with message " + msg)
  });
  console.log("onConnect");
});


var div = document.createElement( 'div' );
div.setAttribute("id", "result");
div.setAttribute("name", "result");


var style = document.createElement('style');
style.innerHTML =
  "#result {" +
    "position: fixed;" +
    "right: 100px;" +
    "top: 200px;" +
    "width: 40px;" +
    "height: 40px;" +
    "z-index: 1000;" +
    "background: rgba(49, 162, 214, 1);" +
    "border-radius: 5px;" +
    "transition: all 1s;" +
    "transition-delay: 0.3s;" +
    "box-shadow: 0px 10px 39px -22px rgba(0,0,0,0.7);" +
    "overflow: hidden;" +
  "}" +
  "#result:hover {" +
    "width: 600px;" +
    "max-height: 500px;" +
    "height: auto;" +
    "background: white;" +
    "padding: 20px;" +
    "transition: all 1s;" +
    "transition-delay: 0s;" +
    "overflow-y: auto;" +
  "}" +
  // "#result:active {" +
  // "}" +
  "#title {" +
    "margin-bottom: 10px;" +
  "}" +
  "#summary {" +
    "border-left: 4px solid rgba(49, 162, 214, 1);" +
    "padding-left: 10px;" +
    "margin-bottom: 10px;" +
    "position: relative;" +
    "left: 50px;" +
  "}" +
  "#title,#summary {" +
    "visibility: hidden;" +
    "opacity: 0;" +
    "transition: all 0.3s;" +
    "transition-delay: 0s;" +
    "width: 550px;" +
  "}" +
  "#result:hover > #title {" +
    "visibility: visible;" +
    "opacity: 1;" +
    "transition: all 0.3s;" +
    "transition-delay: 0.8s;" +
  "}" +
  "#result:hover > #summary {" +
    "visibility: visible;" +
    "opacity: 1;" +
    "transition: all 0.3s;" +
    "transition-delay: 0.8s;" +
    "left: 0;" +
  "}";

var ref = document.querySelector('script');
ref.parentNode.insertBefore(style, ref);

// div.style.backgroundColor = 'red';
// div.style.position = "fixed";
// div.style.left = "10px";
// div.style.top = "200px";
// div.style.width = "400px";
// div.style.height = "400px";
// div.style.zIndex = "1000";
// div.style.background = "white";
// div.style.borderRadius = "5px";
// div.style.boxShadow = "0px 10px 39px -22px rgba(0,0,0,0.7)";
// div.style.padding = "20px";
document.body.prepend( div );

// div.appendChild("<h4>Hello WOrld</h4>")

var documentClone = document.cloneNode(true);
var article = new Readability(documentClone).parse();
port.postMessage({'article': article});


var title = $("<h4 id='title'>" + article.title + "</h4>").appendTo("#result")
// $("#result").append("<h4>" + article.title + "</h4>");

