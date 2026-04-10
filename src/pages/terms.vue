<template>
  <div class="card">
    <div class="flex items-center gap-4 mb-4">
      <div class="font-semibold text-xl ">إدارة المواسم الدراسية</div>
      <!-- add season button: shows only If there is no future season -->
      <Button v-if="!nodes.some((seasonNode) => seasonNode.data.status === 'future')" label="موسم دراسي جديد"
        icon="pi pi-plus" iconPos="right" severity="secondary" class="mx-2" @click="showNewSeasonDialog = true" />
      <Button label="موسم دراسي سريع test" @click="handleTestSeasonCreation" />
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
            size="small" @click="handleEditSeasonClick(node)" />
        </template>
      </Column>
    </TreeTable>

    <Dialog header="حدد تفاصيل الموسم الدراسي" @hide="editSeasonProps = undefined"
      v-model:visible="showEditSeasonDialog" :modal="true">
      <EditSchoolSeasonForm v-if="editSeasonProps" :season="editSeasonProps?.season" :status="editSeasonProps?.status"
        @update:season="handleSeasonEditSubmit" />
    </Dialog>

    <Dialog class="max-w-128" header="موسم دراسي جديد" v-model:visible="showNewSeasonDialog" :modal="true">
      <NewSchoolSeasonForm :isLastSeasonCurrent @create-season="handleSeasonCreation" />
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import type { NewSeasonPayload, SchoolSeason, SeasonStatus } from '~/data/types';
import type { TreeNode } from 'primevue/treenode';
import { useClientStore } from '~/store/clientStore';
import { ArabicSeasonStatus } from '~/data/static';
const { mapSeasonsToTree, getCollapsingSeasonIds, getSeasonStartAndEndDates } = useDataUtils();

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

// ========== SEASONS TABLE LOGIC ==========

// format season status badges
const formatSeasonBadgeProps = (status: SeasonStatus) => {
  const value = ArabicSeasonStatus[status]
  const severity = status === 'current' ? 'success' : status === 'future' ? 'info' : 'secondary'
  return { value, severity }
}
// create node to populate on tree table
const nodes = computed(() => mapSeasonsToTree(clientStore.seasons));


// ========== NEW SEASON LOGIC ==========
const lastSeasonStatus = computed(() => {
  const lastNode = nodes.value.at(-1);
  const lastSeasonStatus = lastNode?.data.status;
  return lastSeasonStatus
})
const isLastSeasonCurrent = computed(() => lastSeasonStatus.value === 'current')

const handleSeasonCreation = async (payload: NewSeasonPayload) => {
  if (lastSeasonStatus.value == 'future') {
    toast.add({ severity: 'error', summary: 'خطأ في إنشاء الموسم الدراسي', detail: 'لا يمكنك إنشاء موسم دراسي جديد طالما أن هناك موسم مستقبلي موجود. يرجى حذفه قبل إنشاء موسم جديد.', life: 7000 });
    return;
  }
  console.log(payload);
  const res = await backend.createSeason(payload)
  if (res?.success) {
    toast.add({ severity: 'success', summary: 'تم بنجاح', detail: res.message });
    showNewSeasonDialog.value = false;
    clientStore.populateSeasons();
  } else {
    toast.add({ severity: 'error', summary: 'خطأ في العملية', detail: res.message });
  }

}
// ========== EDIT SEASON LOGIC ==========
//populate season props then open editing dialog
const handleEditSeasonClick = (node: TreeNode) => {
  const status = node.data.status;
  const season = clientStore.seasons.find(s => s.id === node.data.id)!
  editSeasonProps.value = { season, status };
  showEditSeasonDialog.value = true;
};
// get past and future season to check for date collisions when editing a season
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

const testPayload: NewSeasonPayload = {
  "terminateCurrentSeason": true,
  "newSeason": {
    "terms": [
      {
        "endDate": 1780182000000,
        "startDate": 1775214569035,
        "name": "الربيع"
      }
    ],
    "name": "2026 أخيرة"
  },
  "classPromotionMap": {
    "1": 3,
    "2": 3,
    "3": -1
  },
  "repeaters": [
    {
      "id": 5,
      "class_id": 1,
      "first_name": "سارة",
      "last_name": "الطاهري",
      "father_name": "خالد",
      "grandfather_name": "يوسف",
      "sex": "F",
      "phone_number": "0611122233",
      "birth_date": 959468400000,
      "address": "الدار البيضاء",
      "status": "active"
    },
    {
      "id": 4,
      "class_id": 2,
      "first_name": "أحمد",
      "last_name": "العسري",
      "father_name": "محمد",
      "grandfather_name": "عبدالله",
      "sex": "M",
      "phone_number": "0612345678",
      "birth_date": 20090115,
      "address": "الرباط",
      "status": "active"
    },
    {
      "id": 12,
      "class_id": 3,
      "first_name": "أنس",
      "last_name": "الزهراء",
      "father_name": "طارق",
      "grandfather_name": "عبد الجليل",
      "sex": "M",
      "phone_number": "0610987654",
      "birth_date": 20100105,
      "address": "أكادير",
      "status": "active"
    }
  ]
}
const handleTestSeasonCreation = async () => {
  handleSeasonCreation(testPayload)
}
</script>