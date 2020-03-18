var AiOS_Compatibility = {};

(function () {
    // Registration
    var namespaces = [];

    this.ns = function (fn) {
        var ns = {};
        namespaces.push(fn, ns);
        return ns;
    };

    // Initialization
    this.initialize = function () {

        for (var i = 0; i < namespaces.length; i += 2) {
            var fn = namespaces[i];

            var ns = namespaces[i + 1];
            fn.apply(ns);
        }

        // MinimizeToTray
        if (document.getElementById("extensions.mook.minimizetotray.traypopup")) {
            window.setTimeout(function () {
                AiOS_Compatibility.minimizeToTray();
            }, 500);
        }

        // MileWideBack
        // is executed in aios.js => aios_setSidebarOrient()

        // StumbleUpon
        if (document.getElementById("su_splitter_first")) {
            document.getElementById("su_splitter_first").style.display = "none";
        }

    };

    // Adjustments for MinimizeToTray
    // otherwise the download manager does not open when calling via the tray icon
    this.minimizeToTray = function () {
        var itemCmd,
            newCmd,
            mmttMenuItems = document.getElementById("extensions.mook.minimizetotray.traypopup").childNodes;

        for (var i = 0; i < mmttMenuItems.length; i++) {
            itemCmd = mmttMenuItems[i].getAttribute("oncommand");

            if (itemCmd.indexOf("toOpenWindowByType('Download:Manager'") >= 0) {
                mmttMenuItems[i].removeAttribute("oncommand");
                mmttMenuItems[i].addEventListener("command", function () {
                    AiOS_HELPER.mostRecentWindow.aiosIsWindow = true;

                    window.setTimeout(function () {
                        AiOS_HELPER.mostRecentWindow.aiosIsWindow = false;
                    }, 500);
                });
            }
        }
    };

    // Clean up
    this.shutdown = function () {
        window.removeEventListener("load", AiOS_Compatibility.initialize);
        window.removeEventListener("unload", AiOS_Compatibility.shutdown);
    };

    // Register handlers
    window.addEventListener("load", this.initialize);
    window.addEventListener("unload", this.shutdown);

}).apply(AiOS_Compatibility);
