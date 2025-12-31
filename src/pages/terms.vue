<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl ">إدارة المواسم الدراسية</div>
      <!-- add season button: shows only If there is no future season -->
      <Button v-if="!nodes.some((seasonNode) => seasonNode.data.status === 'future')" label="موسم دراسي جديد"
        icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2" @click="showNewSeasonDialog = true" />
    </div>

    <TreeTable :value="nodes" >
      <Column header="السنة الدراسية" expander>
        <template #body="{ node }">
          <span v-if="node.data.type === 'term'">
            {{ node.data.name }}
          </span>
          <strong v-else>
            {{ node.data.name }} <span>
              <Badge v-bind="formatSeasonBadgeProps(node.data.status)">
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
    <Dialog header="حدد تفاصيل الموسم الدراسي" @hide="editSeasonProps = undefined"
      v-model:visible="showEditSeasonDialog" :modal="true">
      <EditSchoolSeasonForm v-if="editSeasonProps" :season="editSeasonProps?.season"
        :status="editSeasonProps?.status" @update:season="handleSeasonEditSubmit" />
    </Dialog>

    <Dialog header="موسم دراسي جديد" v-model:visible="showNewSeasonDialog" :modal="true">
      <NewSchoolSeasonForm :isLastSeasonCurrent="true"/>
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import type { SchoolSeason, SeasonStatus } from '~/data/types';
import type { TreeNode } from 'primevue/treenode';
import { useClientStore } from '~/store/clientStore';
import { ArabicSeasonStatus } from '~/data/static';
const { mapSeasonsToTree, getCollapsingSeasonIds } = useDataUtils();

type EditSeasonProps = {
  status: SeasonStatus,
  season: SchoolSeason
}

const backend = useBackend();
const toast = useToast();
const clientStore = useClientStore();

const showNewSeasonDialog = ref(false);
const showEditSeasonDialog = ref(false);
const editSeasonProps = ref<EditSeasonProps | undefined>(undefined);

  const formatSeasonBadgeProps = (status: SeasonStatus) =>{
  const value = ArabicSeasonStatus[status]
  const severity = status === 'current' ? 'success' : status === 'future' ? 'info' : 'secondary'
  return {value, severity}
  }

const nodes = computed(() => mapSeasonsToTree(clientStore.seasons));

const handleEditSeasonClick = (node: TreeNode) => {
  const status = node.data.status;
  const season = clientStore.seasons.find(s => s.id === node.data.id)!
  editSeasonProps.value = { season, status };
  showEditSeasonDialog.value = true;
};
const getSeasonWithNeighborsById = (season: SchoolSeason) => {
  const seasonId = season.id;
  const index = clientStore.seasons.findIndex(s => s.id === seasonId);
  return [
    clientStore.seasons[index - 1],
    season,
    clientStore.seasons[index + 1],
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
  try {
    backend.updateSeasons(updatedSeason).then(() => {
      toast.add({ severity: 'success', summary: 'تم الحفظ', detail: 'تم تحديث الموسم الدراسي بنجاح.' });
      clientStore.populateSeasons();
      showEditSeasonDialog.value = false;
    });
  }
  catch (error) {
    toast.add({ severity: 'error', summary: 'خطأ في الحفظ', detail: 'حدث خطأ أثناء تحديث الموسم الدراسي.' });

  }
}

</script>