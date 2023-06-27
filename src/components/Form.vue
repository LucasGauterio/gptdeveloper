<template>
    <v-container fluid class="page">
        <v-container class="page_items">
            <v-row v-if="status.generating">
                <v-col cols="12">
                    <v-progress-linear indeterminate height="4" color="secondary"></v-progress-linear>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
                    <v-expansion-panels v-model="expanded">
                        <v-expansion-panel value="1" title="Configuration">
                            <template v-slot:text>
                                <p>This application need your Open AI API Key available at </p>
                                <a target="_blank"
                                    href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</a>
                                <v-form ref="form" @submit.prevent="submitForm" autocomplete="off">
                                    <v-text-field v-model="apiKey" label="API Key" required
                                        :append-icon="showApikey ? 'mdi-eye' : 'mdi-eye-off'"
                                        :type="showApikey ? 'text' : 'password'"
                                        @click:append="showApikey = !showApikey"></v-text-field>

                                    <v-select v-model="selectedModel" :items="models" label="Select ChatGPT Model" required
                                        :rules="apiKeyRules"></v-select>

                                    <v-text-field v-model="projectName" label="Software Project Name" required
                                        :rules="projectNameRules"></v-text-field>

                                    <v-label>Prompt {{ showTokens ? "in tokens" : "" }}</v-label>
                                    <v-textarea v-if="!showTokens" v-model="prompt" required
                                        :append-icon="showTokens ? 'mdi-eye' : 'mdi-eye-off'"
                                        @click:append="showTokens = !showTokens">
                                        <template v-slot:counter>
                                            <div>Characters: {{ prompt.length }} Tokens: {{ detokens.length }}</div>
                                        </template>
                                    </v-textarea>
                                    <v-row class="ma-0 mb-5" v-if="showTokens">
                                        <v-col cols="11" class="tokens">
                                            <v-chip v-for="(detoken, index) in detokens" :key="index" class="token"
                                                :color="colors[index % colors.length]" label>
                                                {{ detoken }}
                                            </v-chip>
                                        </v-col>
                                        <v-col cols="1" class="text-right eye">
                                            <v-icon class="text-right eye" :icon="showTokens ? 'mdi-eye' : 'mdi-eye-off'"
                                                @click.stop="showTokens = !showTokens"></v-icon>
                                        </v-col>
                                    </v-row>
                                    <v-select v-model="selectedConfig" :items="configs" label="Select the process"
                                        required></v-select>

                                    <v-btn :disabled="status.generating" @click.stop="run" color="primary">Generate</v-btn>
                                </v-form>
                            </template>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-col>
            </v-row>
            <v-row v-if="Object.entries(workspace)">
                <v-col cols="12">
                    <v-expansion-panels v-model="expanded">
                        <v-expansion-panel value="2" title="Workspace">
                            <template v-slot:text>
                                <workspace :workspace="workspace" :folderName="projectName"></workspace>
                            </template>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12">
                    <v-expansion-panels v-model="expanded" class="console">
                        <v-expansion-panel value="3" title="Input" class="console">
                            <template v-slot:text>
                                <v-card class="mt-2" v-if="inputs.questions">
                                    <v-card-title>{{ inputs.role }}</v-card-title>
                                    <v-card-text>
                                        <v-text-field v-for="(question, index) in inputs.questions" :label="question"
                                            v-model="answers[index]"></v-text-field>
                                    </v-card-text>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn color="green" :disabled="this.answers.join('') === ''"
                                            @click.stop="next(inputs.questions)">Answer</v-btn>
                                        <v-btn color="orange" @click.stop="next()">Skip</v-btn>
                                    </v-card-actions>
                                </v-card>
                                <div v-if="!inputs.questions">The assistant doesn't need user input at the moment</div>
                            </template>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-col>
            </v-row>
        </v-container>
        <v-expansion-panels v-model="expanded">
            <v-expansion-panel value="4" title="Logs" id="console">
                <template v-slot:text>
                    <v-container class="output">
                        <v-row>
                            <v-col cols="12">
                                <p v-if="this.gptDeveloper" v-for="message in this.gptDeveloper.getMessages()"><span
                                        class="role">{{ message.role }}</span><span class="content">: {{ message.content
                                        }}</span></p>
                            </v-col>
                        </v-row>
                    </v-container>
                </template>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>
<style scoped>
#console::v-deep(.v-expansion-panel-text__wrapper) {
    padding: 0 !important;
}
.role {
    font-weight: bolder;
    color: greenyellow;
    text-decoration: underline;
}

.content {
    font-weight: 100;
    color: greenyellow;
}

.page {
    display: flex;
    flex-direction: column;
    background-color: #F5F5F5;
    height: 100%;
    padding: 0 !important;
    margin-left: 0 !important;
}

.page_items {
    flex-grow: 1;
}

.output {
    background-color: black;
    font-family: 'Consolas';
    flex-grow: 1;
    max-height: 400px;
    overflow-y: scroll;
}

.tokens {
    background-color: #F5F5F5
}

.eye {
    padding-right: 0 !important;
    padding-left: 0 !important;
}

.token {
    padding-right: 2px !important;
    padding-left: 2px !important;
    border-radius: 0 !important;
}
</style>
<script>
import Workspace from './Workspace.vue'
import GptDeveloper from '@/services/GptDeveloper';
import { encode, decode } from 'gpt-tokenizer'
export default {
    components: { Workspace },
    data() {
        return {
            expanded: "1",
            showApikey: false,
            showTokens: false,
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
            apiKeyRules: [
                (v) =>
                    !!v ||
                    "API key is required"
            ],
            colors: ['green', 'purple', 'red', 'blue'],
            ai: null,
            inputs: {},
            answers: [],
            messages: [],
            workspace: {},
            configs: ['default'],
            selectedConfig: "default",
            gptDeveloper: null,
            status: { generating: false, finished: false }
        };
    },
    computed: {
        tokens() {
            return encode(this.prompt)
        },
        detokens() {
            return this.tokens.map(token => decode([token]))
        }
    },
    watch: {
        status: {
            handler(newVal, oldVal) {
                if (newVal.finished) {
                    this.expanded = "2"
                } else if (newVal.generating) {
                    this.expanded = ""
                }
                if (this.gptDeveloper) {
                    this.messages = this.gptDeveloper.getMessages()
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        async run() {
            this.outputs = []
            this.answers = []
            this.gptDeveloper = new GptDeveloper(
                this.selectedConfig,
                this.apiKey,
                this.selectedModel,
                this.project,
                this.prompt
            )
            this.status = this.gptDeveloper.status
            await this.gptDeveloper.run()
            this.questions()
            this.workspace = this.gptDeveloper.getWorkspace()
        },
        questions() {
            this.messages = this.gptDeveloper.getMessages()
            var lastMessage = this.messages[this.messages.length - 1]
            var questions = []
            if (lastMessage.content.indexOf('?') > -1) {
                questions = questions.concat(lastMessage.content.split('\n').slice(1))
            }
            if (questions.length > 0) {
                this.inputs = {
                    role: lastMessage.role, questions
                }
                this.expanded = "3"
            }
        },
        async next(lines) {
            this.inputs = {}
            var answer = 'skip'
            if (lines) {
                var questionsAnswers = []
                lines.forEach((question, index) => questionsAnswers.push(
                    `${question} ${this.answers[index]}`
                ))
                answer = `user clarifications:\n ${questionsAnswers.join('\n')}`
            }
            this.gptDeveloper.getPrompts().prompt = answer
            await this.gptDeveloper.run()
            this.questions()
        },
    }
};
</script>
