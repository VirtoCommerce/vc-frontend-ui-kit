<template>
  <VcButton color="primary">Smoke</VcButton>
  <VcInput v-model="text" label="Text" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { VcButton, VcInput } from "@vc-frontend/ui-kit/components";

const text = ref("");
</script>
