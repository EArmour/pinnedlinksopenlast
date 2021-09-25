let activeTabIsPinned = false;
let numTabs = 0;
let numPinnedTabs = 0;

function initializeCurrentTabStatus() {
    browser.tabs.query({active: true, currentWindow: true}).then(
        ([tab]) => {
            if (!tab) {
                return;
            }
            activeTabIsPinned = tab.pinned;
        }
    );
	
	browser.tabs.query({currentWindow: true}).then(
		(tabs) => {
			numTabs = tabs.length;
			numPinnedTabs = tabs.filter(tab => tab.pinned).length;
		}
	);
}

initializeCurrentTabStatus();

browser.tabs.onActivated.addListener(handleTabActivated);

async function handleTabActivated(activeInfo) {
    activeTab = await browser.tabs.get(activeInfo.tabId);
    activeTabIsPinned = activeTab.pinned;
}

//browser.tabs.onCreated.addListener(moveTab);

async function moveTab(newTab) {
    if (activeTabIsPinned) {
        browser.tabs.move(newTab.id, {index: -1});
    }
}

// All the nonsense below is only necessary because the tab list scrolls to the extreme left immediately
// when a new tab is first opened, but does NOT then scroll to the extreme right after the tab is moved there
// with browser.tabs.move for some reason. So in order to prompt the tab list to scroll back to the right,
// we instead have to duplicate the tab to a new one at the desired index rather than just moving it there.

browser.tabs.onCreated.addListener(updateTabCount);
browser.tabs.onRemoved.addListener(updateTabCount);

// Have to use onUpdated rather than onCreated as url is not populated immediately upon tab creation (???)
browser.tabs.onUpdated.addListener(recreateTab, {properties: ["url"]});

async function updateTabCount() {
	tabs = await browser.tabs.query({currentWindow: true});
	numTabs = tabs.length;
	numPinnedTabs = tabs.filter(tab => tab.pinned).length;
}

async function recreateTab(tabId, changeInfo, tabInfo) {
	if (activeTabIsPinned) {
		if (tabInfo.index > (numPinnedTabs - 1) && tabInfo.index < (numTabs - 5)) {		
			createdTab = await browser.tabs.create({active: false, url: changeInfo.url, index: 9999});
			browser.tabs.remove(tabId);
		}
    }
}
