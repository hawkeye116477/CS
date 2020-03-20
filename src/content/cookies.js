var cookieWindow = document.getElementById("CookiesDialog");

var AiOS_Cookies = {
    init: function () {
        var enable_layout = AiOS_HELPER.prefBranchAiOS.getBoolPref("ks.layout");
        var enable_layoutall = AiOS_HELPER.prefBranchAiOS.getBoolPref("ks.layoutall");
        var aios_inSidebar = (top.document.getElementById("sidebar-box")) ? true : false;

        // Hide the menu bar under Mac OS X
        aios_hideMacMenubar();

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(cookieWindow);

        // Sidebar Layout
        if ((enable_layout && aios_inSidebar) || enable_layoutall)
            AiOS_Cookies.sidebarLayout();

        // Remove the keyboard shortcut so as not to block the main browser
        if (aios_inSidebar)
            aios_removeAccesskeys();
    },

    /*
     * Activates the layout adapted to the sidebar
     * 	=> Called by aios_init()
     */
    sidebarLayout: function () {
        // Activate CSS for sidebar optimizations
        aios_addCSS("cookies.css", cookieWindow);

        var searchObj = document.getElementById("filter"),
            searchParent = searchObj.parentElement.children;

        for (let i = 0; i < searchParent.length; i++) {
            let elem = searchParent[i];
            if (elem.tagName == "label")
                elem.hidden = true;
        }
    }
};

window.addEventListener("DOMContentLoaded", AiOS_Cookies.init, false);
