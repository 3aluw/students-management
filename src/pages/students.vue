<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2"
                        @click="showStudentDialog = true" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected"
                        :disabled="!selectedProducts || !selectedProducts.length" />
                </template>

                <template #end>
                    <Button label="تحميل" icon="pi pi-download" severity="secondary" @click="exportCSV()" />
                </template>
            </Toolbar>


            <DataTable :ref="dt" v-model:selection="selectedStudents" :value="studentsToShow" dataKey="id"
                :paginator="true" :rows="10" :filters="filters" stripedRows
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} products"
                :globalFilterFields="['first_name', 'last_name']">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <div class="flex gap-4">
                            <h4 class="m-0">قائمة الطلبة</h4>
                            <Select name="class_id" :options="studentStore.classOptions" optionLabel="label"
                                optionValue="value" placeholder="اختر الصف" @update:modelValue="changeClass"
                                v-model="studentStore.selectedClassId" />
                        </div>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" placeholder="بحث عن..." />
                        </IconField>

                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>

                <Column field="first_name" header="الاسم" class="hidden" />
                <Column field="last_name" header="اللقب" class="hidden" />
                <Column header="الاسم واللقب" sortable class="font-bold">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{ slotProps.data.last_name + " " + slotProps.data.first_name }}</p>
                    </template>
                </Column>
                <Column header="الأب">
                    <template #body="slotProps: DataTableSlot<Student>">
                        <p>{{ slotProps.data.father_name + " بن " + slotProps.data.grandfather_name }}</p>
                    </template>
                </Column>
                <Column field="phone_number" header="رقم الهاتف" style="min-width: 5rem"></Column>
                <Column field="address" header="العنوان" style="min-width: 16rem"></Column>
                <Column field="class_id" header="القسم"></Column>
                <template #empty>
                    <p class="text-center bold"> لا يوجد أي طلبة</p>
                </template>
            </DataTable>
        </div>

        <Dialog header="أدخل معلومات القسم" @hide="studentToEdit = undefined" v-model:visible="showStudentDialog"
            :style="{ width: '350px' }" :modal="true">
            <UtilsNewEntityForm entityType="student" :entityObject="studentToEdit" @submit="handleStudentSubmit" />
        </Dialog>
    </div>
</template>
<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import type { Student, DataTableSlot, NewStudent } from '~/data/types'
import { ProductService } from "~/service/ProductService.js";
import { useStudentStore } from '~/store/studentStore';
const studentStore = useStudentStore();
const backend = useBackend()
const toast = useToast();
const dt = ref();

const selectedStudents = ref<Student[]>()
const studentsToShow = computed(() => studentStore.searchedStudents.length ? studentStore.searchedStudents : studentStore.students)
const showStudentDialog = ref(false);
const studentToEdit = ref<Student | undefined>(undefined)

const changeClass = (classId: number) => {
    studentStore.populateStudents(classId)
}

const handleStudentSubmit = (newStudent: NewStudent) => {
    studentToEdit.value ? EditStudent({ ...newStudent, id: studentToEdit.value.id }) : createNewStudent(newStudent)
}
const EditStudent = async (studentObj: Student) => {
    try {
        await backend.updateStudent(studentObj)
        await studentStore.populateStudents(studentToEdit.value?.class_id!)
        showStudentDialog.value = false
        toast.add({ severity: 'success', summary: 'تم تعديل القسم بنجاح', life: 3000 })

    } catch (error) {
        toast.add({ severity: 'error', summary: 'حدث خطأ أثناء تعديل معلومات القسم', life: 3000 })

    }
}
const createNewStudent = async (newStudent: NewStudent) => {
    try {
        await backend.createStudent(newStudent)
        await studentStore.populateStudents(newStudent.class_id)
        showStudentDialog.value = false
        toast.add({ severity: 'success', summary: 'تم إنشاء القسم بنجاح', life: 3000 })

    } catch (error) {
        toast.add({ severity: 'error', summary: 'حدث خطأ أثناء إنشاء القسم', life: 3000 })

    }
}


onMounted(() => {
    ProductService.getProducts().then((data) => (products.value = data));

});

const products = ref();
const productDialog = ref(false);
const deleteProductDialog = ref(false);
const deleteProductsDialog = ref(false);
const product = ref({});
const selectedProducts = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const statuses = ref([
    { label: 'INSTOCK', value: 'instock' },
    { label: 'LOWSTOCK', value: 'lowstock' },
    { label: 'OUTOFSTOCK', value: 'outofstock' }
]);

function openNew() {
    product.value = {};
    submitted.value = false;
    productDialog.value = true;
}

function hideDialog() {
    productDialog.value = false;
    submitted.value = false;
}

function saveProduct() {
    submitted.value = true;

    if (product?.value.name?.trim()) {
        if (product.value.id) {
            product.value.inventoryStatus = product.value.inventoryStatus.value ? product.value.inventoryStatus.value : product.value.inventoryStatus;
            products.value[findIndexById(product.value.id)] = product.value;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Updated', life: 3000 });
        } else {
            product.value.id = createId();
            product.value.code = createId();
            product.value.image = 'product-placeholder.svg';
            product.value.inventoryStatus = product.value.inventoryStatus ? product.value.inventoryStatus.value : 'INSTOCK';
            products.value.push(product.value);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Created', life: 3000 });
        }

        productDialog.value = false;
        product.value = {};
    }
}

function editProduct(prod) {
    product.value = { ...prod };
    productDialog.value = true;
}

function confirmDeleteProduct(prod) {
    product.value = prod;
    deleteProductDialog.value = true;
}

function deleteProduct() {
    products.value = products.value.filter((val) => val.id !== product.value.id);
    deleteProductDialog.value = false;
    product.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Product Deleted', life: 3000 });
}

function findIndexById(id) {
    let index = -1;
    for (let i = 0; i < products.value.length; i++) {
        if (products.value[i].id === id) {
            index = i;
            break;
        }
    }

    return index;
}

function createId() {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteProductsDialog.value = true;
}

function deleteSelectedProducts() {
    products.value = products.value.filter((val) => !selectedProducts.value.includes(val));
    deleteProductsDialog.value = false;
    selectedProducts.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Products Deleted', life: 3000 });
}

function getStatusLabel(status) {
    switch (status) {
        case 'INSTOCK':
            return 'success';

        case 'LOWSTOCK':
            return 'warn';

        case 'OUTOFSTOCK':
            return 'danger';

        default:
            return null;
    }
}
</script>