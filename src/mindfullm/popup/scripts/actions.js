const evalNestedExpression = async (args) => {
    if(
        Array.isArray(args) && 
        args.length >= 1 &&
        args[0] instanceof Function
        ) {
        const [f, _args] = [args[0], args.slice(1)];
        return await f(..._args.map(evalNestedExpression));
    }
    else {
        return args;
    }
}

//triggers a form generation event
async function generateForm() {
    const response = await chrome.runtime.sendMessage({
        action: "generate/form",
        data: {}
    });
    return response;
}

//notifies of a change in capturing state
async function capturingNotification(input) {
    const capturing = (await input).prop("checked");
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const currentTab = tabs[0];
    const response = await chrome.tabs.sendMessage(currentTab.id, {
        action: "capturing/notification",
        data: {
            "capturing": capturing
        }
    });
    return response;   
}

$(document).ready(() => {
    const actionsMapping = {
        "generate": [generateForm],
        "capturing": [capturingNotification]
    };

    const getActionInputs = (mainContainer) => {
        const actions = mainContainer.find(".action");
        const actionInputs = actions.map(function() {
            const action = $(this);
            const actionId = action.attr("id");
            const actionButton = action.children("button, input");
            return {
                [actionId]: actionButton
            }
        });
        return Object.assign({}, ...actionInputs);
    }
    
    const actionsActivationListener = (actionInputs) => {
        for(const [id, input] of Object.entries(actionInputs)) {
            const actionCall = actionsMapping[id]
            const eventType = input.is("button") ? "click" : "change";
            input.on(eventType, function(e) {
                const action = $(this);
                evalNestedExpression(actionCall.toSpliced(1, 0, action)).then((success) => {
                    console.log(
                        `#${id} action ` + (success ? "succeeded" : "failed")  
                    );
                });
            });
        }
    }

    const mainContainer = $(".main-container");
    const actionInputs = getActionInputs(mainContainer);
    actionsActivationListener(actionInputs);
});
