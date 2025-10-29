<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
<script setup>
import { ar } from '~/assets/prime-vue-ar.json'
const primeConfig = usePrimeVue()
 primeConfig.config.locale = ar

</script>
