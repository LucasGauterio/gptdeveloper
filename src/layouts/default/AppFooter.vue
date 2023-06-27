<template>
    <v-footer color="primary" class="footer">
        <v-row justify="center" no-gutters>
            <v-btn v-for="link in links" :key="link" color="white" variant="text" class="mx-2" rounded="xl">
                <a :href="link.url" target="_blank">
                    {{ link.title }}
                </a>
            </v-btn>
            <v-col class="text-center mt-4" cols="12">
                2023 — <strong>GPT Developer</strong>
            </v-col>
        </v-row>
    </v-footer>
</template>
<style scoped>
a {
  text-decoration: none;
  color: white;
}
.footer {
  max-height: 100px;
}
</style>
<script>
  export default {
    data: () => ({
      links: [
        {title: 'About me', url: `https://www.linkedin.com/in/lucasgauterio/`},
        {title: 'Git', url: `https://github.com/LucasGauterio/gptdeveloper`},
      ],
    }),
  }
</script>