const sitesMapping = new StaticMapping(
    [
        (url) => /^https:\/\/(chatgpt\.com|chat\.com|chat.openai\.com)/i.test(url),
        "chatgpt"
    ],
    [
        "https://elm.edina.ac.uk/elm/elm",
        "elm"
    ]
);

const chatEnum = {
    DEBOUNCE_DELAY: 1000 //ms
}

$(document).ready(() => {
    function onLoaded(selector, callback) {
        const bodyObserver = new MutationObserver((mutations) => {
            const $element = $(selector);
            const element = $element.get(0)
            if(element) {
                bodyObserver.disconnect();
                callback($element);
            }
        });
        bodyObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        return bodyObserver;
    }

    function chatgptWatcher(...args) {
        const $chatContainer = args[0];
        const chatContainer = $chatContainer.get(0);
        
        const starterObserver = new MutationObserver(() => {
            chatWatcher(
                $chatContainer,
                (conversation) => {
                    const _conversation = conversation.map((message) => Object.assign({"conv_id": 0}, message));
                    console.log(_conversation);
                    chrome.storage.local.set({
                        "conversation": _conversation
                    });
                    starterObserver.disconnect();
                }
            );
        });
        
        starterObserver.observe(chatContainer, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        function chatWatcher($chatContainer, ...args) {
            const chatContainer = $chatContainer.get(0)
            let ongoingTimeout;

            const observer = new MutationObserver(() => {
                clearTimeout(ongoingTimeout);
                ongoingTimeout = setTimeout(() => {
                    captureChat($chatContainer, ...args);
                }, chatEnum.DEBOUNCE_DELAY);
            }); 

            observer.observe(chatContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }

        function captureChat(chatContainer, saveChat) {
            const messages = chatContainer.children(".text-token-text-primary")
            const conversation = messages.map(function() {
                const message = $(this);
                
                const role = message.data("turn");
                const content = message.children(".text-base").text();
                return {
                    "role": role,
                    "content": content
                };
            }).toArray();
            saveChat(conversation);
        }
    }

    function elmWatcher(...args) {
        const $chatSection = args[0];
        const chatSection = $chatSection.get(0);

        const starterObserver = new MutationObserver(() => {
            chatWatcher(
                $chatSection,
                (conversation) => {
                    const _conversation = conversation.map((message) => Object.assign({"conv_id": 0}, message));
                    console.log(_conversation);
                    chrome.storage.local.set({
                        "conversation": _conversation
                    });
                    starterObserver.disconnect();
                }
            );
        });
        
        starterObserver.observe(chatSection, {
            childList: true,
            subtree: true,
            characterData: true
        });

        function chatWatcher($parentSection, ...args) {
            const parentSection = $parentSection.get(0)
            const chatContainer = $parentSection.find("div.response-container");
            let ongoingTimeout;

            const observer = new MutationObserver(() => {
                clearTimeout(ongoingTimeout);
                ongoingTimeout = setTimeout(() => {
                    captureChat(chatContainer, ...args);
                }, chatEnum.DEBOUNCE_DELAY);
            }); 

            observer.observe(parentSection, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }

        function captureChat(chatContainer, saveChat) {
            const messages = chatContainer.children("div.response")
            const conversation = messages.map(function() {
                const message = $(this);
                const role = message.hasClass("response-ai") ? "assistant" : "user";
                const content = message.find(".markdown").text();
                return {
                    "role": role,
                    "content": content
                };
            }).toArray();
            saveChat(conversation);
        }
    }

    const site = sitesMapping.map(window.location.href)
    switch(site) {
        case "chatgpt":
            onLoaded(
                ".flex.flex-col.text-sm",
                chatgptWatcher
            );
        case "elm":
            onLoaded(
                "section.chat",
                elmWatcher
            );
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const endpoint = request.action;
    const payload = request.data;
    let success = false;
    switch(endpoint) {
        case "capturing/notification":
            const capturing = payload["capturing"];
            capturingNotification(capturing);
            success = true;
            break;
    }

    sendResponse({
        success: true,
        result: success
    });
    
    return true;
});

function capturingNotification(capturing) {
    console.log(capturing);
}
