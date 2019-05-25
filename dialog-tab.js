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
    var divOptionContainer = document.createElement("div");
    var divContainer = document.createElement("div");
    var webviewId = "dialog-" + getWebviewId();

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
        this.style.fontSize = "10rem";
        this.style.textAlign = "center";
        this.style.color = "grey";
        // May not be working
        this.textContent = "Loading...";
    });
    webview.addEventListener("loadstop", function () {
        this.textContent = "";
    });
    //#endregion 

    //#region divOptionContainer properties
    divOptionContainer.style.height = "5%";
    divOptionContainer.style.textAlign = "center";
    divOptionContainer.style.margin = "auto";
    divOptionContainer.style.color = "white";
    divOptionContainer.style.zIndex = "1160";
    divOptionContainer.innerHTML = getSvgContent();

    divOptionContainer.addEventListener("mouseover", showWebviewOptions(webviewId, divOptionContainer));
    //#endregion

    divContainer.appendChild(divOptionContainer);
    divContainer.appendChild(webview);

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

    // Query for current tab and append divContainer
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        document.getElementById(tabs[0].id).parentElement.appendChild(divContainer);
    });
}

// Creates context menu item for open in dialog tab
function createContextMenuOption() {
    var properties = {
        "id": "dialog-tab",
        "title": "Open Link in Dialog Tab",
        "contexts": ["link"]
    };

    chrome.contextMenus.create(properties);

    chrome.contextMenus.onClicked.addListener(function (itemInfo) {
        if (itemInfo.menuItemId === "dialog-tab") {
            dialogTab(itemInfo.linkUrl);
        }
    });
}

function showWebviewOptions(webviewId, thisElement) {
    var inputId = "input-" + webviewId;
    if (document.getElementById(inputId) === undefined) {
        var webviewSrc = document.getElementById(webviewId).src;
        var input = document.createElement('input', 'text');
        var buttonNewTab = document.createElement('button');
        var buttonBackgroundTab = document.createElement('button');

        input.style.background = "transparent";
        input.textContent = webviewSrc;
        input.id = inputId;
        buttonNewTab.style.background = "transparent";
        buttonBackgroundTab.style.background = "transparent";
        buttonNewTab.textContent = "New";
        buttonBackgroundTab.textContent = "Back";

        thisElement.appendChild(input);
        thisElement.appendChild(buttonNewTab);
        thisElement.appendChild(buttonBackgroundTab);

        console.log(webview.src, thisElement);
    }
}

// Returns a random, verified id. But it might possible to keep track of ids with global variable 
function getWebviewId() {
    var tempId = 0;
    while (document.getElementById("dialog-" + tempId) === undefined) {
        tempId = Math.floor(Math.random() * 1000 + 1);
    }
    return tempId;
}

function getSvgContent() {
    return "<svg id=\"optionsIco\" aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"ellipsis-h\" class=\"svg-inline--fa fa-ellipsis-h fa-w-16\" style=\"width: 30px\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z\"></path></svg>";
}

