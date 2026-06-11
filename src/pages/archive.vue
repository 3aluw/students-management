<template>
    <div>
        <UtilsStudentsTableNew :global-search-active="globalSearchValue.length > 0" :settings="{
            clearSelectionOnClassChange: true,
        }" :students="studentsToShow" :table-search-value="tableSearchValue" v-model="selectedStudents">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <div class="flex gap-4">
                        <h4 class="m-0">{{ 'الطلبة المغادرون' }}</h4>
                        <IconField v-show="!globalSearchValue.length">
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="tableSearchValue" placeholder="بحث عن..." />
                        </IconField>
                    </div>
                </div>
            </template>
        </UtilsStudentsTableNew>
    </div>

</template>

<script setup lang="ts">
import { useBackend } from '#imports';
import type { Student } from '~/data/types';
const Backend = useBackend()

const studentsToShow = ref<Student[]>([])
onMounted(async() => {
    studentsToShow.value = await Backend.getStudents({ status: "graduated" })
})
const selectedStudents = ref()
const globalSearchValue = ref('')
const tableSearchValue = ref('')


</script>