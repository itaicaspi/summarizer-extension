
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
    "transition: all 0.5s;" +
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
    "transition: all 0.5s;" +
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
    "transition-delay: 0.3s;" +
  "}" +
  "#result:hover > #summary {" +
    "visibility: visible;" +
    "opacity: 1;" +
    "transition: all 0.3s;" +
    "transition-delay: 0.1s;" +
    "left: 0;" +
  "}";

var ref = document.querySelector('script');
ref.parentNode.insertBefore(style, ref);


// div.appendChild("<h4>Hello WOrld</h4>")

var documentClone = document.cloneNode(true);
var article = new Readability(documentClone).parse();

var filteredSitesByName = ['CNN', 'Business Insider', 'The New Yorker', 'Medium', 'The Jerusalem Post | JPost.com', 'Forbes', 'Gizmodo', 'Bloomberg.com'];
var filteredSitesByTitle = ['Yahoo', 'Wikipedia'];
var parseWebsite = 'siteName' in article && filteredSitesByName.indexOf(article['siteName']) >= 0;
console.log(article)
for (var siteIdx in filteredSitesByTitle) {
  if ('title' in article && article['title'].includes(filteredSitesByTitle[siteIdx])) {
    parseWebsite = true;
  }
}
console.log(parseWebsite, 'Parse Website')
if (parseWebsite) {
  port.postMessage({'article': article});
  var div = document.createElement( 'div' );
  div.setAttribute("id", "result");
  div.setAttribute("name", "result");
  document.body.prepend( div );
  var title = $("<h4 id='title'>" + article.title + "</h4>").appendTo("#result")
// $("#result").append("<h4>" + article.title + "</h4>");
}

