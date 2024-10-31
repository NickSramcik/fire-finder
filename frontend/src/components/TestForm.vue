<template>
    <h2>Test Form</h2>
    <div>
        {{ console.log('Form is rendered') }}
    </div>
    <form @submit.prevent="submitData">
        <button type="button" @click="testData">Test Submit</button>
    </form>
</template>

<script setup>
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
if (instance) {
    console.log('Vue version:', instance.appContext.version);
} else {
    console.log('Vue instance not found');
}

function testData() {
    console.log('Submit button clicked. Prevent default behavior working?');
}
</script>