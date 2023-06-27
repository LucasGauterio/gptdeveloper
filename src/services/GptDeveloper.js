import Steps from './Steps.js'
import AI from './Ai.js'
import Databases from './Databases.js'
import preprompts from '../preprompts'

export default class GptDeveloper {
    constructor (config, apiKey, model, project, main_prompt) {
        this.status = { generating: false }
        this.apiKey = apiKey
        this.model = model
        this.project = project
        this.main_prompt = main_prompt
        
        this.ai = new AI(
            this.model,
            0.1,
            this.apiKey
        )

        this.steps = Steps.STEPS[config].map((step) => ({
            execute: step,
            fullfilled: false
        }))

        this.dbs = new Databases(
            {},
            {},
            {},
            {main_prompt},
            {...preprompts},
            {},
            {}
        )

    }
    
    async run() {
        this.status.generating = true
        if(!this.ai.modelValid){
            var message = await this.ai.validateModel()
            this.model =  this.ai.model
            if(message){
                this.status.generating = false
                return message;
            }
        }
        var step = this.steps.find(step => !step.fullfilled)
        if (step) {
            await step.execute(this.ai, this.dbs)
            if (await this.fullfillStep()) {
                await this.run()
            }
        }
    }

    async fullfillStep() {
        var messages = this.dbs.messages
        var lastMessage = messages[messages.length - 1]
        var step = this.steps.find(step => !step.fullfilled)
        if (lastMessage.content.toLowerCase().indexOf('?') === -1) {
            step.fullfilled = true
        } else {
            console.log('awaiting user input')
            this.awaiting = true
        }
        this.status.generating = this.steps.find(step => !step.fullfilled) !== undefined
        this.status.finished = this.steps.find(step => !step.fullfilled) === undefined
        return step.fullfilled
    }

    getMessages(){
        return this.dbs.messages
    }

    getPrompts(){
        return this.dbs.prompts
    }

    getWorkspace(){
        return this.dbs.workspace
    }

    getSteps(){
        return this.dbs.steps
    }
}