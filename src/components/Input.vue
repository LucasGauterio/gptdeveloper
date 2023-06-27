<template>
    <v-card class="mt-2" v-if="input.questions">
        <v-card-title>{{ input.role }}</v-card-title>
        <v-card-text>
            <v-text-field v-for="(question, index) in input.questions" :label="question"
                v-model="answers[index]"></v-text-field>
        </v-card-text>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="green" :disabled="this.answers.join('') === ''" @click.stop="answer(true)">Answer</v-btn>
            <v-btn color="orange" @click.stop="answer(false)">Skip</v-btn>
        </v-card-actions>
    </v-card>
    <div v-if="!input.questions">The assistant doesn't need user input at the moment</div>
</template>
<style scoped></style>
<script>
export default {
    props: ['input'],
    data() {
        return {
            answers: []
        }
    },
    methods: {
        answer(answer) {
            var questionsAnswers = []
            if (answer && this.answers.join('') !== '') {
                this.input.questions.forEach((question, index) => questionsAnswers.push(
                    `${question} ${this.answers[index]}`
                ))
            }
            this.$emit('answer', { answers: questionsAnswers });
        }
    }
}
</script>