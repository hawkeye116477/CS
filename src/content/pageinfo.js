function aios_inSidebar() {
    return (top.document.getElementById("sidebar-box")) ? true : false;
}
function aios_inTab() {
    return (AiOS_HELPER.mostRecentWindow.aiosLastSelTab) ? true : false;
}

// Add listener for automatic update and remove
if (aios_inSidebar()) {
    window.addEventListener("load", function (e) {
        top.gBrowser.addProgressListener(AiOS_ProgressListener);
    }, false);

    window.addEventListener("unload", function (e) {
        top.gBrowser.removeProgressListener(AiOS_ProgressListener);
    }, false);
}

var AiOS_PageInfo = {
    init: function () {
        // Hide the menu bar on Mac OS X.
        aios_hideMacMenubar();

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(document.getElementById("main-window"));

        var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layout");
        var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("pi.layoutall");
        if ((enable_layout && aios_inSidebar()) || enable_layoutall)
            AiOS_PageInfo.sidebarLayout();

        // Remove keyboard short to avoid blocking the main browser
        if (aios_inSidebar())
            aios_removeAccesskeys();
    },

    sidebarLayout: function () {
        var vbox;
        let managerWindow = document.getElementById("main-window");

        // Enable CSS for sidebar optimizations
        aios_addCSS("pageinfo.css", managerWindow);
        managerWindow.setAttribute("aios-inSidebar", "true");

        // Hide the label of the radio buttons => only if there are icons
        var cStyle = document.defaultView.getComputedStyle(document.getElementById("generalTab"), "");
        if (cStyle.listStyleImage && cStyle.listStyleImage != "none") {
            if (document.getElementById("viewGroup"))
                document.getElementById("viewGroup").setAttribute("hideLabel", true);
        }

        // Radio buttons with tooltip
        if (document.getElementById("viewGroup")) {
            var radioChilds = document.getElementById("viewGroup").childNodes;
            for (var i = 0; i < radioChilds.length; i++) {
                if (radioChilds[i].tagName == "radio")
                    radioChilds[i].setAttribute("tooltiptext", radioChilds[i].label);
            }
        }

        // Media Panel: Save as ... button break
        var hbox = document.getElementById("mediaPreviewBox").getElementsByTagName("hbox")[0];
        hbox.setAttribute("align", "start");
        hbox.setAttribute("orient", "vertical");
        hbox.removeChild(hbox.getElementsByTagName("spacer")[0]);
        hbox.appendChild(hbox.getElementsByTagName("vbox")[0]);

        // Security Panel: Breaking Texts and Buttons
        // Identity
        var groupbox = document.getElementById("security-identity-groupbox");
        groupbox.removeChild(groupbox.getElementsByTagName("spacer")[0]);
        groupbox.getElementsByTagName("hbox")[0].setAttribute("orient", "vertical");
        groupbox.getElementsByTagName("hbox")[0].setAttribute("align", "start");

        // History
        var historyrow = document.getElementById("security-privacy-history-label").parentNode;
        vbox = document.createElement("vbox");
        while (historyrow.childNodes.length != 0) {
            vbox.appendChild(historyrow.firstChild);
        }
        vbox.setAttribute("flex", "100");
        historyrow.appendChild(vbox);

        // Cookies
        var cookierow = document.getElementById("security-privacy-cookies-label").parentNode;
        vbox = document.createElement("vbox");
        while (cookierow.childNodes.length != 0) {
            vbox.appendChild(cookierow.firstChild);
        }
        vbox.setAttribute("flex", "100");
        cookierow.appendChild(vbox);

        // Passwords
        var pwdrow = document.getElementById("security-privacy-passwords-label").parentNode;
        vbox = document.createElement("vbox");
        while (pwdrow.childNodes.length != 0) {
            vbox.appendChild(pwdrow.firstChild);
        }
        vbox.setAttribute("flex", "100");
        pwdrow.appendChild(vbox);
    },

    // Remember the last selected tab
    persistSelTab: function () {
        document.getElementById("main-window").setAttribute("seltab", document.getElementById("viewGroup").selectedIndex);
    },

    // Automatic update => call by AiOS_ProgressListener (_helper.js)
    onLocationChange: function () {
        if (aios_inSidebar()) {
            AiOS_PageInfo.persistSelTab();
            location.reload(true);
        }
    },

    onStateChange: function () {
        if (!AiOS_HELPER.usingCUI)
            AiOS_PageInfo.onLocationChange();
    }
};

