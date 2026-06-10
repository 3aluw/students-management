<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl ">إدارة المواسم الدراسية</div>
      <!-- add season button: shows only If there is no future season -->
      <Button v-if="!nodes.some((seasonNode) => seasonNode.data.status === 'future')" label="موسم دراسي جديد"
        icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2" @click="showNewSeasonDialog = true" />
    </div>

    <TreeTable :value="nodes">
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
            size="large" @click="handleEditSeasonClick(node)" />
          <Button v-if="node.data.status === 'future'" rounded outlined icon="pi pi-trash" severity="danger"
            size="large" @click="useDeleteConfirm.requestAction(node.data.id)" />
        </template>
      </Column>
    </TreeTable>
    <!-- Edit season dialog -->
    <Dialog header="حدد تفاصيل الموسم الدراسي" @hide="editSeasonProps = undefined"
      v-model:visible="showEditSeasonDialog" :modal="true">
      <EditSchoolSeasonForm v-if="editSeasonProps" :season="editSeasonProps?.season" :status="editSeasonProps?.status"
        @update:season="handleSeasonEditSubmit" />
    </Dialog>

    <!-- New season dialog -->
    <Dialog class="max-w-128" header="موسم دراسي جديد" v-model:visible="showNewSeasonDialog" :modal="true">
      <NewSchoolSeasonForm :isLatestSeasonCurrent @create-season="handleSeasonCreation" />
    </Dialog>

    <!-- confirm dialog for delete season button -->
    <UtilsConfirmDialog header="حذف الموسم الدراسي" message="هل أنت متأكد من رغبتك في  حذف هذا الموسم الدراسي ؟"
      :danger="true" v-model="useDeleteConfirm.showConfirm.value" @confirm="useDeleteConfirm.confirmAction" />
  </div>
</template>

<script setup lang="ts">
import type {
  NewSeasonPayload,
  SchoolSeason,
  SeasonStatus
} from '~/data/types';

import type { TreeNode } from 'primevue/treenode';

import { useClientStore } from '~/store/clientStore';

import {
  ArabicSeasonStatus,
  userFeedbackMessages
} from '~/data/static';

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

type EditSeasonProps = {
  status: SeasonStatus;
  season: SchoolSeason;
};

/* -------------------------------------------------------------------------- */
/*                                Stores                                      */
/* -------------------------------------------------------------------------- */

const backend = useBackend();
const toast = useToast();
const clientStore = useClientStore();

/* -------------------------------------------------------------------------- */
/*                                Messages                                    */
/* -------------------------------------------------------------------------- */

const { season: toastMessages } = userFeedbackMessages;

/* -------------------------------------------------------------------------- */
/*                                Dialogs                                     */
/* -------------------------------------------------------------------------- */

const showNewSeasonDialog = ref(false);
const showEditSeasonDialog = ref(false);

const editSeasonProps = ref<EditSeasonProps>();

/* -------------------------------------------------------------------------- */
/*                              Seasons Table                                 */
/* -------------------------------------------------------------------------- */

// create node to populate on tree table
const nodes = computed(() =>
  mapSeasonsToTree(clientStore.seasons)
);

// format season status badges
const formatSeasonBadgeProps = (
  status: SeasonStatus
) => {
  const value = ArabicSeasonStatus[status];

  const severity =
    status === 'current'
      ? 'success'
      : status === 'future'
        ? 'info'
        : 'secondary';

  return { value, severity };
};

/* -------------------------------------------------------------------------- */
/*                            Season Creation                                 */
/* -------------------------------------------------------------------------- */

const latestSeasonStatus = computed(() => {
  const firstNode = nodes.value[0];
  return firstNode?.data.status;
});

const isLatestSeasonCurrent = computed(
  () => latestSeasonStatus.value === 'current'
);

const handleSeasonCreation = async (
  payload: NewSeasonPayload
) => {
  if (latestSeasonStatus.value === 'future') {
    toast.add({
      severity: 'error',
      summary: 'خطأ في إنشاء الموسم الدراسي',
      detail:
        'لا يمكنك إنشاء موسم دراسي جديد طالما أن هناك موسم مستقبلي موجود. يرجى حذفه قبل إنشاء موسم جديد.',
      life: 7000
    });

    return;
  }

  try {
    const res = await backend.createSeason(payload);

    toast.add({
      severity: 'success',
      summary: toastMessages.addSuccess,
      detail: res.message
    });

    showNewSeasonDialog.value = false;

    clientStore.populateSeasons();

  } catch (error) {
    toast.add(
      getToastErrorObject(error, toastMessages.addFailed)
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                              Season Delete                                 */
/* -------------------------------------------------------------------------- */
const deleteSeason = async (seasonId: number) => {
  await backend.deleteSeason(seasonId)
}
const useDeleteConfirm = useConfirmHandler(
  deleteSeason,
  clientStore.populateSeasons,
);


/* -------------------------------------------------------------------------- */
/*                              Season Editing                                */
/* -------------------------------------------------------------------------- */
//populate season editing props then open editing dialog
const handleEditSeasonClick = (
  node: TreeNode
) => {
  const status = node.data.status;

  const season = clientStore.seasons.find(
    (s) => s.id === node.data.id
  )!;

  editSeasonProps.value = {
    season,
    status
  };

  showEditSeasonDialog.value = true;
};
// get past and future season to check for date collisions when editing a season
const getSeasonWithNeighborsById = (
  season: SchoolSeason
) => {
  const index = clientStore.seasons.findIndex(
    (s) => s.id === season.id
  );

  return [
    clientStore.seasons[index - 1],
    season,
    clientStore.seasons[index + 1]
  ];
};

//returns true if there is a date collision between the season being edited and its neighbors 
const hasSeasonCollision = (updatedSeason: SchoolSeason) => {

  const seasonsToCheck = getSeasonWithNeighborsById(
    updatedSeason
  ).filter(season => season !== undefined);

  const collapsingSeasonIds =
    getCollapsingSeasonIds(seasonsToCheck);

  if (collapsingSeasonIds) {
    const otherSeasonName = seasonsToCheck.find(
      (season) =>
        collapsingSeasonIds.includes(season.id) &&
        season.id !== updatedSeason.id
    )?.name;

    toast.add({
      severity: 'error',
      summary: 'خطأ في التواريخ',
      detail: `التواريخ التي أدخلتها تتداخل مع الموسم الدراسي "${otherSeasonName}"، يرجى تعديل التواريخ.`,
      life: 7000
    });

    return true
  }
  return false;
}
const handleSeasonEditSubmit = async (
  updatedSeason: SchoolSeason
) => {
  if (hasSeasonCollision(updatedSeason)) return;
  try {
    await backend.updateSeasons(updatedSeason)
    toast.add({
      severity: 'success',
      summary: toastMessages.updateSuccess,
      life: 3000
    })

    clientStore.populateSeasons();

    showEditSeasonDialog.value = false;
  } catch (error) {
    toast.add(
      getToastErrorObject(error, toastMessages.updateFailed)
    );
  }
};

</script>