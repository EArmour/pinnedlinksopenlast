let activeTabIsPinned = false;
let tabIdsToMove = [];
let movedTabIds = [];

function initializeCurrentTabStatus() {
    browser.tabs.query({ active: true, currentWindow: true }).then(
        ([tab]) => {
            if (!tab) {
                return;
            }
            activeTabIsPinned = tab.pinned;
        }
    );
}

initializeCurrentTabStatus();

browser.tabs.onActivated.addListener(handleTabActivated);

async function handleTabActivated(activeInfo) {
    browser.tabs.get(activeInfo.tabId).then(
        activeTab => {
            activeTabIsPinned = activeTab.pinned;
        }
    );
}

/**
// This should be all that's required, but there's a bug with the tab list behavior (see below)

browser.tabs.onCreated.addListener(moveTab);

async function moveTab(newTab) {
    if (activeTabIsPinned) {
        browser.tabs.move(newTab.id, { index: -1 });
    }
}
**/

// All the nonsense below is only necessary because the tab list scrolls to the extreme left immediately
// when a new tab is first opened, but does NOT then scroll to the extreme right after the tab is moved there
// with browser.tabs.move for some reason. So in order to prompt the tab list to scroll back to the right,
// we instead have to duplicate the tab to a new one at the desired index rather than just moving it there.

// The tab's url is not yet populated when onCreated fires, so we just record the tabId and then have to
// separately listen for onUpdated when the tab actually gets its url set so that we can duplicate it.
browser.tabs.onCreated.addListener(markTab);
browser.tabs.onUpdated.addListener(recreateTab, { properties: ["url"] });

async function markTab(newTab) {
    if (activeTabIsPinned && !movedTabIds.includes(newTab.id)) {
        tabIdsToMove.push(newTab.id);

        if (tabIdsToMove.length > 255) {
            tabIdsToMove = tabIdsToMove.slice(-25);
        }
    }

    if (movedTabIds.length > 255) {
        movedTabIds = movedTabIds.slice(-25);
    }
}

async function recreateTab(tabId, changeInfo, tabInfo) {
    const tabIndex = tabIdsToMove.indexOf(tabId);
    if (tabIndex !== -1 && !movedTabIds.includes(tabId)) {
        const createdTab = await browser.tabs.create({ active: false, url: changeInfo.url, index: 9999 });
        movedTabIds.push(createdTab.id);
        browser.tabs.remove(tabId);
        tabIdsToMove[tabIndex] = 0;
    }
}
