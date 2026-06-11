<template>
    <div>
        <UtilsStudentsTableNew :global-search-active="globalSearchValue.length > 0" :settings="{
            clearSelectionOnClassChange: true,
        }" :students="studentsToShow" :table-search-value="tableSearchValue" v-model="selectedStudents">
            <template #toolbar>
                <Toolbar class="mb-6">
                    <template #start>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model.trim="globalSearchValue" placeholder="بحث عام" type="search" />
                        </IconField>
                    </template>
                </Toolbar>
            </template>
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <div class="flex gap-4">
                        <h4 class="m-0">{{ 'الطلبة المغادرون' }}</h4>

                        <SelectButton name="status" :options="statusFilterOptions" optionLabel="label"
                            optionValue="value" v-model="modalFilters.status" />

                        <DatePicker :showButtonBar="true" :manualInput="false" placeholder="سنة المغادرة"
                            v-model="modalFilters.exited_at_Year" view="year" dateFormat="yy">
                        </DatePicker>


                    </div>
                    <IconField v-show="!globalSearchValue.length">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="modalFilters.name" placeholder="بحث عن ..." />
                    </IconField>
                </div>
            </template>
        </UtilsStudentsTableNew>
    </div>

</template>

<script setup lang="ts">
import { statusFilterOptions } from "~/data/static"
import type { InactiveStudentQueryFilters, Student } from '~/data/types';
import { watchDebounced } from "@vueuse/core";

type ClientFilters = {
    name: string;
    status: "graduated" | "dropped" | "transferred";
    exited_at_Year: Date | undefined;
}
const Backend = useBackend()



const studentsToShow = ref<Student[]>([])
const getStudents = async (filters: InactiveStudentQueryFilters) => {
    studentsToShow.value = await Backend.getStudents(filters)
}
onMounted(async () => {
    const initialFilters: InactiveStudentQueryFilters = {
        status: "graduated"
    }
    getStudents(initialFilters)
})
const selectedStudents = ref()
const globalSearchValue = ref('')
const tableSearchValue = ref('')

const modalFilters = ref<ClientFilters>({
    status: "graduated",
    exited_at_Year: undefined,
    name: ''
})

watchDebounced(modalFilters.value, () => {
    console.log(modalFilters.value)
    const dbFilters: InactiveStudentQueryFilters = {
        ...modalFilters.value,
        exited_at_Year: modalFilters.value.exited_at_Year?.getTime()
    }
    getStudents(dbFilters)
}, { debounce: 500 })

</script>