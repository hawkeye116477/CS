var AiOS_Prefs = {
    _couldApply: "",
    /*
     * Initialization
     * => Called by onload in <prefwindow>
     */
    initPrefs: function () {
        // open a special tab if one has been passed as an argument (out of the standard options)
        if (window.arguments) {
            if (window.arguments[0] == "dwn") {
                // Activate panel radio button
                var clickEvent = document.createEvent("MouseEvent");
                clickEvent.initEvent("command", false, true);

                var radiogroup = document.getAnonymousElementByAttribute(document.getElementById("aiosPreferences"), "anonid", "selector");
                radiogroup.childNodes[1].dispatchEvent(clickEvent);

                // Activate the download tab
                var tabbox = document.getElementById("aiosTabboxPanels");
                if (tabbox.childNodes[0].tagName == "tabs")
                    tabbox.childNodes[0].selectedIndex = 1;
                if (tabbox.childNodes[1].tagName == "tabs")
                    tabbox.childNodes[1].selectedIndex = 1;
            }
        }

        // Disable the Apply button
        AiOS_Prefs.disableApplyButton(true);

        // Settings button
        if (document.documentElement.getButton("extra2")) {
            var extra2 = document.documentElement.getButton("extra2");
            extra2.setAttribute("id", "aios-settings-button");
            extra2.setAttribute("popup", "aios-settings-popup");
            extra2.setAttribute("dir", "reverse");
        }

        // Activate/deactivate dependent elements
        AiOS_Prefs.checkDependent();

        // Monitor units of sidebar width for changes
        document.getElementById("obj-minWidthUnit").addEventListener("ValueChange", function () {
            aios_changeWidthUnit("min");
        }, false);

        document.getElementById("obj-defWidthUnit").addEventListener("ValueChange", function () {
            aios_changeWidthUnit("def");
        }, false);

        document.getElementById("obj-maxWidthUnit").addEventListener("ValueChange", function () {
            aios_changeWidthUnit("max");
        }, false);

        // Remember prefs, this is required for the Apply button => aios_checkApply()
        AiOS_Prefs.rememberOldPrefs();

        // Delete old prefs and migrate others (if necessary)
        AiOS_Prefs.deleteOldPrefs();
    },

    initPane: function (mode) {
        AiOS_HELPER.rememberAppInfo(document.getElementById("aiosPreferences"));

        // Reselect last selected tab
        var tabbox = null;
        switch (mode) {
        case "general":
            tabbox = document.getElementById("aiosTabboxGeneral");
            break;
        case "sbswitch":
            tabbox = document.getElementById("aiosTabboxSbSwitch");
            break;
        case "panels":
            tabbox = document.getElementById("aiosTabboxPanels");
            break;
        }

        var seltab = tabbox.parentNode.getAttribute("seltab");
        if (tabbox.childNodes[0].tagName == "tabs")
            tabbox.childNodes[0].selectedIndex = seltab;
        if (tabbox.childNodes[1].tagName == "tabs")
            tabbox.childNodes[1].selectedIndex = seltab;

        // Create a list of available sidebars
        if (mode == "general") {
            aios_genSidebarList();
        }

        document.addEventListener("dialogaccept", function() {
            AiOS_Prefs.savePrefs();
        });

        document.addEventListener("dialogextra1", function(event) {
            AiOS_Prefs.applyPrefs();
            event.preventDefault();
        });

        document.addEventListener("dialogdisclosure", function(event) {
            event.preventDefault();
            aios_addTab('https://github.com/FranklinDM/TGS/wiki/FAQ');
        });
    },

    /*
     * Reset default settings
     * => Called by <menuitem> in prefs.xul
     */
    defaultSettings: function () {
        let strings = Services.strings.createBundle("chrome://aios/locale/lib.properties");
        if (!confirm(strings.GetStringFromName("prefs.confirm")))
            return false;

        var childList = AiOS_HELPER.prefBranchAiOS.getChildList("");

        for (let i = 0; i < childList.length; i++) {
            if (AiOS_HELPER.prefBranchAiOS.prefHasUserValue(childList[i]) && childList[i] != "changelog") {
                AiOS_HELPER.prefBranchAiOS.clearUserPref(childList[i]);
            }
        }

        // Reset GUI elements
        AiOS_Prefs.reloadPreferences();

        // Activate/deactivate dependent elements
        AiOS_Prefs.checkDependent();

        return true;
    },

    /*
     * Copy settings to the clipboard or save as a text file
     * => Called by <menuitem> in prefs.xul
     */
    exportSettings: function (aMode) {
        let strings = Services.strings.createBundle("chrome://aios/locale/lib.properties");

        var now = new Date();
        var sDate = AiOS_Prefs.extendInt(now.getMonth() + 1) + "/" + AiOS_Prefs.extendInt(now.getDate()) + "/" + now.getFullYear();
        var sTtime = AiOS_Prefs.extendInt(now.getHours()) + ":" + AiOS_Prefs.extendInt(now.getMinutes()) + ":" + AiOS_Prefs.extendInt(now.getSeconds());
        var sGMT = now.toGMTString();

        var aiosExport = [];
        aiosExport[0] = "-----------------------------------------------------------------------\n";
        aiosExport[0] += "                  Classic Sidebar - Settings\n";
        aiosExport[0] += "-----------------------------------------------------------------------\n";
        aiosExport[0] += "          " + sDate + ", " + sTtime + " (" + sGMT + ")\n";
        aiosExport[0] += "          CS " + AiOS_HELPER.prefBranchAiOS.getCharPref("changelog") + ", " + AiOS_HELPER.appInfo.name + " " + AiOS_HELPER.appInfo.version + ", " + AiOS_HELPER.os + ", " + AiOS_HELPER.prefBranch.getCharPref("extensions.activeThemeID") + "\n";
        aiosExport[0] += "-----------------------------------------------------------------------";

        var childList = AiOS_HELPER.prefBranchAiOS.getChildList("");

        for (let i = 0; i < childList.length; i++) {
            switch (AiOS_HELPER.prefBranchAiOS.getPrefType(childList[i])) {
            case AiOS_HELPER.prefInterface.PREF_BOOL:
                aiosExport[i + 1] = childList[i] + "=" + AiOS_HELPER.prefBranchAiOS.getBoolPref(childList[i]);
                break;
            case AiOS_HELPER.prefInterface.PREF_INT:
                aiosExport[i + 1] = childList[i] + "=" + AiOS_HELPER.prefBranchAiOS.getIntPref(childList[i]);
                break;
            case AiOS_HELPER.prefInterface.PREF_STRING:
                aiosExport[i + 1] = childList[i] + "=" + AiOS_HELPER.prefBranchAiOS.getCharPref(childList[i]);
                break;
            }
        }

        // Sort settings alphabetically
        aiosExport.sort();

        // Create string
        var aiosExportString = "";
        for (let i = 0; i < aiosExport.length; i++) {
            aiosExportString += aiosExport[i] + "\n";
        }

        // Copy the string to the clipboard
        if (aMode == "copy") {
            var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
            gClipboardHelper.copyString(aiosExportString);

            alert(strings.GetStringFromName("prefs.copy"));
        }

        // Save the string to a text file (Thanks to AdBlock & Tab Mix Plus :-))
        else if (aMode == "save") {
            var nsIFilePicker = Components.interfaces.nsIFilePicker;
            var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
            var stream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

            fp.init(window, strings.GetStringFromName("prefs.save"), fp.modeSave);
            fp.defaultExtension = "txt";
            fp.defaultString = "CS-Settings";
            fp.appendFilters(fp.filterText);

            fp.open(rv => {
                if (rv != nsIFilePicker.returnCancel) {
                    if (fp.file.exists())
                        fp.file.remove(true);
                    fp.file.create(fp.file.NORMAL_FILE_TYPE, 0o666);
                    stream.init(fp.file, 0x02, 0x200, null);

                    stream.write(aiosExportString, aiosExportString.length);
                    stream.close();
                    return;
                }
            });
        }
    },

    /*
     * Import settings from text file
     * => Called by <menuitem> in prefs.xul
     */
    importSettings: async function () {
        let strings = Services.strings.createBundle("chrome://aios/locale/lib.properties");
        var pattern = await AiOS_Prefs.loadFromFile();

        if (!pattern)
            return false;

        var aiosImport = [];
        var appendFilters = null;
        let isMatch = false;

        // Check if it matches CS/AiOS pattern
        if (pattern[1].indexOf("Classic Sidebar - Settings") >= 0)
            isMatch = true;
        if (pattern[1].indexOf("All-in-One Sidebar - Settings") >= 0 || pattern[1].indexOf("All-In-One Sidebar - Settings") >= 0)
            isMatch = true;

        if (!isMatch) {
            alert(strings.GetStringFromName("prefs.invalid"));
            return false;
        }

        if (!confirm(strings.GetStringFromName("prefs.import")))
            return false;

        for (let i = 6; i < pattern.length; i++) {
            var index = pattern[i].indexOf("=");

            if (index > 0) {
                aiosImport[i] = [];
                aiosImport[i].push(pattern[i].substring(0, index));
                aiosImport[i].push(pattern[i].substring(index + 1, pattern[i].length));
            }
        }

        if (isMatch) {
            for (let i = 6; i < aiosImport.length; i++) {
                switch (AiOS_HELPER.prefBranchAiOS.getPrefType(aiosImport[i][0])) {
                case AiOS_HELPER.prefInterface.PREF_BOOL:
                    AiOS_HELPER.prefBranchAiOS.setBoolPref(aiosImport[i][0], /true/i.test(aiosImport[i][1]));
                    break;
                case AiOS_HELPER.prefInterface.PREF_INT:
                    AiOS_HELPER.prefBranchAiOS.setIntPref(aiosImport[i][0], aiosImport[i][1]);
                    break;
                case AiOS_HELPER.prefInterface.PREF_STRING:
                    var pref = aiosImport[i][1];
                    if (pref.indexOf("\"") == 0) // In the previous version we use " " for string
                        pref = pref.substring(1, pref.length - 1);
                    AiOS_HELPER.prefBranchAiOS.setCharPref(aiosImport[i][0], pref);
                    break;
                }
            }

            // Reset GUI elements
            AiOS_Prefs.reloadPreferences();

            // Activate/deactivate dependent elements
            AiOS_Prefs.checkDependent();

            return true;
        }

        alert(strings.GetStringFromName("prefs.failed"));
        return false;
    },

    /*
     * Read text file into an array (Thanks to AdBlock & Tab Mix Plus :-))
     * => Called by aios_importSettings()
     */
    loadFromFile: function () {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);
        var stream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        var streamIO = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);

        let strings = Services.strings.createBundle("chrome://aios/locale/lib.properties");

        fp.init(window, strings.GetStringFromName("prefs.open"), fp.modeOpen);
        fp.defaultExtension = "txt";
        fp.appendFilters(fp.filterText);

        return new Promise(resolve => {
            fp.open(rv => {
                if (rv != nsIFilePicker.returnCancel) {
                    stream.init(fp.file, 0x01, 0o444, null);
                    streamIO.init(stream);

                    var input = streamIO.read(stream.available());
                    streamIO.close();
                    stream.close();

                    var linebreak = input.match(/(((\n+)|(\r+))+)/m)[1]; // first: whole match -- second: backref-1     --  etc..
                    resolve(input.split(linebreak));
                }
                else {
                    resolve(null);
                }
            });
       });
    },

    /*
     * Check for dependent elements
     * => Called by aios_initPrefs(), aios_defaultPrefs() and aios_importSettings()
     */
    checkDependent: function () {
        var childObserver = document.getElementsByAttribute("oncommand", "AiOS_Prefs.checkboxObserver(this);");

        for (let i = 0; i < childObserver.length; i++) {
            AiOS_Prefs.checkboxObserver(childObserver[i]);
        }
    },

    /*
     * Activate/deactivate dependent checkboxes
     * => Called through the parent checkbox and aios_checkDependent()
     */
    checkboxObserver: function (which) {
        var observe = which.getAttribute("aiosChilds");
        var allChilds = observe.split(",");

        for (let i = 0; i < allChilds.length; i++) {
            var childPref = allChilds[i].replace(/ /, "");

            var child = document.getElementsByAttribute("preference", childPref);
            if (child.length == 0)
                child = document.getElementsByAttribute("id", childPref);

            var invert = false;
            if (childPref.includes("!")) {
                child = document.getElementsByAttribute("preference", childPref.substr(1));
                if (child.length == 0)
                    child = document.getElementsByAttribute("id", childPref.substr(1));
                invert = true;
            }

            if (child[0]) {
                if (((!aios_getBoolean(which, "checked") || aios_getBoolean(which, "disabled")) && !invert) || (aios_getBoolean(which, "checked") && invert))
                    child[0].setAttribute("disabled", true);
                else
                    child[0].removeAttribute("disabled");
            }
        }
    },

    /*
     * Return numbers with leading zero
     * => Called by aios_exportSettings()
     */
    extendInt: function (aInput) {
        if (aInput < 10)
            return "0" + aInput.toString();
        else
            return aInput;
    },

    /*
     * Saves the index of the last selected tab into the prefpane's "seltab" attribute
     * => Called by the onclick event of the tab containers
     */
    rememberSelectedTab: function (which) {
        which.parentNode.parentNode.setAttribute("seltab", which.selectedIndex);
    },

    /*
     * Reloads the preferences presented in the user interface with updated values
     * => Called by aios_defaultSettings() and aios_importSettings()
     */
    reloadPreferences: function () {
        var val;
        var prefs = document.getElementsByTagName("preference");

        for (let i = 0; i < prefs.length; i++) {
            var prefID = prefs[i].getAttribute("id");
            var prefType = prefs[i].getAttribute("type");
            var prefName = prefs[i].getAttribute("name").replace(/extensions.aios./, "");

            var elem = document.getElementsByAttribute("preference", prefID)[0];

            switch (prefType) {
            case "int":
                val = AiOS_HELPER.prefBranchAiOS.getIntPref(prefName);
                break;
            case "string":
                val = AiOS_HELPER.prefBranchAiOS.getCharPref(prefName);
                break;
            case "bool":
                val = AiOS_HELPER.prefBranchAiOS.getBoolPref(prefName);
                break;
            }

            if (elem) {
                switch (elem.tagName) {
                case "checkbox":
                    elem.checked = val;
                    break;
                case "textbox":
                    elem.value = val;
                    break;
                case "menulist":
                    elem.value = val;
                    break;
                }
            }
        }
    },

    /*
     * Apply settings of some options directly
     * => Called by button "accept" and aios_applyPrefs()
     */
    savePrefs: function () {
        aios_setConfSidebarWidth();

        var enumerator = AiOS_HELPER.windowMediator.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            var win = enumerator.getNext();

            // Set tooltip for PanelTab button
            if (win.document.getElementById("paneltab-button")) {
                var ptReverse = AiOS_HELPER.prefBranchAiOS.getBoolPref("paneltab.reverse");
                var ptTooltip = (ptReverse) ? "paneltab-tooltip-reverse" : "paneltab-tooltip";
                win.document.getElementById("paneltab-button").setAttribute("tooltip", ptTooltip);
            }

            if (win.aios_setTargets)
                win.aios_setTargets();

            win.AiOS.checkSidebarSwitch();
            if (win.AiOS.setSidebarOrient)
                win.AiOS.setSidebarOrient();
            if (win.aios_initAutohide)
                win.aios_initAutohide();

            var switchDrag = AiOS_HELPER.prefBranchAiOS.getBoolPref("gen.switch.drag");
            var switchDragDelay = AiOS_HELPER.prefBranchAiOS.getIntPref("gen.switch.dragdelay");

            // We might incur a performance hit if we do this dynamically
            if (switchDrag)
                win.AiOS_Objects.sbSwitch.setAttribute("ondragenter", "window.setTimeout(function() { AiOS.toggleSidebar('switch', true); event.stopPropagation(); }, " + switchDragDelay + ");");
            else
                win.AiOS_Objects.sbSwitch.setAttribute("ondragenter", "");
        }

        // Bugfix:
        // Otherwise the context menu of the extension is displayed,
        // when the options have been right-clicked and the Apply button is clicked
        if (opener.document.getElementById("extensionContextMenu"))
            opener.document.getElementById("extensionContextMenu").hidePopup();
    },

    /*
     * Apply modified preferences without closing the dialog
     * => Called by button "extra1"
     */
    applyPrefs: function () {
        var pType,
            pName,
            pValue;

        // Save prefs directly
        var allPrefs = Preferences.getAll();
        for (let i = 0; i < allPrefs.length; i++) {
            pType = allPrefs[i].type;
            pName = allPrefs[i].name;
            pValue = allPrefs[i].value;

            switch (pType) {
            case "string":
                AiOS_HELPER.prefBranch.setCharPref(pName, pValue);
                break;
            case "bool":
                AiOS_HELPER.prefBranch.setBoolPref(pName, pValue);
                break;
            case "int":
                AiOS_HELPER.prefBranch.setIntPref(pName, pValue);
                break;
            }
        }

        // Additional options
        AiOS_Prefs.savePrefs();

        // Disable the Apply button
        AiOS_Prefs.disableApplyButton(true);

        // Remember prefs, is required for the Apply button => aios_checkApply()
        AiOS_Prefs.rememberOldPrefs();

        // Save prefs directly to file
        AiOS_HELPER.prefService.savePrefFile(null);
    },

    /*
     * Activate/deactivate the Apply button
     * => Called by aios_initPrefs(), aios_applyPrefs() and aios_checkApply()
     */
    disableApplyButton: function (aDis) {
        if (document.documentElement.getButton("extra1")) {
            document.documentElement.getButton("extra1").setAttribute("disabled", aDis);
        }

        if (aDis)
            AiOS_Prefs._couldApply = "";
    },

    /*
     * Remember prefs before they are changed; this is required for the Apply button
     * => Called by aios_initPrefs() and aios_applyPrefs()
     */
    rememberOldPrefs: function () {
        var allPrefs = document.querySelectorAll("[preference]");
        var oldValue;
        for (let i = 0; i < allPrefs.length; i++) {
            switch (allPrefs[i].tagName) {
                case "checkbox":
                    oldValue = allPrefs[i].checked;
                    allPrefs[i].addEventListener("click", function () {
                        AiOS_Prefs.checkApply(this);
                    });
                    break;
                case "menulist":
                    oldValue = allPrefs[i].value;
                    allPrefs[i].setAttribute("oncommand", "AiOS_Prefs.checkApply(this)");
                    break;
                case "html:input":
                    oldValue = allPrefs[i].value;
                    allPrefs[i].addEventListener("input", function () {
                        AiOS_Prefs.checkApply(this);
                    });
                    break;
            }
            allPrefs[i].setAttribute("oldValue", oldValue);
        }
    },

    /*
     * Check for options to be saved; used when deciding whether to activate/deactivate Apply button
     * => Called through all checkboxes, selcts, textboxes, etc by onchange handler - set by aios_rememberOldPrefs()
     */
    checkApply: function (aPref) {
        if (typeof aPref == "object") {
            var oldPref,
                newPref;
            var pID = aPref.getAttribute("preference");

            // Convert remembered and new settings to the correct format
            switch (aPref.tagName) {
                case "checkbox":
                    oldPref = aios_getBoolean(aPref, "oldValue");
                    newPref = aPref.checked;
                    break;
                case "menulist":
                    oldPref = aPref.getAttribute("oldValue") * 1;
                    newPref = aPref.value * 1;
                    break;
                default:
                    oldPref = aPref.getAttribute("oldValue")
                    newPref = aPref.value;
                    break;
            }
            // If the change corresponds to the old setting
            if (oldPref === newPref) {
                // Delete string accordingly
                if (AiOS_Prefs._couldApply.indexOf(pID) >= 0) {
                    var t1 = AiOS_Prefs._couldApply.substr(0, AiOS_Prefs._couldApply.indexOf(pID));
                    if (t1.indexOf(",") == 0)
                        t1 = t1.substr(1, t1.length); // Delete comma at the beginning
                    if (t1.lastIndexOf(",") == t1.length - 1)
                        t1 = t1.substr(0, t1.length - 1); // Delete comma at the end

                    var t2 = AiOS_Prefs._couldApply.substr(AiOS_Prefs._couldApply.indexOf(pID) + pID.length, AiOS_Prefs._couldApply.length);
                    if (t2.indexOf(",") == 0)
                        t2 = t2.substr(1, t2.length); // Delete comma at the beginning
                    if (t2.lastIndexOf(",") == t2.length - 1)
                        t2 = t2.substr(0, t2.length - 1); // Delete comma at the end

                    if (t2.length > 0)
                        t1 += ","; // Connect with comma
                    AiOS_Prefs._couldApply = t1 + t2;
                }
                // alert("No change: " + AiOS_Prefs._couldApply);
            }
            // If the change does _not_ correspond to the old setting
            else {
                // Extend string accordingly
                if (AiOS_Prefs._couldApply.length > 0)
                    AiOS_Prefs._couldApply += ","; // Connect with comma
                AiOS_Prefs._couldApply += pID;
                // alert("Modification: " + AiOS_Prefs._couldApply);
            }

            // Activate/deactivate Apply button
            if (AiOS_Prefs._couldApply.length == 0)
                AiOS_Prefs.disableApplyButton(true);
            else
                AiOS_Prefs.disableApplyButton(false);
        }
    },

    /*
     * Remove old preferences due to version changes and move preference values when needed
     * => Called by aios_initPrefs()
     */
    deleteOldPrefs: function () {
        function migratePrefsFromObject(prefs, prefBranch) {
            // Migrate prefs to new values
            for (let obj in prefs) {
                if (prefBranch.prefHasUserValue(prefs[obj][0])) {
                    for (let i = 1; i < prefs[obj].length; i++) {
                        switch (prefBranch.getPrefType(prefs[obj][0])) {
                        case AiOS_HELPER.prefInterface.PREF_BOOL:
                            prefBranch.setBoolPref(prefs[obj][i], prefBranch.getBoolPref(prefs[obj][0]));
                            break;
                        case AiOS_HELPER.prefInterface.PREF_INT:
                            prefBranch.setIntPref(prefs[obj][i], prefBranch.getIntPref(prefs[obj][0]));
                            break;
                        case AiOS_HELPER.prefInterface.PREF_STRING:
                            prefBranch.setCharPref(prefs[obj][i], prefBranch.getCharPref(prefs[obj][0]));
                            break;
                        }
                    }
                }
            }
        }

        // Inner function to remove prefs from given array using given prefbranch
        function removePrefsFromArray(prefArray, prefBranch) {
            for (let i = 0; i < prefArray.length; i++) {
                if (prefBranch.prefHasUserValue(prefArray[i])) {
                    prefBranch.clearUserPref(prefArray[i]);
                }
            }
        }

        // List of preferences that need to be migrated
        let mgPrefs = {
            delay: ["gen.switch.delay", "gen.switch.delayshow", "gen.switch.delayhide"],
            invSwitch: ["gen.switch.invtrigger", "gen.switch.inv"]
        };

        migratePrefsFromObject(mgPrefs, AiOS_HELPER.prefBranchAiOS);

        // List of old preferences
        let oldPrefs = ["em.layout", "em.layoutall", "em.slim", "em.colors", "dm.slim",
            "dm.colors", "co.slim", "co.colors", "co.sidebar", "co.layout", "bm.layout", "bm.layoutall",
            "hi.layout", "hi.layoutall", "dm.observer", "gen.switch.delay",
            "gen.switch.invwidth", "gen.switch.invtrigger"];

        // Remove preferences defined in the oldPrefs array
        removePrefsFromArray(oldPrefs, AiOS_HELPER.prefBranchAiOS);

        if (AiOS_HELPER.usingCUI) {
            // Preference branch for duplicate preferences
            let duplicatePrefBranch = AiOS_HELPER.prefService.getBranch("extensions.aios.extensions.aios.");
            let duplicatePrefBranchList = duplicatePrefBranch.getChildList("");
            // Migrate prefs from duplicated ones
            let toMigrate = {};
            for (let i = 0; i < duplicatePrefBranchList.length; i++) {
                toMigrate[i] = ["extensions.aios." + duplicatePrefBranchList[i], duplicatePrefBranchList[i]];
            }
            migratePrefsFromObject(toMigrate, AiOS_HELPER.prefBranchAiOS);
            // Remove preferences that were duplicated in the final AiOS version
            removePrefsFromArray(duplicatePrefBranchList, duplicatePrefBranch);
        }
    },
};

