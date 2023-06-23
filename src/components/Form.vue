<template>
    <v-container fluid flat>
        <v-row>
            <v-col cols="12">
                <v-form ref="form" @submit.prevent="submitForm" autocomplete="off">
                    <label>
                        This application asks you to input your Open AI API Key available at <a target="_blank" href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</a>
                    </label>
                    <v-text-field v-model="apiKey" label="API Key" required :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                        :type="show1 ? 'text' : 'password'" @click:append="show1 = !show1"></v-text-field>

                    <v-select v-model="selectedModel" :items="models" label="Select ChatGPT Model" required></v-select>

                    <v-text-field v-model="projectName" label="Software Project Name" required
                        :rules="projectNameRules"></v-text-field>

                    <v-textarea v-model="prompt" label="Software Functional Specification" required
                        :counter="1000"></v-textarea>

                    <v-btn :disabled="generating" @click.stop="generate" color="primary">Generate</v-btn>
                </v-form>
            </v-col>
        </v-row>
        <v-row v-if="generating">
            <v-col cols="12" sm="12" md="12">
                <v-progress-linear indeterminate height="4" color="secondary"></v-progress-linear>
            </v-col>
        </v-row>
    </v-container>
    <v-container fluid class="outputs">
        <v-row>
            <workspace :workspace="workspace" :folderName="projectName"></workspace>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card class="mt-2" v-for="output in outputs">
                    <v-card-title>{{ output.role }}</v-card-title>
                    <v-card-text>
                        <div v-for="line in output.lines">{{ line }}</div>
                        <v-text-field v-for="(question, index) in output.questions" :label="question"
                            v-model="answers[index]"></v-text-field>
                    </v-card-text>
                    <v-card-actions v-if="output.questions.length > 0">
                        <v-btn @click.stop="next(output.questions)" color="primary">Answer</v-btn>
                        <v-btn @click.stop="skip" color="primary">Skip</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
<style>
.outputs {
    background-color: lightgrey;
}
</style>
<script>
import Steps from '../services/Steps.js'
import AI from '../services/AI.js'
import Workspace from './Workspace.vue'
export default {
    components: { Workspace },
    data() {
        return {
            show1: false,
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,
            selectedModel: "gpt-3.5-turbo",
            models: ["gpt-3.5-turbo", "gpt-4"],
            projectName: "myproject",
            prompt: "create a HTML page saying: Hello World!",
            projectNameRules: [
                (v) =>
                    !!v ||
                    "Project name is required",
                (v) =>
                    (v && v.length >= 3 && v.length <= 30 && /^[a-zA-Z0-9]+$/.test(v)) ||
                    "Project name must be between 3 and 30 characters and contain only letters and numbers"
            ],
            ai: null,
            step: 0,
            outputs: [],
            answers: [],
            messages: [],
            workspace: {},
            generating: false,
        };
    },
    methods: {
        async generate() {
            this.outputs = [];
            this.answers = [];
            this.messages = [];
            if (this.$refs.form.validate()) {
                this.step = 0
                this.ai = new AI(
                    this.selectedModel,
                    0.1,
                    this.apiKey
                )
                await this.ai.validateModel()
                this.selectedModel = this.ai.model
                //console.log(this.ai)
                this.steps = Steps.STEPS["default"].map((step) => ({
                    execute: step,
                    fullfilled: false
                }))

                await this.runSteps(this.steps, this.ai, this.messages, this.workspace, this.prompt)

            }
        },
        async skip() {
            this.outputs = []
            console.log('skip')
            var step = this.steps.find(step => !step.fullfilled)
            step.fullfilled = true
            console.log('skip', this.steps)
            await this.runSteps(this.steps, this.ai, this.messages, this.workspace, "")
        },
        async fullfillStep() {
            console.log('continueProcessing', this.messages)
            var lastMessage = this.messages[this.messages.length - 1]
            this.addOutput(lastMessage)
            if (lastMessage.content.toLowerCase().indexOf('?') === -1) {
                var step = this.steps.find(step => !step.fullfilled)
                step.fullfilled = true
                return true
            } else {
                console.log('awaiting user input')
                this.awaiting = true
                return false
            }
        },
        async next(lines) {
            this.generating = true
            this.outputs = []
            if (this.answers.join('') === '') {
                this.skip();
            } else {
                var questionsAnswers = []
                lines.forEach((question, index) => questionsAnswers.push(
                    `${question} ${this.answers[index]}`
                ))
                var answer = `user clarifications:\n ${questionsAnswers.join('\n')}`;
                console.log(answer)
                await this.runSteps(this.steps, this.ai, this.messages, this.workspace, answer)
            }
            this.generating = false
        },
        async runSteps(steps, ai, messages, workspace, prompt) {
            this.generating = true
            var step = steps.find(step => !step.fullfilled)
            if (step) {
                var stepResult = await step.execute(ai, messages, workspace, prompt)
                console.log('stepResult', stepResult)
                this.messages = stepResult.messages
                this.workspace = stepResult.workspace
                this.generating = false
                if (await this.fullfillStep()) {
                    await this.runSteps(this.steps, this.ai, this.messages, this.workspace, this.prompt)
                }
            }
            this.generating = false
        },

        addOutput(message) {
            var lines = []
            var questions = []
            if (message.content.indexOf('?') > -1) {
                questions = questions.concat(message.content.split('\n').slice(1))
            } else {
                var localMessage = message.content.length > 2 ? message.content.substring(0, 2) : message.content
                if (localMessage.toLowerCase() !== 'no') {
                    lines = message.content.split('\n')
                }
            }
            if (lines.length > 0 || questions.length > 0) {
                this.outputs.push({
                    ...message, lines, questions
                })
            }
            console.log(this.outputs)
        },
    }
};
</script>