// Override certain functions inside the 'security' variable of Page Info
(function () {
    // Display the server certificate (static)
    this.viewCert = function () {
        var cert = security._cert;

        // Checks for sidebar/tab
        if (aios_inSidebar())
            viewCertHelper(AiOS_HELPER.mostRecentWindow.window, cert);
        else if (aios_inTab())
            viewCertHelper(AiOS_HELPER.mostRecentWindow.aiosLastSelTab.window, cert);
        else
            viewCertHelper(window, cert);
    };

    // Find the secureBrowserUI object (if present)
    this._getSecurityUI = function () {
        // Checks for sidebar/tab
        if (aios_inSidebar()) {
            if ("gBrowser" in top)
                return top.gBrowser.securityUI;
            return null;
        } else if (aios_inTab()) {
            return AiOS_HELPER.mostRecentWindow.aiosLastSelTab.securityUI;
        }
        // Original part
        else {
            if (window.opener.gBrowser)
                return window.opener.gBrowser.securityUI;
            return null;
        }
    };
}).apply(security);

var AiOS_Overrides = {
    init: function () {
        loadPageInfo = this.WF_loadPageInfo;
    },

    WF_loadPageInfo: function (frameOuterWindowID, imageElement, browser) {
        browser = browser || AiOS_HELPER.mostRecentWindow.gBrowser.selectedBrowser || window.opener.gBrowser.selectedBrowser;
        let mm = browser.messageManager;

        gStrings["application/rss+xml"] = gBundle.getString("feedRss");
        gStrings["application/atom+xml"] = gBundle.getString("feedAtom");
        gStrings["text/xml"] = gBundle.getString("feedXML");
        gStrings["application/xml"] = gBundle.getString("feedXML");
        gStrings["application/rdf+xml"] = gBundle.getString("feedXML");

        // Look for pageInfoListener in content.js. Sends message to listener with arguments.
        mm.sendAsyncMessage("PageInfo:getData", {
            strings: gStrings,
            frameOuterWindowID: null
        }, {
            imageElement
        });

        let pageInfoData;

        // Get initial pageInfoData needed to display the general, feeds, permission and security tabs.
        mm.addMessageListener("PageInfo:data", function onmessage(message) {
            mm.removeMessageListener("PageInfo:data", onmessage);
            pageInfoData = message.data;

            let docInfo = pageInfoData.docInfo;
            let windowInfo = pageInfoData.windowInfo;

            let uri = makeURI(docInfo.documentURIObject.spec,
                docInfo.documentURIObject.originCharset);
            let principal = docInfo.principal;
            gDocInfo = docInfo;

            gImageElement = pageInfoData.imageInfo;

            var titleFormat = windowInfo.isTopWindow ? "pageInfo.page.title"
                : "pageInfo.frame.title";
            document.title = gBundle.getFormattedString(titleFormat, [docInfo.location]);

            document.getElementById("main-window").setAttribute("relatedUrl", docInfo.location);

            makeGeneralTab(pageInfoData.metaViewRows, docInfo);
            initFeedTab(pageInfoData.feeds);
            onLoadPermission(uri, principal);
            securityOnLoad(uri, windowInfo);
        });

        // Get the media elements from content script to setup the media tab.
        mm.addMessageListener("PageInfo:mediaData", function onmessage(message) {
            // Page info window was closed.
            if (window.closed) {
                mm.removeMessageListener("PageInfo:mediaData", onmessage);
                return;
            }

            // The page info media fetching has been completed.
            if (message.data.isComplete) {
                mm.removeMessageListener("PageInfo:mediaData", onmessage);
                onFinished.forEach(function (func) {
                    func(pageInfoData);
                });
                return;
            }

            for (let item of message.data.mediaItems) {
                addImage(item);
            }

            selectImage();
        });

        /* Call registered overlay init functions */
        onLoadRegistry.forEach(function (func) {
            func();
        });
    },
};

AiOS_Overrides.init();

window.addEventListener("DOMContentLoaded", AiOS_PageInfo.init, false);
window.addEventListener("unload", AiOS_PageInfo.persistSelTab, false);
