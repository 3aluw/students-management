<template>
  <div className="card">
    <div class="font-semibold text-xl mb-4">Empty Page</div>
    <p>Use this page to start from scratch and place your custom content.</p>
    {{ studentStore.classes }}
  </div>
</template>
<script setup lang="ts">
import { useStudentStore } from '~/store/studentStore';

const studentStore = useStudentStore() 
</script>
<style scoped></style>