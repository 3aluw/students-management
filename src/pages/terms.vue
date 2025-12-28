<template>
  <div className="card">
    <div class="font-semibold text-xl mb-4">إدارة المواسم الدراسية</div>
    <TreeTable :value="nodes">
      <Column field="name" header="السنة الدراسية" expander />

      <Column header="البداية">
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ useDateFormat( new Date(node.data.startDate), 'YYYY-MM-DD', { locales: 'ar-SA' }) }}
          </span>
        </template>
      </Column>

      <Column header="النهاية">
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ useDateFormat( new Date(node.data.endDate), 'YYYY-MM-DD', { locales: 'ar-SA' }) }}
          </span>
        </template>
      </Column>
    </TreeTable>

  </div>
</template>
<script setup lang="ts">
import type { SchoolSeason } from '~/data/types';
import type { TreeNode } from 'primevue/treenode';
import useDataUtils from '../composables/useDataUtils';
const { mapSeasonsToTree } = useDataUtils()
const schoolSeasons = ref<SchoolSeason[]>([
  {
    id: 1,
    name: "2023–2024",
    terms: [
      {
        name: "Fall Term",
        startDate: 1690848000000, // Aug 1, 2023
        endDate: 1704067199000,   // Dec 31, 2023
      },
      {
        name: "Spring Term",
        startDate: 1704067200000, // Jan 1, 2024
        endDate: 1719791999000,   // Jun 30, 2024
      },
    ],
  },
  {
    id: 2,
    name: "2024–2025",
    terms: [
      {
        name: "Fall Term",
        startDate: 1722470400000, // Aug 1, 2024
        endDate: 1735689599000,   // Dec 31, 2024
      },
      {
        name: "Spring Term",
        startDate: 1735689600000, // Jan 1, 2025
        endDate: 1751414399000,   // Jun 30, 2025
      },
    ],
  },
  {
    id: 3,
    name: "2025–2026",
    terms: [
      {
        name: "Fall Term",
        startDate: 1754006400000, // Aug 1, 2025
        endDate: 1767225599000,   // Dec 31, 2025
      },
      {
        name: "Spring Term",
        startDate: 1767225600000, // Jan 1, 2026
        endDate: 1782950399000,   // Jun 30, 2026
      },
    ],
  },
])
const nodes = computed(() => mapSeasonsToTree(schoolSeasons.value));
</script>
<style scoped></style>