export default class Databases {

    constructor(memory, files, messages, prompts, preprompts, workspace, logs) {
        this.memory = memory;
        this.files = files;
        this.messages = messages;
        this.prompts = prompts;
        this.preprompts = preprompts;
        this.workspace = workspace;
        this.logs = logs;
    }

}