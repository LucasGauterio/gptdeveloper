<template>
    <div>
        <p>This application need your Open AI API Key available at </p>
        <a target="_blank"
            href="https://platform.openai.com/account/api-keys">https://platform.openai.com/account/api-keys</a>
        <v-form ref="form" autocomplete="off">
            <v-select v-if="historyItems.length > 0" v-model="selectedProject" :items="historyItems" label="Select a previous configuration?" required></v-select>
            <v-btn class="deleteHistory" v-if="selectedProject" block color="red" @click.stop="removeHistory()">Delete from history</v-btn>
            <v-text-field v-model="apiKey" label="API Key" required :append-icon="showApikey ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showApikey ? 'text' : 'password'" @click:append="showApikey = !showApikey"
                :rules="apiKeyRules"></v-text-field>

            <v-select v-model="selectedModel" :items="models" label="Select ChatGPT Model" required></v-select>

            <v-text-field v-model="projectName" label="Software Project Name" required
                :rules="projectNameRules"></v-text-field>

            <v-label>Prompt {{ showTokens ? "in tokens" : "" }}</v-label>
            <v-textarea v-if="!showTokens" v-model="prompt" required :append-icon="showTokens ? 'mdi-eye' : 'mdi-eye-off'"
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
            <v-select v-model="selectedConfig" :items="configs" label="Select the process" required></v-select>

            <v-btn :disabled="generating" @click.stop="generate" color="primary">Generate</v-btn>
        </v-form>
    </div>
</template>
<style scoped>
.deleteHistory {
    margin-bottom: 10px;
}
</style>
<script>
import { encode, decode } from 'gpt-tokenizer'
import { Configurations } from '../services/Steps'
export default {
    props: ['generating', "history", "currentProject"],
    emits: ['generate', 'selectProject', 'removeHistory'],
    data() {
        return {
            showApikey: false,
            showTokens: false,
            models: ["gpt-3.5-turbo", "gpt-4"],
            projectNameRules: [
                (v) =>
                    !!v ||
                    "Project name is required",
                (v) =>
                    (v && v.length >= 3 && v.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(v)) ||
                    "Project name must be between 3 and 30 characters and contain only letters and numbers, _ and -"
            ],
            apiKeyRules: [
                (v) =>
                    !!v ||
                    "API key is required"
            ],
            colors: ['green', 'purple', 'red', 'blue'],
            configs: Object.values(Configurations),
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,
            selectedModel: "gpt-3.5-turbo",
            selectedConfig: "default",
            projectName: "myproject",
            prompt: "Create a web application in HTML, CSS, javascript that allows users to resize images by specifying the desired width and height.",
            selectedProject: this.currentProject,            
        }
    },    
    watch: {
        selectedProject: {
            handler(newVal, oldVal) {
                if(newVal && newVal != ""){
                    const db = this.history.getDatabase(newVal)
                    this.projectName = db.project
                    this.prompt = db.prompts.main_prompt
                    this.selectProject()
                }
            },
            deep: true,
            immediate: true
        }
    },
    computed: {
        tokens() {
            return encode(this.prompt)
        },
        detokens() {
            return this.tokens.map(token => decode([token]))
        },
        configuration(){
            return Object.entries(Configurations).
                find(([key, val]) => val === this.selectedConfig)[0]
        },
        historyItems(){
            return Object.keys(this.history.databases) || []
        },
    },
    methods: {
        generate() {
            this.$emit('generate', {
                history: this.selectedHistory,
                apiKey: this.apiKey,
                model: this.selectedModel,
                config: this.configuration,
                projectName: this.projectName,
                prompt: this.prompt,
            })
        },
        selectProject() {
            this.$emit('selectProject', this.selectedProject)
        },
        removeHistory(){
            this.$emit('removeHistory', this.selectedProject)
            this.selectedProject = null
        }
    }
}
</script>