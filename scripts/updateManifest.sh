#!/bin/bash
package_version=$(cat package.json | jq .version)
sed -i -E "s/\"version\":\s\"([^\"]*)\"/\"version\": $package_version/g" manifest.json
sed -i -E "s/\"version_name\":\s\"([^\"]*)\"/\"version_name\": $package_version/g" manifest.json
