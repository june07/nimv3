module.exports = [
	"metadata",
	{
		"title": "r720",
		"uuid": "6f058b6a-d3d4-526e-9f15-8a1cd9e51692",
		"host": "r720",
		"content": "10446261.15 linux 5.4.0-125-generic",
		"connections": {
			"1197768": {
				"platform": "linux",
				"memory": 0.1,
				"cpu": 3.1,
				"ppid": 1197767,
				"cmd": "node --inspect=9321 agent.js",
				"name": "node",
				"pid": 1197768,
				"nodeInspectFlagSet": true,
				"nodeInspectSocket": "127.0.0.1:9321",
				"inspectPort": 9321,
				"tunnelSocket": {
					"socket": "stun-ec2-us-west-1-0.brakecode.com:15452",
					"host": "stun-ec2-us-west-1-0.brakecode.com",
					"port": 15452,
					"cid": "b48e589b-decf-5b7a-bd8e-be4b732e0ef9"
				}
			},
			"1208542": {
				"platform": "linux",
				"memory": 0.1,
				"cpu": 0.4,
				"ppid": 1208541,
				"cmd": "node /home/***redacted***/code/brakecode-dashboard/node_modules/.bin/vite",
				"name": "node",
				"pid": 1208542,
				"nodeInspectFlagSet": false
			},
			"2339757": {
				"platform": "linux",
				"memory": 0,
				"cpu": 0,
				"ppid": 2339409,
				"cmd": "docker service logs -f --tail 100 haproxy_haproxy",
				"name": "docker",
				"pid": 2339757,
				"dockerContainer": true,
				"nodeInspectFlagSet": false,
				"inspectPort": 9237,
				"tunnelSocket": {
					"socket": "stun-ec2-us-west-1-0.brakecode.com:12482",
					"host": "stun-ec2-us-west-1-0.brakecode.com",
					"port": 12482,
					"cid": "ce18e9f8-05ed-5ab9-9518-593737e78cfe"
				}
			},
			"2341557": {
				"platform": "linux",
				"memory": 0,
				"cpu": 0,
				"ppid": 2341368,
				"cmd": "/home/***redacted***/.deno/bin/deno run --inspect=127.0.0.1:5678 ./hello-world.js",
				"name": "deno",
				"pid": 2341557,
				"nodeInspectFlagSet": true,
				"nodeInspectSocket": "127.0.0.1:5678",
				"inspectPort": 5678,
				"tunnelSocket": {
					"socket": "stun-ec2-us-west-1-0.brakecode.com:17252",
					"host": "stun-ec2-us-west-1-0.brakecode.com",
					"port": 17252,
					"cid": "f99ba0b9-c466-5abc-bb98-b699bb25dcd4"
				}
			},
			"2417521": {
				"platform": "linux",
				"memory": 0,
				"cpu": 0,
				"ppid": 2417470,
				"cmd": "npm",
				"name": "node",
				"pid": 2417521,
				"nodeInspectFlagSet": false
			},
			"2418001": {
				"platform": "linux",
				"memory": 0,
				"cpu": 0,
				"ppid": 2418000,
				"cmd": "node --inspect=0.0.0.0 node-reports.js",
				"name": "node",
				"pid": 2418001,
				"nodeInspectFlagSet": true,
				"nodeInspectSocket": {}
			},
			"2418076": {
				"platform": "linux",
				"memory": 0.1,
				"cpu": 0.7,
				"ppid": 2418075,
				"cmd": "node --inspect=0.0.0.0 index.js",
				"name": "node",
				"pid": 2418076,
				"nodeInspectFlagSet": true,
				"nodeInspectSocket": {}
			}
		},
		"tunnelSockets": {
			"1121577": {
				"socket": "stun-ec2-us-west-1-0.brakecode.com:12482",
				"host": "stun-ec2-us-west-1-0.brakecode.com",
				"port": 12482,
				"cid": "ce18e9f8-05ed-5ab9-9518-593737e78cfe"
			},
			"1197768": {
				"socket": "stun-ec2-us-west-1-0.brakecode.com:15452",
				"host": "stun-ec2-us-west-1-0.brakecode.com",
				"port": 15452,
				"cid": "b48e589b-decf-5b7a-bd8e-be4b732e0ef9"
			},
			"2339757": {
				"socket": "stun-ec2-us-west-1-0.brakecode.com:12482",
				"host": "stun-ec2-us-west-1-0.brakecode.com",
				"port": 12482,
				"cid": "ce18e9f8-05ed-5ab9-9518-593737e78cfe"
			},
			"2341557": {
				"socket": "stun-ec2-us-west-1-0.brakecode.com:17252",
				"host": "stun-ec2-us-west-1-0.brakecode.com",
				"port": 17252,
				"cid": "f99ba0b9-c466-5abc-bb98-b699bb25dcd4"
			}
		}
	}
]
