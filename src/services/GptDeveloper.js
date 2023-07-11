import Steps from './Steps.js'
import AI from './Ai.js'
import Databases from './Databases.js'
import preprompts from '../preprompts'

export default class GptDeveloper {
    constructor (history, selectedProject, config, apiKey, model, project, main_prompt) {
        this.history = history,
        this.selectedProject = selectedProject,
        this.status = { generating: false, finished: false }
        this.apiKey = apiKey
        this.model = model
        if(this.selectedProject){
            let projectNameSplit = project.split('_version')
            let projectVersion = (projectNameSplit[1] ? parseInt(projectNameSplit[1]) : 1) + 1
            this.project = this.selectedProject.project === project ? `${projectNameSplit[0]}_version${(projectVersion)}` : project
        }else{
            this.project = project
        }
        this.main_prompt = main_prompt
        
        this.ai = new AI(
            this.model,
            0.1,
            this.apiKey
        )

        this.steps = Steps.STEPS[config].map((step) => ({
            name: step.name,
            execute: step,
            fullfilled: false
        }))

        this.dbs = new Databases(
            this.model,
            this.apikey,
            this.config,
            this.project,
            this.selectedProject ? this.selectedProject.memory : {},
            this.selectedProject ? this.selectedProject.messages : {},
            {main_prompt},
            {...preprompts},
            this.selectedProject ? this.selectedProject.workspace : {},
        )

    }
    
    async run() {
        this.history.add(this.dbs)
        this.status.finished = this.steps.find(step => !step.fullfilled) === undefined
        this.status.generating = !this.status.finished
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
            if(await this.fullfillStep()){
                this.status.finished = this.steps.find(step => !step.fullfilled) === undefined
                this.status.generating = !this.status.finished
                if (this.status.generating) {
                    await this.run()
                }
            }
        }
    }

    async fullfillStep() {
        var messages = this.dbs.messages
        var lastMessage = messages[messages.length - 1]
        var step = this.steps.find(step => !step.fullfilled)
        var needsClarification = (step.name === 'clarify' && lastMessage.content.toLowerCase().indexOf('?') > -1)
        if (!needsClarification) {
            step.fullfilled = true
        } else {
            console.log('awaiting user input')
            this.awaiting = true
        }
        this.history.add(this.dbs)

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

    currentStep(){
        return this.steps.find(step => !step.fullfilled)
    }
}