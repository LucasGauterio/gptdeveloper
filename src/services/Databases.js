export default class Databases {

    constructor(model, apikey, config, project, memory, messages, prompts, preprompts, workspace) {
        this.model = model
        this.apikey = apikey
        this.config = config
        this.project = project
        this.memory = memory
        this.messages = messages
        this.prompts = prompts
        this.preprompts = preprompts
        this.workspace = workspace
    }

}