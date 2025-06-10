import { readFileSync, writeFileSync } from 'fs';
const path = 'svlib.min.js';

const content = readFileSync(path, 'utf8');
const wrapped = `<script type="text/javascript">\n${content}\n</script>`;
writeFileSync(path, wrapped);
console.log('Prepended and appended <script> tags to svlib.js');