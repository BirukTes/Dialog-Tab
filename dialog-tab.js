setTimeout(function wait() {
    const browser = document.getElementById('browser');
    if (browser) {
        // Create a context menu item to call on a link
        createContextMenuOption();
    }
    else {
        setTimeout(wait, 300);
    }
}, 300);

// Opens a link in a dialog like display in the current visible tab
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

    webview.addEventListener("loadstart", function () {
        this.style.backgroundColor = "white";
        var progress = document.getElementById("progressBar");
        progress.style.display = "block";

        if (document.getElementById("input-" + this.id) !== null) {
            document.getElementById("input-" + this.id).value = this.src;
        }
    });
    webview.addEventListener("loadstop", function () {
        document.getElementById("progressBar").style.display = "none";
    }); 
    webview.addEventListener("contentload", function (event) {
        console.log("content: ", event);
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
        showWebviewOptions(webviewId, divOptionContainer);
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

    progressBar.id = "progressBar";
    progressBar.style.height = "5px";
    progressBar.style.width = "10%";
    progressBar.style.backgroundColor = "#0080ff";
    progressBar.style.borderRadius = "5px";
    //#endregion

    progressBarContainer.appendChild(progressBar);
    divContainer.appendChild(divOptionContainer);
    divContainer.appendChild(webview);
    divContainer.appendChild(progressBarContainer);

    // Query for current tab and append divContainer
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        document.getElementById(tabs[0].id).parentElement.appendChild(divContainer);
    });
}

// Creates context menu item for open in dialog tab
function createContextMenuOption() {
    var propertiesLink = {
        "id": "dialog-tab-link",
        "title": "Open Link in Dialog Tab",
        "contexts": ["link"]
    };

    var propertiesSelection = {
        "id": "dialog-tab-select",
        "title": "Search with G in Dialog Tab",
        "contexts": ["selection"]
    };

    chrome.contextMenus.create(propertiesLink);
    chrome.contextMenus.create(propertiesSelection);

    chrome.contextMenus.onClicked.addListener(function (itemInfo) {
        if (itemInfo.menuItemId === "dialog-tab-link") {
            dialogTab(itemInfo.linkUrl);
        }

        if (itemInfo.menuItemId === "dialog-tab-select") {
            var gSearch = "https://www.google.com/search?q=" + (itemInfo.selectionText.replace(" ", "%20"));

            dialogTab(gSearch);
        }
    });
}

// Displays open in tab buttons and current url in input element
function showWebviewOptions(webviewId, thisElement) {
    var inputId = "input-" + webviewId;
    console.log((document.getElementById(inputId) === null), webviewId);
    if (document.getElementById(inputId) === null) {
        var webviewSrc = document.getElementById(webviewId).src;
        var input = document.createElement('input', 'text');
        var buttonNewTab = document.createElement('button');
        var buttonBackgroundTab = document.createElement('button');

        input.value = webviewSrc;
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

        thisElement.appendChild(buttonNewTab);
        thisElement.appendChild(buttonBackgroundTab);
        thisElement.appendChild(input);

        console.log(webviewSrc, thisElement);
    }
}

// Returns a random, verified id.
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

// Opens a new chrome tab with specified active boolean value
function openNewTab(inputId, active) {
    var url = document.getElementById(inputId).value;

    chrome.tabs.create({
        "url": url,
        "active": active
    });
}

// Returns string of ellipsis svg icon
function getEllipsisContent() {
    return "<svg id=\"optionsIco\" aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"ellipsis-h\" class=\"svg-inline--fa fa-ellipsis-h fa-w-16\" style=\"width: 25px;     vertical-align: middle; margin: 0 0.5rem;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z\"></path></svg>";
}

// Returns string of external link alt svg icon
function getNewtabContent() {
    return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"external-link-alt\" class=\"svg-inline--fa fa-external-link-alt fa-w-18\" style=\"width: 25px;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><path fill=\"currentColor\" d=\"M576 24v127.984c0 21.461-25.96 31.98-40.971 16.971l-35.707-35.709-243.523 243.523c-9.373 9.373-24.568 9.373-33.941 0l-22.627-22.627c-9.373-9.373-9.373-24.569 0-33.941L442.756 76.676l-35.703-35.705C391.982 25.9 402.656 0 424.024 0H552c13.255 0 24 10.745 24 24zM407.029 270.794l-16 16A23.999 23.999 0 0 0 384 303.765V448H64V128h264a24.003 24.003 0 0 0 16.97-7.029l16-16C376.089 89.851 365.381 64 344 64H48C21.49 64 0 85.49 0 112v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V287.764c0-21.382-25.852-32.09-40.971-16.97z\"></path></svg>";
}

// Returns string of external link square alt svg icon
function getBacktabContent() {
    return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"external-link-square-alt\" class=\"svg-inline--fa fa-external-link-square-alt fa-w-14\" style=\"width: 21px;\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><path fill=\"currentColor\" d=\"M448 80v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V80c0-26.51 21.49-48 48-48h352c26.51 0 48 21.49 48 48zm-88 16H248.029c-21.313 0-32.08 25.861-16.971 40.971l31.984 31.987L67.515 364.485c-4.686 4.686-4.686 12.284 0 16.971l31.029 31.029c4.687 4.686 12.285 4.686 16.971 0l195.526-195.526 31.988 31.991C358.058 263.977 384 253.425 384 231.979V120c0-13.255-10.745-24-24-24z\"></path></svg>";
}
