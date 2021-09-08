let activeTabIsPinned = false;

function initializeCurrentTabStatus() {
    const query = {
        active: true,
        currentWindow: true,
    };
    browser.tabs.query(query).then(
        ([tab]) => {
            if (!tab) {
                return;
            }
            activeTabIsPinned = tab.pinned;
        }
    );
}

async function handleTabActivated(activeInfo) {
	activeTab = await browser.tabs.get(activeInfo.tabId);
    activeTabIsPinned = activeTab.pinned;
}

initializeCurrentTabStatus();

browser.tabs.onActivated.addListener(handleTabActivated);

browser.tabs.onCreated.addListener(moveTab);

function moveTab(newTab) {
	if (activeTabIsPinned) {
		browser.tabs.move(newTab.id, {index: -1});
	}
}
