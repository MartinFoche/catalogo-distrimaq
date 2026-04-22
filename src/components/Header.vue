<script setup lang="ts">
</script>
<template>
    <header class="header" to="/">
        <div class="logo-container">
            <router-link to="/">
                <img
                class="img-header"
                src="/images/logo-distrimaq.png"
                alt="Distrimaq"
            />
            </router-link>
            
        </div>
    </header>
</template>
<style scoped>
.header {
    display: flex;
    justify-content: center; 
    align-items: center;     
    background-color: white;
    border-bottom: 1px solid #c00; 
    box-sizing: border-box;
    width: 100%;
    height: 80px; 
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logo-container {
    width: 100%; 
    display: flex;
    justify-content: center;
}

.img-header {
    height: 60px; 
    width: auto;
    object-fit: contain; 
}
</style>