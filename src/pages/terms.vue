<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl ">إدارة المواسم الدراسية</div>
      <Button label="موسم دراسي جديد" icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2"
        @click="showNewSeasonDialog = true" />
    </div>

    <TreeTable :value="nodes">


      <Column header="السنة الدراسية" expander>
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ node.data.name }}
          </span>
          <strong v-else>
            {{ node.data.name }} <span>
              <Badge :value="node.data.status"
                :severity="node.data.status === 'حالي' ? 'success' : node.data.status === 'مستقبل' ? 'info' : 'secondary'">
              </Badge>
            </span></strong>
        </template>
      </Column>
      <Column header="البداية">
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ useDateFormat(new Date(node.data.startDate), 'YYYY-MM-DD', { locales: 'ar-SA' }) }}
          </span>
        </template>
      </Column>

      <Column header="النهاية">
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ useDateFormat(new Date(node.data.endDate), 'YYYY-MM-DD', { locales: 'ar-SA' }) }}
          </span>
        </template>
      </Column>
      <Column>
        <template #body="{ node }">
          <Button v-if="node.data.type === 'season'" rounded outlined icon="pi pi-pencil" severity="secondary"
            size="small" @click="handleEditSeasonClick(node)" />
        </template>
      </Column>
    </TreeTable>
    <Dialog header="أدخل معلومات القسم" @hide="editSeasonProps = undefined" v-model:visible="showEditSeasonDialog"
      :style="{ width: '350px' }" :modal="true">
      <EditSchoolSeasonForm v-if="editSeasonProps" :season="editSeasonProps?.season"
        :archived="editSeasonProps?.archived" @update:season="handleSeasonEditSubmit" />
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import type { SchoolSeason } from '~/data/types';
import useDataUtils from '../composables/useDataUtils';
import type { TreeNode } from 'primevue/treenode';
const { mapSeasonsToTree, getCollapsingSeasonIds } = useDataUtils()
type EditSeasonProps = {
  archived: boolean,
  season: SchoolSeason
}
const toast = useToast();
const showNewSeasonDialog = ref(false);
const showEditSeasonDialog = ref(false);
const editSeasonProps = ref<EditSeasonProps | undefined>(undefined);

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
        startDate: 1751414399000, // Aug 1, 2025
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

const handleEditSeasonClick = (node: TreeNode) => {
  const archived = node.data.status === 'منتهي';
  const season = schoolSeasons.value.find(s => s.id === node.data.id)!
  editSeasonProps.value = { season, archived };
  showEditSeasonDialog.value = true;
};
const getSeasonWithNeighborsById = (season: SchoolSeason) => {
  const seasonId = season.id;
  const index = schoolSeasons.value.findIndex(s => s.id === seasonId);
  return [
    schoolSeasons.value[index - 1],
    season,
    schoolSeasons.value[index + 1],
  ];
}
const handleSeasonEditSubmit = (updatedSeason: SchoolSeason) => {
  const seasonsToCheck = getSeasonWithNeighborsById(updatedSeason).filter(season => season !== undefined);
  const collapsingSeasonIds = getCollapsingSeasonIds(seasonsToCheck)
  console.log(seasonsToCheck, collapsingSeasonIds);
  if (collapsingSeasonIds) {
    const otherSeasonName = seasonsToCheck.find((season) => collapsingSeasonIds.includes(season.id) && season.id !== updatedSeason.id)?.name;
    toast.add({ severity: 'error', summary: 'خطأ في التواريخ', detail: `التواريخ التي أدخلتها تتداخل مع الموسم الدراسي "${otherSeasonName}"، يرجى تعديل التواريخ.`, life: 7000 });
    return;
  }

}
</script>
<style scoped></style>