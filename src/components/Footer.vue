<script setup lang="ts">
  const anioActual = new Date().getFullYear();
</script>
<template>
    <footer class="footer">
        <a 
        href="https://www.linkedin.com/in/martin-fochesatto/" 
        target="_blank" 
        rel="noopener"
        >
            &copy;  Desarrollador - Martin Fochesatto {{ anioActual }}
        </a>
    </footer>
</template>
<style scoped>
footer{
    font-weight: lighter;
    text-align: center; 
    background-color: white;
    border-top: 1px solid #c00; 
    box-sizing: border-box;
    width: 100%;
    height: 16px; 
    overflow: hidden;
    box-shadow: 0px -2px 4px rgba(0, 0, 0, 0.1);
    font-size: small;
    margin-top: 20px;
}
a {
  text-decoration: none; 
  color: inherit;      
}
</style>