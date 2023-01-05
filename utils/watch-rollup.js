const fs = require('fs');
const { rollup } = require('rollup');
const chokidar = require('chokidar');

const watchDir = 'dist';
const deps = [
    {
        input: 'node_modules/uuid/dist/esm-browser/v5.js',
        watch: `${watchDir}/uuidv5.min.js`,
        name: 'uuidv5'
    }
]
const watchFiles = deps.map(dep => dep.watch);

console.log({watchFiles});

try {
    const watcher = chokidar.watch(watchFiles, {
        persistent: true
    });

    watcher.on('ready', async () => {
        build();
    });

    watcher.on('unlink', async () => {
        build();
    });
} catch (error) {
    console.error(error);
}

async function build() {
    watchFiles.map(async (path) => {
        if (!fs.existsSync(path)) {
            const dep = deps.find((dep) => dep.watch === path);

            console.log(`rolling up ${path}...`);
            
            try {
                const bundle = await rollup({
                    input: dep.input,
                });
                const { output } = await bundle.generate({
                    compact: true,
                    format: 'iife',
                    file: dep.watch,
                    name: dep.name,
                });
                fs.writeFileSync(dep.watch, output[0].code);
            } catch (error) {
                console.error(error);
            }
        }
    });
    
}