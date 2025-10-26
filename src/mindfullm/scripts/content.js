const chatEnum = {
    DEBOUNCE_DELAY: 1000 //ms
}

$(document).ready(() => {
    const bodyObserver = new MutationObserver((mutations) => {
        const $chatSection = $("section.chat");
        const chatSection = $chatSection.get(0)
        if(chatSection) {
            bodyObserver.disconnect();
            main($chatSection)
        }
    });
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    function main(...args) {
        const $chatSection = args[0];
        const chatSection = $chatSection.get(0);

        const starterObserver = new MutationObserver(() => {
            chatWatcher(
                $chatSection,
                (conversation) => {
                    const _conversation = conversation.map((message) => Object.assign({"conv_id": 0}, message));
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
        })

    }

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
        console.log(messages.get(0), messages.get(1));
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
