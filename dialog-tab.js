(function () {
    var searchEngineCollection;

    // Wait for the browser to come to a ready state
    setTimeout(function wait() {
        const browser = document.getElementById('browser');
        if (browser) {
            chrome.storage.local.get({
                'SEARCH_ENGINE_COLLECTION': {
                    engines: []
                }
            }, function (res) {
                searchEngineCollection = res.SEARCH_ENGINE_COLLECTION;

                // Create a context menu item to call on a link
                createContextMenuOption();
                // Setup keyboard shortcuts
                vivaldi.tabsPrivate.onKeyboardShortcut.addListener(keyCombo);
            });

            chrome.storage.local.onChanged.addListener(function (changes, namespace) {
                if (changes.SEARCH_ENGINE_COLLECTION) {
                    searchEngineCollection = changes.SEARCH_ENGINE_COLLECTION.newValue;
                    createOrRemoveContextMenuSelectSearch(changes.SEARCH_ENGINE_COLLECTION.oldValue)
                }
            });
        } else {
            setTimeout(wait, 300);
        }
    }, 300);


    /**
     * Creates context menu items to open dialog tab
     */
    function createContextMenuOption() {
        chrome.contextMenus.create({
            'id': 'dialog-tab-link',
            'title': '[Dialog Tab] Open Link',
            'contexts': ['link']
        });
        chrome.contextMenus.create({
            'id': 'search-dialog-tab',
            'title': '[Dialog Tab] Search for "%s"',
            'contexts': ['selection']
        });
        chrome.contextMenus.create({
            'id': 'select-search-dialog-tab',
            'title': '[Dialog Tab] Search with',
            'contexts': ['selection']
        });
        chrome.contextMenus.create({
            'id': 'media-dialog-tab',
            'title': '[Dialog Tab] View',
            'contexts': ['image', 'video', 'audio']
        });
        chrome.contextMenus.create({
            'id': 'page-dialog-tab',
            'title': '[Dialog Tab] Review',
            'contexts': ['page']
        });

        createContextMenuSelectSearch();

        chrome.contextMenus.onClicked.addListener(function (itemInfo) {
            chrome.windows.getLastFocused(function (window) {
                if (window.id === vivaldiWindowId && window.state !== 'minimized') {
                    if (itemInfo.menuItemId === "dialog-tab-link") {
                        dialogTab(itemInfo.linkUrl);
                    } else if (itemInfo.menuItemId === 'search-dialog-tab') {
                        var engineId = window.incognito ? searchEngineCollection.defaultPrivate : searchEngineCollection.default;
                        dialogTabSearch(engineId, itemInfo.selectionText);
                    } else if (itemInfo.parentMenuItemId === 'select-search-dialog-tab') {
                        var engineId = itemInfo.menuItemId.substr(itemInfo.parentMenuItemId.length);
                        dialogTabSearch(engineId, itemInfo.selectionText);
                    } else if (itemInfo.parentMenuItemId === 'media-dialog-tab') {
                        dialogTab(itemInfo.srcUrl);
                    } else if (itemInfo.parentMenuItemId === 'page-dialog-tab') {
                        dialogTab(itemInfo.pageUrl);
                    }
                }
            });
        });
    }

    /**
     * Creates sub-context menu items for select search engine menu item
     */
    function createContextMenuSelectSearch() {
        searchEngineCollection.engines.filter(e => e.removed !== true).forEach(function (engine) {
            chrome.contextMenus.create({
                'id': 'select-search-dialog-tab' + engine.id,
                'parentId': 'select-search-dialog-tab',
                'title': engine.name,
                'contexts': ['selection']
            });
        });
    }

    /**
     * Updates sub-context menu items for select search engine menu item
     * @param {Object} oldValue the value that is used as reference to old sub-menu items
     */
    function createOrRemoveContextMenuSelectSearch(oldValue) {
        oldValue.engines.filter(e => e.removed !== true).forEach(function (engine) {
            chrome.contextMenus.remove('select-search-dialog-tab' + engine.id);
        });
        createContextMenuSelectSearch();
    }

    /**
     * Prepares url for search, calls dailogTab function
     * @param {String} engineId engine id of the engine to be used
     * @param {int} selectionText the text to search
     */
    function dialogTabSearch(engineId, selectionText) {
        dialogTab(getEngine(engineId).url.replace(/%s/g, selectionText));
    }

    /**
     * Returns engine from the collection variable with matching id
     * @param {int} engineId engine id of the required engine
     */
    function getEngine(engineId) {
        return searchEngineCollection.engines.find(function (engine) {
            return engine.id === engineId;
        });
    }

    /**
     * Handle a potential keyboard shortcut (copy from KeyboardMachine)
     * @param {String} combination written in the form (CTRL+SHIFT+ALT+KEY)
     * @param {boolean} extras I don't know what this does, but it's an extra argument
     */
    function keyCombo(combination, extras) {
        const SHORTCUTS = {
            "Shift+Alt+Period": () => { // Open Default Search Engine in Dialog
                dialogTab(getEngine(searchEngineCollection.default).url.split("?")[0]);
            }
        };

        const customShortcut = SHORTCUTS[combination];
        if (customShortcut) {
            customShortcut();
        }
    }

    /**
     * Opens a link in a dialog like display in the current visible tab
     * @param {string} linkUrl the url to load
     */
    function dialogTab(linkUrl) {
        var webview = document.createElement("webview");
        var webviewId = "dialog-" + getWebviewId();
        var divOptionContainer = document.createElement("div");
        var divContainer = document.createElement("div");
        var progressBarContainer = document.createElement("div");
        var progressBar = document.createElement("div");

        //#region webview properties
        webview.setAttribute("src", linkUrl);
        webview.id = webviewId;
        webview.style.width = "80%";
        webview.style.height = "85%";
        webview.style.margin = "auto";
        webview.style.overflow = "hidden";
        webview.style.borderRadius = "10px";


        webview.addEventListener('permissionrequest',
            function (e) {
                // if (e.permission === 'media') {
                e.request.allow();
                // }
            });
        webview.addEventListener("loadstart", function () {
            this.style.backgroundColor = "white";
            document.getElementById("progressBar-" + webviewId).style.display = "block";

            if (document.getElementById("input-" + this.id) !== null) {
                document.getElementById("input-" + this.id).value = this.src;
            }
        });
        webview.addEventListener("loadstop", function () {
            // Inject code, to remove links with _blank 
            webview.executeScript({ code: "var links = document.querySelectorAll('a[target=\"_blank\"]'); console.log(links); for (var i = 0; i < links.length; i++) links[i].target = '';  console.log('links');" });
            document.getElementById("progressBar-" + webviewId).style.display = "none";
        });

        //#endregion 

        //#region divOptionContainer properties
        divOptionContainer.style.height = "4%";
        divOptionContainer.style.textAlign = "center";
        divOptionContainer.style.margin = "auto";
        divOptionContainer.style.color = "white";
        divOptionContainer.style.zIndex = "1160";
        divOptionContainer.innerHTML = getEllipsisContent();

        divOptionContainer.firstElementChild.addEventListener("mouseover", function () {
            showWebviewOptions(webview, divOptionContainer);
        });
        //#endregion

        //#region divContainer properties
        divContainer.setAttribute("class", "dialog-tab");
        divContainer.style.zIndex = "1060";
        divContainer.style.position = "fixed";
        divContainer.style.top = "0";
        divContainer.style.right = "0";
        divContainer.style.bottom = "0";
        divContainer.style.left = "0";
        divContainer.style.backgroundColor = "rgba(0,0,0,.4)";
        divContainer.style.transitionProperty = "background-color";
        divContainer.style.transitionDuration = "0.1s";
        divContainer.style.transitionTimingFunction = "ease";
        divContainer.style.transitionDelay = "0s";

        divContainer.addEventListener("click", function (event) {
            if (event.target === this) {
                this.remove();
            }
        });
        //#endregion

        //#region progressBarContainer properties
        progressBarContainer.style.width = "77%";
        progressBarContainer.style.margin = "1.3rem auto auto";

        progressBar.id = "progressBar-" + webviewId;
        progressBar.style.height = "5px";
        progressBar.style.width = "10%";
        progressBar.style.backgroundColor = "#0080ff";
        progressBar.style.borderRadius = "5px";
        //#endregion

        divContainer.appendChild(divOptionContainer);
        progressBarContainer.appendChild(progressBar);
        divContainer.appendChild(progressBarContainer);
        divContainer.appendChild(webview);

        // Get for current tab and append divContainer
        document.getElementsByClassName('active visible webpageview')[0].appendChild(divContainer);
    }

    /**
     * Displays open in tab buttons and current url in input element
     * @param {string} webview is the webview
     * @param {Object} thisElement the current instance divOptionContainer (div) element
     */
    function showWebviewOptions(webview, thisElement) {
        var inputId = "input-" + webview.id;
        console.log((document.getElementById(inputId) === null), webview.id);
        if (document.getElementById(inputId) === null) {
            var input = document.createElement('input', 'text');
            var buttonNewTab = document.createElement('button');
            var buttonBackgroundTab = document.createElement('button');
            var breakLine = document.createElement('br');
            var buttonBack = document.createElement('button');
            var buttonForward = document.createElement('button');

            input.value = webview.src;
            input.id = inputId;
            input.setAttribute("readonly", "");
            input.style.background = "transparent";
            input.style.color = "white";
            input.style.border = "unset";
            input.style.width = "20%";
            input.style.margin = "0 0.5rem 0 0.5rem";


            buttonNewTab.style.background = "transparent";
            buttonNewTab.style.margin = "0 0.5rem 0 0.5rem";
            buttonNewTab.style.border = "unset";
            buttonNewTab.innerHTML = getNewtabContent();
            buttonNewTab.addEventListener("click", function (event) {
                if (event.target === this || this.firstChild) {
                    openNewTab(inputId, true);
                }
            });

            buttonBackgroundTab.style.background = "transparent";
            buttonBackgroundTab.style.margin = "0 0.5rem 0 0.5rem";
            buttonBackgroundTab.style.border = "unset";
            buttonBackgroundTab.innerHTML = getBacktabContent();
            buttonBackgroundTab.addEventListener("click", function (event) {
                if (event.target === this || this.firstChild) {
                    openNewTab(inputId, false);
                }
            });

            buttonBack.style.background = "transparent";
            buttonBack.style.margin = "0 0.5rem 0 0.5rem";
            buttonBack.style.border = "unset";
            buttonBack.innerHTML = getBackBtnContent();
            buttonBack.addEventListener("click", function (event) {
                webview.back();
            });

            buttonForward.style.background = "transparent";
            buttonForward.style.margin = "0 0.5rem 0 0.5rem";
            buttonForward.style.border = "unset";
            buttonForward.innerHTML = getForwardBtnContent();
            buttonForward.addEventListener("click", function (event) {
                webview.forward();
            });

            thisElement.appendChild(buttonNewTab);
            thisElement.appendChild(buttonBackgroundTab);
            thisElement.appendChild(input);
            thisElement.appendChild(breakLine);
            thisElement.appendChild(buttonBack);
            thisElement.appendChild(buttonForward);

            console.log(webview.src, thisElement);
        }
    }

    /**
     * Returns a random, verified id.
     */
    function getWebviewId() {
        var tempId = 0;
        while (true) {
            if (document.getElementById("dialog-" + tempId) === null) {
                break;
            }
            tempId = Math.floor(Math.random() * 1000 + 1);
        }
        return tempId;
    }

    /**
     * Opens a new chrome tab with specified active boolean value
     * @param {string} inputId is the id of the input containing current url
     * @param {boolean} active indicates whether the tab is active or not (background tab)
     */
    function openNewTab(inputId, active) {
        var url = document.getElementById(inputId).value;

        chrome.tabs.create({
            "url": url,
            "active": active
        });
    }

    /**
     * Returns string of ellipsis svg icon
     */
    function getEllipsisContent() {
        return "<svg id=\"optionsIco\" aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"ellipsis-h\" class=\"svg-inline--fa fa-ellipsis-h fa-w-16\" style=\"width: 25px;     vertical-align: middle; margin: 0 0.5rem;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z\"></path></svg>";
    }

    /**
     *  Returns string of external link alt svg icon
     */
    function getNewtabContent() {
        return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"external-link-alt\" class=\"svg-inline--fa fa-external-link-alt fa-w-18\" style=\"width: 25px;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path fill=\"currentColor\" d=\"M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z\"></path></svg>";
    }

    /** 
     * Returns string of external link square alt svg icon
     */
    function getBacktabContent() {
        return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"external-link-square-alt\" class=\"svg-inline--fa fa-external-link-square-alt fa-w-14\" style=\"width: 21px;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><path fill=\"currentColor\" d=\"M448 80v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48zm-88 16H248.029c-21.313 0-32.08 25.861-16.971 40.971l31.984 31.987L67.515 364.485c-4.686 4.686-4.686 12.284 0 16.971l31.029 31.029c4.687 4.686 12.285 4.686 16.971 0l195.526-195.526 31.988 31.991C358.058 263.977 384 253.425 384 231.979V120c0-13.255-10.745-24-24-24z\"></path></svg>";
    }


    /** 
     * Returns string of chevron left svg icon
     */
    function getBackBtnContent() {
        return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"chevron-left\" class=\"svg-inline--fa fa-chevron-left fa-w-10\" style=\"width: 21px;\" role=\"img\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" viewBox=\"0 0 320 512\"><path fill=\"currentColor\" d=\"M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z\"></path></svg>";
    }

    /** 
     * Returns string of chevron right svg icon
     */
    function getForwardBtnContent() {
        return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"chevron-right\" class=\"svg-inline--fa fa-chevron-right fa-w-10\" style=\"width: 21px;\" role=\"img\" xmlns=\"http:\/\/www.w3.org\/2000\/svg\" viewBox=\"0 0 320 512\"><path fill=\"currentColor\" d=\"M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z\"></path></svg>";
    }
})();