"use strict";

const startedAt = Date.now();
console.log('started fetch at: ', new Date(startedAt));

try {
  await fetch('https://jsonplaceholder.typicode.com/todos/1');
} catch (error) {
  console.log(error);
}

const finishedAt = Date.now();
console.log('finished fetch at: ', new Date(finishedAt))

console.log(`fetch took ${finishedAt - startedAt} ms`)

console.log('timestamp when script should finish: ', Date.now())
