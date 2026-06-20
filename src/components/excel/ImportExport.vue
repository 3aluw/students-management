<template>
    <FileUpload v-if="props.allowImport" class="mx-2" mode="basic" @select="onXlsxSelect" chooseLabel="رفع"
        iconPos="right" auto chooseIcon="pi pi-upload" accept=".xlsx" severity="secondary"
        :chooseButtonProps="{ severity: 'secondary', iconPos: 'right' }" />
    <Button v-if="props.allowExport" label="تحميل" icon="pi pi-download" iconPos="right" severity="secondary" @click="emit('handleExport')" />

</template>
<script setup lang="ts">
import type { FileUploadSelectEvent } from 'primevue';
const toast = useToast();

const props = withDefaults(
    defineProps<{
        allowImport?: boolean
        allowExport?: boolean
    }>(),
    {
        allowImport: false,
        allowExport: true
    }
)

const emit = defineEmits<{
    (e: 'handleExport'): void;
    (e: 'handleImport', file: any): void;
}>()


const onXlsxSelect = (event: FileUploadSelectEvent) => {
    const file = event.files?.[0];

    if (!file) return; // Guard clause in case no file was selected
    //Guard clause in case selected file is not xlsx
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
        toast.add({ severity: 'error', summary: 'يرجى رفع ملف اكسل (.xlsx)', life: 3000 })
        return;
    }
    emit('handleImport', file)
}

</script>