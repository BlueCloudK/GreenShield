export function createWorkQueue(concurrency = 2) {
  const waiting = [];
  let running = 0, sequence = 0;
  function pump() {
    while (running < concurrency && waiting.length) {
      const job = waiting.shift();
      running += 1;
      Promise.resolve().then(job.run).then(job.resolve, job.reject).finally(() => { running -= 1; pump(); });
    }
  }
  return {
    enqueue(run, priority = 0) {
      return new Promise((resolve, reject) => {
        waiting.push({ run, priority, sequence: sequence++, resolve, reject });
        waiting.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
        setImmediate(pump);
      });
    },
  };
}
