# fetch_timeout_poc

## Steps to reproduce bug

### QEMU VM approach (preferred)

1. download [compressed qemu vm disk image I've built after following steps from QEMU VM approach from scratch](https://mega.nz/file/rKBAyRIB#LOBRCBkbilBIiGbu_bkGFxERaK1hP-Wsch0f2SdSfiI)
2. install `zstd` and `qemu`
3. run `zstd -d archlinux.qcow2.zst` to decompress it on host
4. create and run new QEMU vm in UEFI mode with mounted `archlinux.qcow2` disk
5. in vm login into `root` user with `0000` password
6. in vm run `cd fetch_timeout_poc/; npm start`

### QEMU VM approach from scratch

1. install `qemu`
2. [download latest arch iso](https://archlinux.org/download/)
3. create and run new QEMU vm with mounted arch.iso in UEFI mode and set boot priority to booting from cd-rom first
4. in vm when will options to boot from installation media be presented, choose the first one
5. in vm run following commands one-by-one
   ```bash
   git clone https://github.com/nikelborm/fetch_timeout_poc.git;
   archinstall --silent --config ./fetch_timeout_poc/vm.archinstall.user_configuration.json --creds ./fetch_timeout_poc/vm.archinstall.user_credentials.json;
   reboot;
   ```
6. in vm login into newly installed arch with `root` user and `0000` password
7. in vm run following commands one-by-one
   ```bash
   touch .bashrc;
   echo '. .bashrc' > .profile;
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash;
   git clone https://github.com/nikelborm/fetch_timeout_poc.git;
   cp ./fetch_timeout_poc/vm.wg.conf /etc/wireguard/wg0.conf;
   . .bashrc;
   nvm list-remote;
   nvm i 21;
   systemctl enable wg-quick@wg0.service;
   systemctl start wg-quick@wg0.service;
   cd fetch_timeout_poc/;
   npm start
   ```

To copy files between vm and host:
1. on receiving side run `netcat -l -p 1234 > /destination.file`
2. on sending side run `cat /source.file | netcat 192.168.___.___ 1234`
3. on sending side press `Ctrl + C`

To fix internet (make internet work fine) in vm run `wg-quick down wg0`
To break internet (return conditions where bug appears) in vm run `wg-quick up wg0`

### Host approach

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

### Running using node-fetch with described network configuration

If we install `node-fetch` with `npm i node-fetch` and then import it in the beginning using `import fetch from 'node-fetch';` it will replace original fetch and will give us different behavior:

```plaintext
started fetch at:  2023-10-21T01:48:05.984Z
FetchError: request to https://jsonplaceholder.typicode.com/todos/1 failed, reason: getaddrinfo EAI_AGAIN jsonplaceholder.typicode.com
    at ClientRequest.<anonymous> (file:///home/nikel/projects/alarm/node_modules/node-fetch/src/index.js:108:11)
    at ClientRequest.emit (node:events:517:28)
    at TLSSocket.socketErrorListener (node:_http_client:501:9)
    at TLSSocket.emit (node:events:517:28)
    at emitErrorNT (node:internal/streams/destroy:151:8)
    at emitErrorCloseNT (node:internal/streams/destroy:116:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21) {
  type: 'system',
  errno: 'EAI_AGAIN',
  code: 'EAI_AGAIN',
  erroredSysCall: 'getaddrinfo'
}
finished fetch at:  2023-10-21T01:50:06.143Z
fetch took 120159 ms
timestamp when script should finish:  1697853006143
timestamp when script actually finished:  1697853006236
```

When `fetch` from `node-fetch` fails, it logs last few lines to console and script exits immediately. Difference between `timestamp when script should finish` and `timestamp when script actually finished` is 93 ms what also seems fine.

The interesting thing is that `fetch` from `node-fetch` throws the same error as error thrown by original fetch when vpn disabled and notebook completely offline.

`fetch` from `node-fetch` returns control after 120 seconds. Original fetch returns control after 10 seconds and then hangs in the background 110 seconds. Looks very suspicious (`120 == 110 + 10`).
