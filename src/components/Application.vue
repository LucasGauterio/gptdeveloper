<template>
    <div class="page">
        <div class="text-center">
            <v-snackbar v-model="snackbar" timeout="10000">
                {{ snackbarMessage }}

                <template v-slot:actions>
                    <v-btn color="blue" variant="text" @click="snackbar = false">
                        Close
                    </v-btn>
                </template>
            </v-snackbar>
        </div>
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
                                    <configuration :generating="status.generating" @generate="generate"></configuration>
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
                                    <answers-input :input="input" @answer="next" @skip="next"></answers-input>
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
    </div>
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
import AnswersInput from './Input.vue'
import Configuration from './Configuration.vue'
import GptDeveloper from '@/services/GptDeveloper';
import { encode, decode } from 'gpt-tokenizer'
export default {
    components: { Workspace, AnswersInput, Configuration },
    data() {
        return {
            generating: false,
            finished: false,
            expanded: "1",
            input: {},
            answers: [],
            messages: [],
            workspace: {},
            gptDeveloper: null,
            status: { generating: false, finished: false },
            snackbarMessage: null,
            snackbar: false,
            projectName: "",
        };
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
        async generate(params) {
            this.outputs = []
            this.answers = []
            this.gptDeveloper = new GptDeveloper(
                params.config,
                params.apiKey,
                params.model,
                params.projectName,
                params.prompt
            )
            this.projectName = params.projectName
            this.status = this.gptDeveloper.status
            var message = await this.gptDeveloper.run()
            if (message) {
                this.snackbar = true
                this.snackbarMessage = message
            } else {
                this.questions()
                this.workspace = this.gptDeveloper.getWorkspace()
            }
        },
        questions() {
            var step = this.gptDeveloper.currentStep()
            if(step && step.name === 'clarify'){
                this.messages = this.gptDeveloper.getMessages()
                var lastMessage = this.messages[this.messages.length - 1]
                var questions = []
                if (lastMessage.content.indexOf('?') > -1) {
                    questions = questions.concat(lastMessage.content.split('\n').slice(1))
                }
                if (questions.length > 0) {
                    this.input = {
                        role: lastMessage.role, questions
                    }
                    this.expanded = "3"
                }
            }
        },
        async next(e) {
            this.input = {}
            var answer = 'skip'
            if (e.answers.length > 0) {
                answer = `user clarifications:\n ${e.answers.join('\n')}`
            }
            this.gptDeveloper.getPrompts().prompt = answer
            await this.gptDeveloper.run()
            this.questions()
        },
    }
};
</script>
