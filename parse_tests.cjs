const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
  const failures = [];

  function processResult(task) {
    if (task.result && task.result.state === 'fail') {
      task.result.errors.forEach(err => {
        if (err.stack) {
          const match = err.stack.match(/server\/db\.ts:(\d+):(\d+)/);
          if (match) {
            failures.push({ name: task.name, file: 'server/db.ts', line: parseInt(match[1]), msg: err.message });
          } else {
             // maybe it's in routers?
             failures.push({ name: task.name, stack: err.stack.split('\n')[0], msg: err.message });
          }
        }
      });
    }
    if (task.tasks) {
      task.tasks.forEach(processResult);
    }
  }

  data.testResults.forEach(r => {
    processResult(r.assertionResults ? { tasks: r.assertionResults } : { tasks: r.tasks || (r.suite ? r.suite.tasks : []) }); // fallback
  });
  
  if (!failures.length) {
    data.testResults.forEach(r => {
      if (r.failed) {
        console.log("Failed suite:", r.name, r.message);
      }
    });
  }

  console.log(JSON.stringify(failures, null, 2));
} catch (e) {
  console.log("Error parsing:", e.message);
  // Try to find raw "server/db.ts:123" lines in the file
  const raw = fs.readFileSync('test-results.json', 'utf8');
  console.log("File length:", raw.length);
}
