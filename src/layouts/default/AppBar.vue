<template>
  <v-app-bar app>
    <v-app-bar-title>
      <v-img :src="logo" title="GPT Developer" height="60px"></v-img>
    </v-app-bar-title>
  </v-app-bar>
</template>

<script>
import logo from '../../assets/logo.svg'
export default {
  data: () => ({
    logo: logo,
  }),
}
</script>
