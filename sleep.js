module.exports = Sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// (async () => {
//   console.log("hello");
//   await sleep(2000);
//   console.log("hello2");
//   console.log("hello3");
//   await sleep(2000);
//   console.log("hello4");
// })();
