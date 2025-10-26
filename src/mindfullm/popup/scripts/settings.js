$(document).ready(() => {
    const getSettingInputs = (parentContainer) => {
        const settings = parentContainer.children(".setting");
        const settingInputs = settings.map(function() {
            const setting = $(this);
            const settingId = setting.attr("id");
            const settingInput = setting.children("input");
            return {
                [settingId]: settingInput
            };
        });
        return Object.assign({}, ...settingInputs);
    }

    const readSettingInputs = (settingInputs) => {
        let settingValues = [];
        for(const [id, input] of Object.entries(settingInputs)) {
            const inputType = input.attr("type");
            settingValues.push({
                [id]: inputType != "checkbox" ? input.val() : input.prop("checked") 
            });
        }
        return Object.assign({}, ...settingValues);
    }

    const loadSettings = (settingsInputs) => {
        readSettings().then((settingValues) => {
            for(const [id, input] of Object.entries(settingsInputs)) {
                const value = settingValues[id];
                const inputType = input.attr("type");
                inputType != "checkbox" ? input.val(value) : input.prop("checked", value);
            }
        });
    }

    const saveSettingsListener = (settingInputs) => {
        for(const [id, input] of Object.entries(settingInputs)) {
            input.on("change", function(e) {
                const settingValues = readSettingInputs(settingsInputs);
                chrome.storage.local.set(
                    settingValues
                );
            });
        }
    }
    
    const settingsContainer = $(".settings");
    const settingsInputs = getSettingInputs(settingsContainer);
    saveSettingsListener(settingsInputs);
    loadSettings(settingsInputs);
});
