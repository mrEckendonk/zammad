<!-- Copyright (C) 2012-2025 Zammad Foundation, https://zammad-foundation.org/ -->

<script setup lang="ts">
import CommonSkeleton from '#desktop/components/CommonSkeleton/CommonSkeleton.vue'

interface Props {
  rows?: number
}

withDefaults(defineProps<Props>(), {
  rows: 5,
})
</script>

<template>
  <div class="space-y-10">
    <CommonSkeleton
      v-for="n in rows"
      :key="n"
      :style="{ 'animation-delay': `${n * 0.1}s` }"
      class="h-10"
    />
  </div>
</template>