Preferences.addAll([
    // G E N E R A L
    { id: "extensions.aios.gen.orient", type: "int" },

    { id: "extensions.aios.gen.width.minVal", type: "int" },
    { id: "extensions.aios.gen.width.minUnit", type: "string" },

    { id: "extensions.aios.gen.width.defVal", type: "int" },
    { id: "extensions.aios.gen.width.defUnit", type: "string" },

    { id: "extensions.aios.gen.width.maxVal", type: "int" },
    { id: "extensions.aios.gen.width.maxUnit", type: "string" },

    { id: "extensions.aios.gen.init", type: "string" },
    { id: "extensions.aios.gen.toolbar.init", type: "int" },
    { id: "extensions.aios.gen.switch.init", type: "int" },

    { id: "extensions.aios.gen.open.init", type: "string" },

    { id: "extensions.aios.fs.sidebar", type: "bool" },
    { id: "extensions.aios.fs.toolbar", type: "bool" },
    { id: "extensions.aios.fs.switch", type: "bool" },
    { id: "extensions.aios.fs.restore", type: "bool" },

    { id: "extensions.aios.cmode.key", type: "int" },
    { id: "extensions.aios.cmode.switch", type: "int" },
    { id: "extensions.aios.cmode.tbb", type: "int" },
    { id: "extensions.aios.cmode.close", type: "int" },

    { id: "extensions.aios.collapse", type: "bool" },
    { id: "extensions.aios.intercept", type: "bool" },


    // S I D E B A R  S W I T C H
    { id: "extensions.aios.gen.switch.autoshow", type: "bool" },
    { id: "extensions.aios.gen.switch.onlymax", type: "bool" },
    { id: "extensions.aios.gen.switch.delayshow", type: "int" },
    { id: "extensions.aios.gen.switch.delayhide", type: "int" },
    { id: "extensions.aios.gen.switch.hidemethod", type: "int" },
    { id: "extensions.aios.gen.switch.width", type: "int" },
    { id: "extensions.aios.gen.switch.twidth", type: "int" },
    { id: "extensions.aios.gen.switch.thin", type: "bool" },
    { id: "extensions.aios.gen.switch.thinmax", type: "bool" },
    { id: "extensions.aios.gen.switch.inv", type: "bool" },
    { id: "extensions.aios.gen.switch.invmax", type: "bool" },
    { id: "extensions.aios.gen.switch.invhover", type: "bool" },
    { id: "extensions.aios.gen.switch.invmouse", type: "bool" },
    { id: "extensions.aios.gen.switch.invnoclick", type: "bool" },
    { id: "extensions.aios.gen.switch.visibility", type: "int" },

    { id: "extensions.aios.gen.switch.drag", type: "bool" },
    { id: "extensions.aios.gen.switch.dragdelay", type: "int" },

    // P A N E L S
    { id: "extensions.aios.dm.sidebar", type: "bool" },
    { id: "extensions.aios.dm.popup", type: "bool" },
    { id: "extensions.aios.dm.layout", type: "bool" },
    { id: "extensions.aios.dm.autoopen", type: "bool" },
    { id: "extensions.aios.dm.autoclose", type: "bool" },
    { id: "extensions.aios.dm.count", type: "bool" },
    { id: "extensions.aios.dm.shading", type: "bool" },

    { id: "extensions.aios.em.sidebar", type: "bool" },
    { id: "extensions.aios.em.count", type: "bool" },
    { id: "extensions.aios.em.oninstall", type: "bool" },

    { id: "extensions.aios.bm.sidebar", type: "bool" },
    { id: "extensions.aios.hi.sidebar", type: "bool" },
    { id: "extensions.aios.pi.sidebar", type: "bool" },
    { id: "extensions.aios.pi.layout", type: "bool" },

    { id: "extensions.aios.mp.sidebar", type: "bool" },

    { id: "extensions.aios.ks.sidebar", type: "bool" },
    { id: "extensions.aios.ks.layout", type: "bool" },

    { id: "extensions.aios.paneltab.reverse", type: "bool" },
    { id: "extensions.aios.paneltab.bm", type: "bool" },


    // M E N U S
    { id: "extensions.aios.menus.sidebar.entrydeac", type: "bool" },
    { id: "extensions.aios.menus.sidebar.entries", type: "bool" },
    { id: "extensions.aios.menus.sidebar.icons", type: "bool" },
    { id: "extensions.aios.menus.sidebar.paneltab1", type: "bool" },
    { id: "extensions.aios.menus.sidebar.paneltab2", type: "bool" },
    { id: "extensions.aios.menus.sidebar.showhide", type: "bool" },
    { id: "extensions.aios.menus.sidebar.prefs", type: "bool" },

]);
