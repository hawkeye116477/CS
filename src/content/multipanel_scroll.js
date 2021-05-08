let lastScrollTop = 0;
let lastScrollLeft = 0;

addMessageListener("classicsidebar@hawkeye116477:synchronizeScrollPanel", function (message) {
    let scrollElem = message.data;
    let currLastScrollTop = lastScrollTop,
        currLastScrollLeft = lastScrollLeft;
    lastScrollTop = scrollElem.scrollTop;
    lastScrollLeft = scrollElem.scrollLeft;

    let deltaTop = 0,
        deltaLeft = 0,
        selTabLeft = content.scrollX,
        selTabTop = content.scrollY;

    if (currLastScrollTop != 0 || currLastScrollLeft != 0) {
        deltaTop = scrollElem.scrollTop - currLastScrollTop;
        deltaLeft = scrollElem.scrollLeft - currLastScrollLeft;
    }

    let combinedLeft = selTabLeft += deltaLeft;
    let combinedTop = selTabTop += deltaTop;
    content.scrollTo(combinedLeft, combinedTop);
});

function handleSynchronizeScrollBrowser() {
    if (content.document.hasFocus()) {
        sendAsyncMessage('classicsidebar@hawkeye116477:synchronizeScrollBrowser', { scrollY: content.scrollY, scrollX: content.scrollX });
    }
}

addEventListener("scroll", handleSynchronizeScrollBrowser, true);

addMessageListener("classicsidebar@hawkeye116477:unsynchronizeScrollBrowser", function removeMe() {
    removeEventListener("scroll", handleSynchronizeScrollBrowser, true);
    removeMessageListener("classicsidebar@hawkeye116477:unsynchronizeScrollBrowser", removeMe);
});
