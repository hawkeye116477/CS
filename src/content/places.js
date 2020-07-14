document.getElementById("search-box").parentNode.setAttribute("id", "places-toolbar");

var AiOS_Places = {
    get mode() {
        return (document.getElementById("bookmarksPanel")) ? "bookmarks" : "history";
    },
    get managerWindow() {
        if (this.mode == "bookmarks")
            return document.getElementById("bookmarksPanel");
        return document.getElementById("history-panel");
    },
    get managerTree() {
        if (this.mode == "bookmarks")
            return document.getElementById("bookmarks-view");
        return document.getElementById("historyTree");
    },
    get treeBoxObject() {
        return this.managerTree;
    },
    get searchObj() {
        return document.getElementById("search-box");
    },
    // Initialization
    init: function () {
        var self = AiOS_Places,
            isInSidebar = (top.document.getElementById("sidebar-box")) ? true : false;

        self.checkFolderOptions();

        // Add the separator and the three menu items to the "Tools" menu
        if (self.mode === "history") {
            var viewButton = document.getElementById("viewButton"),
                popUp = viewButton.firstChild;

            popUp.appendChild(document.getElementById("close-separator"));

            popUp.appendChild(document.getElementById("aios-enableAutoClose"));
            popUp.appendChild(document.getElementById("aios-rememberFolder"));
            popUp.appendChild(document.getElementById("aios-scrollToFolder"));
            popUp.appendChild(document.getElementById("aios-duplicateList"));

            popUp.appendChild(document.getElementById("close-separator").cloneNode(true));

            popUp.appendChild(document.getElementById("aios-viewClose"));

            viewButton.removeAttribute("accesskey");
            viewButton.removeChild(document.getElementById("viewPopUp"));
        }

        if (isInSidebar)
            self.setSidebarLayout();

        self.toggleSecondPane();
    },

    toggleSecondPane: function () {
        let self = AiOS_Places,
            isHidden = !aios_getBoolean(document.getElementById("aios-duplicateList"), "checked");
        document.getElementById("duplicateTree").hidden = isHidden;
        document.getElementById("duplicateSplitter").hidden = isHidden;

        if (self.mode == "history") {
            let options = PlacesUtils.history.getNewQueryOptions();
            options.resultType = Ci.nsINavHistoryQueryOptions.RESULTS_AS_DATE_QUERY;
            options.includeHidden = false;
            document.getElementById("duplicateTree").load(PlacesUtils.history.getNewQuery(), options);
        }
        if (self.mode == "bookmarks") {
            document.getElementById("duplicateTree").place = "place:type=" + Ci.nsINavHistoryQueryOptions.RESULTS_AS_ROOTS_QUERY;
            // Modifications to be compatible with 2 Pane Bookmarks
            if (typeof Bookmarks2PaneService == "object") {
                isHidden = true;
                document.getElementById("aios-duplicateList").hidden = true;
            }
        }
    },

    checkFolderOptions: function () {
        var self = AiOS_Places,
            lastRowToSelect,
            lastFolderPref = (self.mode == "bookmarks") ? "lastBookmarkFolder" : "lastHistoryFolder",
            options = (aios_getBoolean("aios-enableAutoClose", "checked") || aios_getBoolean("aios-rememberFolder", "checked") || aios_getBoolean("aios-scrollToFolder", "checked"));

        if (options) {
            self.managerTree.addEventListener("click", self.closeOtherFolders);

            // Mark last opened folder
            if (aios_getBoolean("aios-rememberFolder", "checked")) {
                if (AiOS_HELPER.prefBranchAiOS.prefHasUserValue(lastFolderPref)) {
                    lastRowToSelect = AiOS_HELPER.prefBranchAiOS.getIntPref(lastFolderPref);

                    window.setTimeout(function () {
                        AiOS_Places.selectFolder(lastRowToSelect);
                    }, 10);

                }

            }
        } else {
            self.managerTree.removeEventListener("click", self.closeOtherFolders);
        }
    },

    toggleButton: function (aElem) {
        document.getElementById(aElem.getAttribute("data-dependent")).setAttribute("hidden", !aios_getBoolean(aElem, "checked"));
    },

    setSidebarLayout: function () {
        var self = AiOS_Places;

        // For CSS purposes
        AiOS_HELPER.rememberAppInfo(self.managerWindow);

        // Enable CSS
        self.managerWindow.setAttribute("aios-inSidebar", "true");

        // Replace Close Folder <button> with a <toolbar button>
        if (document.getElementById("closeFolder")) {
            var closeButton = document.getElementById("closeFolder"),
                closeAttr = closeButton.attributes,
                new_closeButton = document.createElement("toolbarbutton");

            // Remove old <button>
            closeButton.parentNode.removeChild(closeButton);

            // Take over all the attributes of the old button
            for (var i = 0; i < closeAttr.length; i++) {
                new_closeButton.setAttribute(closeAttr[i].name, closeAttr[i].value);
            }

            // Insert a new <toolbarbutton>
            self.searchObj.parentNode.appendChild(new_closeButton);
        }

        // Replace the Tools button <button> with a <toolbar button>
        if (document.getElementById("viewButton")) {
            var viewButton = document.getElementById("viewButton"),
                popUp = viewButton.firstChild.cloneNode(true),
                viewAttr = viewButton.attributes,
                new_viewButton = document.createElement("toolbarbutton");

            // Remove old <button>
            viewButton.parentNode.removeChild(viewButton);

            // Take over all the attributes of the old button
            for (var j = 0; j < viewAttr.length; j++) {
                new_viewButton.setAttribute(viewAttr[j].name, viewAttr[j].value);
            }

            // Insert a new <toolbarbutton>
            new_viewButton.appendChild(popUp);
            self.searchObj.parentNode.appendChild(new_viewButton);
        }
    },

    selectFolder: function (index) {
        var self = AiOS_Places;

        if (self.treeBoxObject.view.rowCount >= index) {
            self.treeBoxObject.view.selection.select(index);

            // Check if we really need to scroll
            if (aios_getBoolean("aios-scrollToFolder", "checked") && (self.treeBoxObject.view.rowCount > self.treeBoxObject.getPageLength())) {
                self.treeBoxObject.scrollToRow(index);
            }

            self.treeBoxObject.ensureRowIsVisible(index);
        }
    },

    closeOtherFolders: function (e) {
        // Ignore right-click
        if (e.button >= 2)
            return;

        var sidebarType = AiOS_Places.mode;

        var dotoggle = (e.button === 0); // If it was not a left click, just do the standard action
        var tree = AiOS_Places.managerTree;

        // If you click the + sign in front of the folder, then it should just open and the others are not closed
        var row = {},
            col = {},
            obj = {};
        var cell = tree.getCellAt(e.clientX, e.clientY, row, col, obj);
        if (cell.row === -1 || cell.childElt === "twisty") {
            return;
        }

        var x = {},
            y = {},
            w = {},
            h = {};
        tree.getCoordsForCellItem(row, tree.columns.getNamedColumn("title"), "image", x, y, w, h);
        var isLTR = (window.getComputedStyle(tree).direction === "ltr");
        var mouseInGutter = isLTR ? (e.clientX < x.value) : (e.clientX > x.value);

        var tboView = tree.view;
        var modifKey = (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey);
        row = tree.currentIndex;
        var isContainer = tboView.isContainer(row);
        if (dotoggle && isContainer && !modifKey) {
            // now the part that closes the other open folders
            var parents = [];
            // Now all upper folders of the current one are searched
            while (row !== -1) {
                parents.push(row);
                row = tboView.getParentIndex(row);
            }

            // Reverses order in the array
            parents.reverse();

            // Go through each line and test
            for (var i = tboView.rowCount - 1; i >= 0; i--) {
                if (parents.length > 0 && parents[parents.length - 1] === i) { // The top folders should do nothing, so should remain open
                    parents.pop();
                } else {
                    if (tboView.isContainer(i) && tboView.isContainerOpen(i)) {
                        // Other items that are folders should be closed
                        tboView.toggleOpenState(i);
                    }
                }
            }

            // If you want to scroll, but only if that is really necessary
            if (aios_getBoolean("aios-scrollToFolder", "checked") && (tboView.rowCount > tree.getPageLength())) {
                tree.scrollToRow(tree.currentIndex);
            }

            tree.ensureRowIsVisible(tree.currentIndex); // Scrolls to the index only when needed.

            if (aios_getBoolean("aios-rememberFolder", "checked")) {
                switch (sidebarType) {
                case "bookmarks":
                    AiOS_HELPER.prefBranchAiOS.setIntPref("lastBookmarkFolder", tree.currentIndex);
                    break;

                case "history":
                    AiOS_HELPER.prefBranchAiOS.setIntPref("lastHistoryFolder", tree.currentIndex);
                    break;
                }
            }
        }
    },

    closeAllFolders: function () {
        var aView = AiOS_Places.managerTree.view;

        // Last opened folder "forgotten"
        if (document.getElementById("bookmarksPanel"))
            AiOS_HELPER.prefBranchAiOS.clearUserPref("lastBookmarkFolder");
        else if (document.getElementById("history-panel"))
            AiOS_HELPER.prefBranchAiOS.clearUserPref("lastHistoryFolder");

        // Close the folder
        if (aView) {
            aView.batching(true);
            for (var i = aView.rowCount - 1; i >= 0; i--) {
                if (aView.isContainer(i) && aView.isContainerOpen(i))
                    aView.toggleOpenState(i);
            }
            aView.batching(false);
        }
    },

    // Clean up
    shutdown: function () {
        window.removeEventListener("DOMContentLoaded", AiOS_Places.init, false);
        window.removeEventListener("unload", AiOS_Places.shutdown);

        AiOS_Places.managerTree.removeEventListener("click", AiOS_Places.closeOtherFolders);
    }
};

// Register handlers
window.addEventListener("DOMContentLoaded", AiOS_Places.init, false);
window.addEventListener("unload", AiOS_Places.shutdown);
