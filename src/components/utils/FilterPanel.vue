<template>

    <div class="flex flex-wrap gap-2 items-center justify-around">
        <h4 class="m-0">{{ props.title }} </h4>

        <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex gap-4">
                <Select v-if="props.filters.includes('classId')" name="class_id" :options="classOptions" optionLabel="label" optionValue="value"
                    placeholder="اختر الصف" v-model="dbFilters.classId" />
            </div>
            <div  v-if="props.filters.includes('dateRange')" class="flex flex-col gap-2">
                <SelectButton name="date range" :options="dateFilterOptions" optionLabel="label" optionValue="value"
                    v-model="selectedDateRange" @update:modelValue="updateDateRangeSelect" />
                <DatePicker v-model="dateRange" showIcon fluid iconDisplay="input" selection-mode="range"
                    @value-change="(e) => updateDateRange(e, 'date picker')" />

            </div>
            <IconField  v-if="props.filters.includes('name')">
                <InputIcon>
                    <i class="pi pi-search" />
                </InputIcon>
                <InputText v-model="dbFilters.name" placeholder="بحث عن..." />
            </IconField>
        </div>
        <Button icon="pi pi-times" severity="secondary" variant="text" rounded aria-label="Cancel"
            @click="resetFilters" />
    </div>
</template>
<script setup lang="ts">
import type { EventQueryFilters, SupportedDateRanges } from '~/data/types';
import { dateFilterOptions } from '~/data/static';
import { useStudentStore } from '~/store/studentStore';
const { getTimeRange } = useDataUtils()
const studentStore = useStudentStore();

type availableFilters = 'classId' | 'name' | 'dateRange'

// ========== COMPUTED PROPERTIES ==========
const classOptions = computed(() => {
    return [{ label: 'كل الأقسام', value: undefined }, ...studentStore.classOptions]
})
const props = defineProps<{
    title: string;
    filters: availableFilters[]
}>()

const dbFilters = ref<EventQueryFilters>({})
const emit = defineEmits<{
    (e: 'updateFilters', filtersObj: EventQueryFilters): void;
}>()


// Date filter states
const selectedDateRange = ref<SupportedDateRanges | undefined>(undefined) //used By date ranges select buttons
const dateRange = ref<Date[] | undefined>(undefined) //used By datePicker

// Date filter handlers
const updateDateRangeSelect = (value: SupportedDateRanges | null) => {
    if (value === null) {
        dateRange.value = undefined
        updateDateRange([null, null])
        return
    }
    const [min, max] = getTimeRange(value)
    dateRange.value = [new Date(min), new Date(max)]
    updateDateRange(dateRange.value, "select buttons")

}

const updateDateRange = (value: Date | Date[] | (Date | null)[] | null | undefined, changeSource: "select buttons" | "date picker" = 'date picker') => {
    if (!Array.isArray(value) || value.length !== 2) return
    if (value[0] === null || value[1] === null) {
        dateRange.value = undefined
        dbFilters.value.minDate = undefined
        dbFilters.value.maxDate = undefined
        return
    }
    dbFilters.value.minDate = value[0].getTime()
    dbFilters.value.maxDate = value[1].getTime()
    if (changeSource === "date picker") {
        selectedDateRange.value = undefined
    }
}

//update filters watcher
watch(dbFilters.value, () => {
    emit('updateFilters', dbFilters.value)
})

const resetFilters = () => { 
    dateRange.value = undefined
    selectedDateRange.value = undefined
    const dbFiltersKeys = Object.keys(dbFilters.value) as (keyof EventQueryFilters)[]
    dbFiltersKeys.forEach((key) => {
        dbFilters.value[key] = undefined

    })
}
</script>