import fs from 'fs'
import { createHash } from 'crypto'
import { eachOfLimit } from 'async'
import algoliasearch from 'algoliasearch'

const appID = 'EUFO29W4LA'
const apiKey = '59ad37c5752020c3dc125d5347f545a9'
const client = algoliasearch(appID, apiKey)

async function algolia(version, obj) {
    // Create a new index and add a record
    const index = client.initIndex(`${version}_index`)
    const record = { objectID: createHash('md5').update(JSON.stringify(obj)).digest('hex'), obj }

    console.log(`Adding ${record.objectID} to ${version}_index`)
    await index.saveObject(record).wait()
}
function traverseAndExtractRecords(obj, parentContext = {}, records = []) {
    if (typeof obj !== 'object' || obj === null) return records

    if (Array.isArray(obj)) {
        obj.forEach(item => traverseAndExtractRecords(item, parentContext, records))
    } else {
        // Extract current context information
        const currentContext = {
            ...parentContext,
            ...obj
        }

        // Remove nested objects for the record to be added
        const record = { ...currentContext }
        for (const key in record) {
            if (typeof record[key] === 'object') {
                delete record[key]
            }
        }

        // Add the record if it has meaningful information (customize as needed)
        if (record.name && record.desc) {
            records.push(record)
        }

        // Continue traversal
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                traverseAndExtractRecords(obj[key], currentContext, records)
            }
        }
    }

    return records
}

(async () => {
    const version = 'latest-v20.x'
    const json = JSON.parse(fs.readFileSync(`./${version}.json`))

    const records = traverseAndExtractRecords(json)

    eachOfLimit(records, 50, async (record, index) => {
        await algolia(version, record)
        console.log(`Indexed ${index} of ${records.length} records to Algolia`)
    }, (err) => {
        if (err) {
            console.error(`Error indexing records: ${err.message}`)
        }
    })
})()
