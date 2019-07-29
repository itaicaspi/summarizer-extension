chrome.runtime.onInstalled.addListener(function() {
  // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  //   chrome.declarativeContent.onPageChanged.addRules([{
  //     conditions: [new chrome.declarativeContent.PageStateMatcher({
  //       pageUrl: {hostContains: 'www.amazon.com'},
  //     })
  //     ],
  //     actions: [new chrome.declarativeContent.ShowPageAction()]
  //   }]);
  // });
  // chrome.storage.local.remove('tabs');
  // chrome.storage.local.remove('savedTabs');
  // chrome.storage.local.set({'tabs': {}, 'savedTabs': [], 'lastInteractionTime': new Date().getTime(), 'totalInteractionTime': 0});

  // window.localStorage.setItem('tabs', JSON.stringify({}));
  // window.localStorage.setItem('savedTabs', JSON.stringify([]));
  // window.localStorage.setItem('lastInteractionTime', JSON.stringify(new Date().getTime()));
  // window.localStorage.setItem('totalInteractionTime', JSON.stringify(0));
  // window.localStorage.setItem('totalDomainInteractionTimes', JSON.stringify({}));

});

const sec = 1000;
const min = 60 * sec;
const hour = 60 * min;
const day = 24 * hour;
const week = 7 * day;
const month = 31 * day;
const year = 365 * day;

const maxTimeBetweenInteractions = 2 * min;  // interactions include mouse clicks and tab changes / creation / removal
let maxTimeToKeepTabWithoutInteraction = 2 * min;


function getDomain(url) {
  if (url === undefined) return undefined;
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.log(url);
    return undefined;
  }
}

function updateDomainInteractionTime(domain, interactionTime) {
  let totalDomainInteractionTimes = JSON.parse(window.localStorage.getItem('totalDomainInteractionTimes'));
  totalDomainInteractionTimes = totalDomainInteractionTimes ? totalDomainInteractionTimes : {};
  if (domain in totalDomainInteractionTimes) {
    totalDomainInteractionTimes[domain].push(interactionTime);
  } else {
    totalDomainInteractionTimes[domain] = [interactionTime];
  }
  window.localStorage.setItem('totalDomainInteractionTimes', JSON.stringify(totalDomainInteractionTimes));
}


function updateInteractionTime() {
  let now = new Date().getTime();
  let lastInteractionTime = JSON.parse(window.localStorage.getItem('lastInteractionTime'));
  lastInteractionTime = lastInteractionTime ? lastInteractionTime : 0;
  let totalInteractionTime = JSON.parse(window.localStorage.getItem('totalInteractionTime'));
  totalInteractionTime = totalInteractionTime ? totalInteractionTime : 0;
  let timePassedSinceLastInteraction = now - lastInteractionTime;

  if (timePassedSinceLastInteraction < maxTimeBetweenInteractions) {
    totalInteractionTime += timePassedSinceLastInteraction;
    window.localStorage.setItem('totalInteractionTime', JSON.stringify(totalInteractionTime));
  }
  window.localStorage.setItem('lastInteractionTime', JSON.stringify(new Date().getTime()));
}

function updateTabLastUpdated(tabId, openerTabId, url) {
  let tabs = JSON.parse(window.localStorage.getItem('tabs'));
  tabs = tabs ? tabs : {};
  let totalInteractionTime = JSON.parse(window.localStorage.getItem('totalInteractionTime'));
  totalInteractionTime  = totalInteractionTime ? totalInteractionTime : 0;
  if (!(tabId in tabs)) {
    tabs[tabId] = {};
  }

  // update domain interaction time
  let now = new Date().getTime();
  let lastInteractionTime = JSON.parse(window.localStorage.getItem('lastInteractionTime'));
  lastInteractionTime = lastInteractionTime ? lastInteractionTime : 0;
  if (getDomain(url) === getDomain(tabs[tabId].lastUrl)) {
    tabs[tabId].currentDomainInteractionTime += now - lastInteractionTime;
  } else {
    updateDomainInteractionTime(getDomain(tabs[tabId].lastUrl), tabs[tabId].currentDomainInteractionTime);
    tabs[tabId].currentDomainInteractionTime = 0;
  }

  tabs[tabId].lastUpdated = totalInteractionTime;
  tabs[tabId].lastUrl = url;

  if (openerTabId !== undefined) {
    tabs[tabId].openedBy = openerTabId;
  }
  window.localStorage.setItem('tabs', JSON.stringify(tabs));
}

function saveTab(tab, preventDuplicates) {
  if (tab === null) {
    return;
  }
  let savedTabs = JSON.parse(window.localStorage.getItem('savedTabs'));
  savedTabs = savedTabs ? savedTabs : [];
  if (preventDuplicates) {
    savedTabs = savedTabs.filter(t => t.url !== tab.url);
  }
  savedTabs.push(tab);
  window.localStorage.setItem('savedTabs', JSON.stringify(savedTabs));

}

function tabIsClosable(tab) {
  if (tab === undefined) {
    return false;
  }
  if (tab.active) {
    return false;
  }
  if (tab.pinned) {
    return false
  }
  if (tab.audible) {
    return false
  }
  if (tab.url.includes("chrome://newtab")) {
    return false
  }
  return true;
}


