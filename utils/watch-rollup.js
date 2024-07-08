const fs = require('fs')
const { rollup } = require('rollup')
const chokidar = require('chokidar')

const watchDir = 'dist'
const deps = [
    {
        input: 'node_modules/uuid/dist/esm-browser/v5.js',
        watch: `${watchDir}/uuidv5.min.js`,
        name: 'uuidv5'
    },
    {
        input: 'node_modules/algoliasearch/dist/algoliasearch.esm.browser.js',
        watch: `${watchDir}/algoliasearch.min.js`,
        name: 'algoliasearch'
    },
    {
        input: 'node_modules/nanoid/index.browser.js',
        watch: `${watchDir}/nanoid.min.js`,
        name: 'nanoid'
    },
    {
        input: 'node_modules/tweetnacl/nacl-fast.min.js',
        watch: `${watchDir}/nacl-fast.min.js`,
    },
    {
        input: 'node_modules/tweetnacl-util/nacl-util.min.js',
        watch: `${watchDir}/nacl-util.min.js`,
    },
    {
        input: 'node_modules/async/dist/async.min.js',
        watch: `${watchDir}/async.min.js`,
    },
    {
        input: 'node_modules/socket.io-client/dist/socket.io.min.js',
        watch: `${watchDir}/socket.io.min.js`,
    }
]
const watchFiles = deps.map(dep => dep.watch)

console.log({ watchFiles })

if (!fs.existsSync(watchDir)) {
    fs.mkdirSync(watchDir)
}
const watcher = chokidar.watch(watchFiles, {
    persistent: process.env.NODE_ENV === 'production' ? false : true
})

watcher.on('ready', async () => {
    build()
})

watcher.on('unlink', async () => {
    build()
})

async function build() {
    watchFiles.map(async (path) => {
        if (!fs.existsSync(path)) {
            const dep = deps.find((dep) => dep.watch === path)

            if (dep.input.match(/nacl-fast|nacl-util|async|socket.io/)) {
                console.log(`copying dep ${dep.input} to ${dep.watch}`)
                fs.copyFileSync(dep.input, dep.watch)
            } else {
                console.log(`rolling up ${path}...`)
                try {
                    const bundle = await rollup({
                        input: dep.input,
                    })
                    const { output } = await bundle.generate({
                        compact: true,
                        format: 'iife',
                        file: dep.watch,
                        name: dep.name,
                    })
                    fs.writeFileSync(dep.watch, output[0].code)
                } catch (error) {
                    console.error(error)
                }
            }
        }
    })

}