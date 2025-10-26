importScripts("../modules/store.js")

// import {settingsEnum, readSettings} from "../modules/store.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const endpoint = request.action;
    // const payload = request.data;
    let success = false;
    switch(endpoint) {
        case "generate/form":
            generateForm();
            success = true;
            break;
    }

    sendResponse({
        success: true,
        result: success
    });

    return true;
});

async function generateForm() {
    readSettings().then(async (settingValues) => {
        const conversation = (await chrome.storage.local.get(["conversation"]))["conversation"];
        const requestBody = {
            "user_email": settingValues[settingsEnum.EMAIL_KEY],
            "num_mcq": settingValues[settingsEnum.MCQ_KEY],
            "num_open": settingValues[settingsEnum.OPEN_ENDED_KEY],
            "messages": conversation
        }
        return fetch("http://127.0.0.1:8000/receive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        }).then((response) => {
            console.log(response);
        });
    });
}