function closeOldTabs() {
  let tabs = JSON.parse(window.localStorage.getItem('tabs'));
  tabs = tabs ? tabs : {};
  let totalInteractionTime = JSON.parse(window.localStorage.getItem('totalInteractionTime'));
  totalInteractionTime = totalInteractionTime ? totalInteractionTime : 0;

  let newTabs = {};
  chrome.tabs.query({}, (result) => {
    for (let key in tabs) {
      // close tabs that are old enough
      if (totalInteractionTime - tabs[key].lastUpdated > maxTimeToKeepTabWithoutInteraction) { //7*24*60*60*1000) {
        let tabToClose = result.filter(t => t.id === parseInt(key))[0];
        if (tabIsClosable(tabToClose)) {
          saveTab(tabToClose, true);
          chrome.tabs.remove([tabToClose.id]);
        }

      } else {
        newTabs[key] = tabs[key];
      }
    }
    window.localStorage.setItem('tabs', JSON.stringify(tabs));
  });
}

function tabRemoved(tabId) {
  let tabs = JSON.parse(window.localStorage.getItem('tabs'));
  tabs = tabs ? tabs : {};
  updateDomainInteractionTime(getDomain(tabs[tabId].lastUrl), tabs[tabId].currentDomainInteractionTime);
  if (tabId in tabs) {
    delete tabs[tabId];
  }
  window.localStorage.setItem('tabs', JSON.stringify(tabs));
}


function strip(html) {
  html = html.replace(/<[p][^>]*>/g, '\n').replace(/<\/p>/g, '');
  var tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function parse_url(url) {
  console.log(url);
  Mercury.parse(url).then(result => {
    console.log(result);
    $("#name").val(strip(result['content']));
  });
}

function create_marked_text(response) {
  var result = "";
  for (var line in response) {
    var subparts = response[line].split(": ");
    var score = parseFloat(subparts[0]);
    var text = subparts[1];
    var color = Math.exp(score) - 1; // Math.ceil(score * 255);
    result += "<span style=\"background: rgba(255, 0, 0, " + color + ");\">" + text + "</span>";
  }
  return result;
}

function create_summarization_bullets(response, threshold) {
  var result = "";
  // result += "<ul id=\"summary\">";
  for (var line in response) {
    var subparts = response[line].split(": ");
    var score = parseFloat(subparts[0]);
    var text = subparts[1];
    if (score > threshold) {
      result += "<div id=\"summary\">" + text + "</div>";
    }
  }
  // result += "</ul>";
  return result;
}

function parse_result(response) {
  console.log(response);
  $("body").append("<div id=\"result\" name=\"result\"></div>");
  // var result = create_marked_text(response);
  var result = create_summarization_bullets(response, 0.2);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {action: "open_dialog_box", content: result}, function(response) {});
  });
  // alert($("#result").val())

}

function send_text(content) {
  console.log(content);
  // console.log(strip(content).toString())
  $.ajax({
    type: 'POST',
    url: "http://35.226.246.206:5000/summary",
    data: {'content':  strip(content)},
    //or your custom data either as object {foo: "bar", ...} or foo=bar&...
    success: function(response) { parse_result(response); },
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  // // console.log(window.localStorage.getItem('tabs'))
  // let openerTabId = tab.openerTabId;
  // if (tab.url === "chrome://newtab/") {
  //   openerTabId = undefined;
  // }
  // updateTabLastUpdated(tab.id, openerTabId, tab.url);
  // closeOldTabs();
  //
  // chrome.storage.local.get('maxTimeToKeepTabWithoutInteraction', result => {
  //   maxTimeToKeepTabWithoutInteraction = parseInt(result.maxTimeToKeepTabWithoutInteraction) * min;
  // });
  console.log("onCreated");
  // Mercury.parse().then(result => {
  //   console.log(result);
  // });
});

chrome.webNavigation.onCompleted.addListener((tab) => {
  console.log("onCompleted");
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // updateTabLastUpdated(tabId, undefined, tab.url);
  // updateInteractionTime();
  console.log("onUpdated");
  console.log(changeInfo.status);
  if (changeInfo.status === "complete") {
    chrome.tabs.sendMessage(tabId, {action: "get_document"}, function(response) {});
    // var article = new Readability(document).parse();
    // console.log(article)
    // send_text(article['content']);
    // Mercury.parse(tab.url).then(result => {
    //   send_text(result['content']);
    // });
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // tabRemoved(tabId);
  // updateInteractionTime();
  console.log("onRemoved");
});


// removing a tab causes it to activate first, which stores the tabs and then sets them after removing the tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  // chrome.tabs.query({active: true}, result => {
  //   updateTabLastUpdated(activeInfo.tabId, undefined, result[0].url);
  // });
  // updateInteractionTime();
  console.log("onActivated");
});

chrome.runtime.onConnect.addListener(function(port) {
  port.onMessage.addListener(function(msg, sendingPort) {
    // updateTabLastUpdated(sendingPort.sender.tab.id, undefined, sendingPort.sender.tab.url);
    // updateInteractionTime();
    console.log("connected on port " + sendingPort + " with message " + msg)
    console.log(msg)
    if ('article' in msg) {
      send_text(msg['article']['content']);
    }
  });
  console.log("onConnect");

});
