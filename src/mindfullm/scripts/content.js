// // content.js - Now with jQuery!

// class ConversationCapture {
//   constructor() {
//     this.conversations = [];
//     this.observer = null;
//     this.init();
//   }

//   init() {
//     // jQuery's document ready
//     $(document).ready(() => {
//       this.startObserving();
//     });
//   }

//   startObserving() {
//     const site = this.detectSite();
    
//     if (!site) {
//       console.log('Not on a supported LLM site');
//       return;
//     }

//     this.observer = new MutationObserver((mutations) => {
//       this.handleMutations(mutations, site);
//     });

//     this.observer.observe(document.body, {
//       childList: true,
//       subtree: true
//     });

//     console.log(`Started observing ${site}`);
//   }

//   detectSite() {
//     const hostname = window.location.hostname;
//     if(["chatgpt.com", "chat.com", "chat.openai.com"].some(url => hostname.includes(url))) { return 'chatgpt' };
//     return null;
//   }

//   handleMutations(mutations, site) {
//     const messages = this.extractMessages(site);
    
//     if (messages.length > 0) {
//       this.saveConversation(messages);
//     }
//   }

//   extractMessages(site) {
//     let messages = [];

//     if (site === 'chatgpt') {
//       console.log(site);
//       // Using jQuery selectors - much cleaner!
//       $('[data-message-author-role]').each(function() {
//         const $el = $(this);
//         const role = $el.attr('data-message-author-role');
//         const content = $el.find('.markdown').text() || $el.text();
        
//         messages.push({
//           role: role,
//           content: content.trim(),
//           timestamp: Date.now()
//         });
//       });
//     // } else if (site === 'claude') {
//     //   $('.message').each(function() {
//     //     const $el = $(this);
//     //     const isUser = $el.hasClass('user-message');
        
//     //     messages.push({
//     //       role: isUser ? 'user' : 'assistant',
//     //       content: $el.text().trim(),
//     //       timestamp: Date.now()
//     //     });
//     //   });
//     // }
//     return messages;
//   }

//   async saveConversation(messages) {
//     chrome.runtime.sendMessage({
//       type: 'SAVE_CONVERSATION',
//       data: {
//         messages: messages,
//         url: window.location.href,
//         timestamp: Date.now()
//       }
//     });
//   }
// }

// // Initialize when jQuery is ready
// $.ready(() => {
//   const capture = new ConversationCapture();
  
//   // Listen for requests
//   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.type === 'GET_CURRENT_CONVERSATION') {
//       const site = capture.detectSite();
//       const messages = capture.extractMessages(site);
//       sendResponse({ messages: messages });
//     }
//     return true;
//   });
// });

// importScripts("../modules/store.js")

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
        chatSection = args[0];
        chatWatcher(
            chatSection,
            (conversation) => {
                const _conversation = conversation.map((message) => Object.assign({"conv_id": 0}, message));
                chrome.storage.local.set({
                    "conversation": _conversation
                });
            }
        );
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
