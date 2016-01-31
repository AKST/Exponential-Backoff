import ExpotenialBackoff from "../src";


function resetEveryMinute(cron, key) {
  if (cron.nextWaitPeriod > (1000 * 60)) {
    // takes the backoff to the start
    cron.reset();
  }

  const period = cron.nextWaitPeriod;
  const ms      = Math.floor(period % 1000);
  const seconds = Math.floor(period / 1000);

  console.log(`next waiting period in \`${seconds}.${ms}\``);

  //
  // queue can only be triggered while running with key before function returns
  //
  cron.queue(key);
}


const eb = new ExpotenialBackoff({ callback: resetEveryMinute });
eb.trigger();
