<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <v-form ref="form" @submit.prevent="submitForm">
                    <v-text-field v-model="apiKey" label="API Key" type="password" required></v-text-field>

                    <v-select v-model="selectedModel" :items="models" label="Select ChatGPT Model" required></v-select>

                    <v-text-field v-model="projectName" label="Software Project Name" required
                        :rules="projectNameRules"></v-text-field>

                    <v-textarea v-model="prompt" label="Software Functional Specification" required
                        :counter="1000"></v-textarea>

                    <v-btn :disabled="generating" @click.stop="generate" color="primary">Generate</v-btn>
                </v-form>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-card v-for="output in outputs">
                    <v-card-title>{{ output.role }}</v-card-title>
                    <v-card-text>
                        <div v-for="line in output.lines">{{ line }}</div>
                        <v-text-field v-for="(question, index) in output.questions" :label="question"
                            v-model="answers[index]"></v-text-field>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn @click.stop="next(output.questions)" color="primary">Continue</v-btn>
                        <v-btn @click.stop="skip" color="primary">Skip</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
  
<script>
import Steps from '../services/Steps.js'
import AI from '../services/AI.js'
import { generateCodeFrame } from 'vue/compiler-sfc';
export default {
    data() {
        return {
            apiKey: "",
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
            outputs: [],
            answers: [],
            messages: [],
            workspace: {}
        };
    },
    methods: {
        async generate() {
            this.generating = true
            this.outputs = [];
            this.answers = [];
            this.messages = [];
            if (this.$refs.form.validate()) {

                this.ai = new AI(
                    this.selectedModel,
                    0.1,
                    this.apiKey
                )
                await this.ai.validateModel()
                this.selectedModel = this.ai.model
                //console.log(this.ai)
                this.steps = Steps.STEPS["default"]

                this.messages = await this.processStep(this.steps[0])

                this.continueProcessing(this.messages)

            }
            this.generating = false
        },
        async processStep(step) {
            var messages = await step(this.prompt, this.ai, this.messages)
            console.log(messages)
            return messages
        },
        continueProcessing(messages) {
            var lastMessage = messages[messages.length - 1]
            this.addOutput(lastMessage)
            if (lastMessage.content.toLowerCase().startsWith('no')) {
                console.log('continue processing')
                this.generateCode(this.ai, this.messages, this.workspace)
                return true
            } else {
                this.awaiting = true
                return false
            }
        },
        addOutput(message) {
            var lines = []
            var questions = []
            if (message.content.indexOf('?') > -1) {
                questions = questions.concat(message.content.split('\n').slice(1))
            } else {
                if (message.content.toLowerCase().startsWith('no')) {
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
        async next(lines) {
            this.generating = true
            this.outputs = []
            if (this.answers.join('') === '') {
                this.skip();
            } else {
                var questionsAnswers = []
                lines.forEach((question, index) => questionsAnswers.push(
                    `${question} ${this.answers[index]}`
                )
                )
                console.log(questionsAnswers)
                var answer = questionsAnswers.join('\n');
                console.log(answer)

                this.messages = await this.steps[1](answer, this.ai, this.messages)

                this.continueProcessing(this.messages)
            }
            this.generating = false
        },
        async skip() {
            this.outputs = []
            console.log('skip')
            //var messages = await this.steps[2].execute(this.prompt, this.ai)
            this.generateCode(this.ai, this.messages, this.workspace)
            //this.continueProcessing(messages)
        },
        async generateCode(ai, messages, workspace){
            
            this.messages = await this.steps[2](ai, messages, workspace)
        }

    }
};
</script>