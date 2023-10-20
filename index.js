"use strict";

let shouldExit = false;

process.on('SIGINT', () => {
  shouldExit = true;
  console.log('Received SIGINT. Exiting...');
});

while(!shouldExit) {
  try {
    await fetch('https://jsonplaceholder.typicode.com/todos/1');
  } catch (error) {
    console.error('Error while fetching occurred:', error);
    continue;
  }
  console.log(`done request`);
}

console.log(`exited from while`);
