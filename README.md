# fetch_timeout_poc

## Steps to reproduce bug

1. enable wifi and connect to network with internet
2. connect to wireguard vpn with sending all trafic through this vpn server
3. disable wifi
4. run `npm start`

## Current behavior

Fetch is being executed as expected. It kills itself after about 10 seconds and then returns control back to the script.
But the problem is that somthing in the background is still blocking node.js and does not allow process to exit. It just hangs waiting for something to finish even if script was completed.

```plaintext
started fetch at:  2023-10-21T00:37:09.239Z
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///home/nikel/projects/alarm/index.js:7:3 {
  cause: _ConnectTimeoutError: Connect Timeout Error
      at onConnectTimeout (node:internal/deps/undici/undici:6616:28)
      at node:internal/deps/undici/undici:6574:50
      at Immediate._onImmediate (node:internal/deps/undici/undici:6605:13)
      at process.processImmediate (node:internal/timers:478:21) {
    code: 'UND_ERR_CONNECT_TIMEOUT'
  }
}
finished fetch at:  2023-10-21T00:37:19.391Z
fetch took 10152 ms
timestamp when script should finish:  1697848639391
timestamp when script actually finished:  1697848749482
```

After all code in the script been executed it takes 110 seconds (`1697848749482 - 1697848639391 = 110091`) to exit from process.

But enabling wifi back (restoring internet connection) during process's hanging (after the moment fetch already failed and logged error) magically speeds up exit from process.

## Expected behavior

Timeout of fetch itself and the error thrown are left unchanged. But **script exits immediately after it completed.** Difference between `timestamp when script should finish` and `timestamp when script actually finished` should be near zero.

## Other behaviors

### Running completely offline

If we skip 1-2 steps and just run script offline we get other kind of error and expected behavior.

Following is being printed to console:

```plaintext
started fetch at:  2023-10-21T00:54:31.085Z
TypeError: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11372:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async file:///home/nikel/projects/alarm/index.js:7:3 {
  cause: Error: getaddrinfo EAI_AGAIN jsonplaceholder.typicode.com
      at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:118:26) {
    errno: -3001,
    code: 'EAI_AGAIN',
    syscall: 'getaddrinfo',
    hostname: 'jsonplaceholder.typicode.com'
  }
}
finished fetch at:  2023-10-21T00:54:31.250Z
fetch took 165 ms
timestamp when script should finish:  1697849671250
timestamp when script actually finished:  1697849671310
```

Difference between `timestamp when script should finish` and `timestamp when script actually finished` is 60 ms what is fine.

### Running online

If we skip 3 step and just run script online we get no errors and expected behavior.

Following is being printed to console:

```plaintext
started fetch at:  2023-10-21T00:58:19.347Z
finished fetch at:  2023-10-21T00:58:19.995Z
fetch took 648 ms
timestamp when script should finish:  1697849899995
timestamp when script actually finished:  1697849900162
```

Difference between `timestamp when script should finish` and `timestamp when script actually finished` is 167 ms what also seems fine.
