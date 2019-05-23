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


    webview.setAttribute("src", linkUrl);
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
    
    divOptionContainer.style.height = "5%";
    divOptionContainer.style.width = "30px";
    divOptionContainer.style.margin = "auto";
    divOptionContainer.style.color = "white";
    divOptionContainer.innerHTML = getSvgContent();
    
    divContainer.appendChild(webview);
    divContainer.appendChild(divOptionContainer);

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

    const webpagecontainer = document.getElementsByClassName("active visible webpageview");
    // More than window open, have to be handled in some way as this will append to all of them 
    webpagecontainer[0].appendChild(divContainer);

    divContainer.addEventListener("click", function () {
        this.remove();
    });
}

// Creates context menu item for open in dialog tab
function createContextMenuOption() {
    var option = {
        "id": "dialog-tab",
        "title": "Open Link in Dialog Tab",
        "contexts": ["link"]
    };

    chrome.contextMenus.create(option);

    chrome.contextMenus.onClicked.addListener(function (itemInfo) {
        if (itemInfo.menuItemId === "dialog-tab") {
            dialogTab(itemInfo.linkUrl);
        }
    });
}

// Returns string type ellipses svg 
function getSvgContent() {
    return "<svg aria-hidden=\"true\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"ellipsis-h\" class=\"svg-inline--fa fa-ellipsis-h fa-w-16\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><path fill=\"currentColor\" d=\"M328 256c0 39.8-32.2 72-72 72s-72-32.2-72-72 32.2-72 72-72 72 32.2 72 72zm104-72c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72zm-352 0c-39.8 0-72 32.2-72 72s32.2 72 72 72 72-32.2 72-72-32.2-72-72-72z\"></path></svg>";
}