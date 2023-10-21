# fetch_timeout_poc

Steps to reproduce bug:

1. enable wifi and connect to network with internet
2. connect to wireguard vpn with sending all trafic through this vpn server
3. disable wifi
4. run `npm start`
5. Immediatly press `Ctrl + C`
6. Expect `^CReceived SIGINT. Exiting...` to be immediately printed
```
Error while fetching occurred: TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///home/nikel/projects/alarm/index.js:12:5 {
  cause: _ConnectTimeoutError: Connect Timeout Error
      at onConnectTimeout (node:internal/deps/undici/undici:6616:28)
      at node:internal/deps/undici/undici:6574:50
      at Immediate._onImmediate (node:internal/deps/undici/undici:6605:13)
      at process.processImmediate (node:internal/timers:478:21) {
    code: 'UND_ERR_CONNECT_TIMEOUT'
  }
}
```
