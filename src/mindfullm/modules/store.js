const settingsEnum = {
    CAPTURING_KEY: "capturing",
    EMAIL_KEY: "email",
    MCQ_KEY: "mcq",
    OPEN_ENDED_KEY: "open-ended"
}
const settingIds = Object.values(settingsEnum);

const readSettings = async () => {
    return await chrome.storage.local.get(settingIds)
}

// export {settingsEnum, readSettings};
