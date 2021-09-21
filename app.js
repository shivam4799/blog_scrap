const mongoose = require("mongoose");

const puppeteer = require("puppeteer");
var cron = require("node-cron");


// const { id, password } = require("../secrate");
const Sleep = require("./sleep");
const Popular = require("./models/popular");
const Post = require("./models/post");
const Source = require("./models/source");


const finologyData = async (url,page)=>{
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await Sleep(5000);

  let temp = await page.evaluate(async () => {
    const swiperSelector = document.querySelectorAll("#MainContent_pnlTopPosts > div > div.swiper-wrapper")[0].children;
    let data = [];
    const meta = document.querySelectorAll("head > link[rel='apple-touch-icon']");
    let sourceImage = meta[meta.length - 1].href;

    for (let i = 0; i < swiperSelector.length; i++) {
      let url = swiperSelector[i].children[0].querySelectorAll(".postlnk")[0].href;
      let image = swiperSelector[i].children[0].querySelectorAll("img")[0].src;
      let title = swiperSelector[i].children[0].querySelectorAll("h2")[0].textContent;
      let topic = swiperSelector[i].children[0].querySelectorAll("span")[0].textContent;
      data.push({
        originId: url,
        id:title,
        title,
        image,
        topic,
        source: {
          image: sourceImage,
          url: "https://blog.finology.in/",
          title: "Finology blog",
          id: "https://blog.finology.in/",
        },
      });
    }
    return data;
  });

  for (let i = 0; i < temp.length; i++) {
    const post = temp[i];

    await page.goto(`${post.originId}`, {
      waitUntil: "networkidle2",
    });
    await Sleep(5000);
    // let tempData = {};

    let temp2 = await page.evaluate(async () => {
      let data = {};
      let date = document
        .querySelectorAll("#frmContent > div.pagecontent > div > div > div > div:nth-child(1) > small:nth-child(2)")[0]
        .textContent.trim();
      date = new Date(date).getTime();
      let author = "finology";
/*document
        .querySelectorAll("#MainContent_pnlAuthor > div > div > div > div.col-12.col-md-9 > span.h5.mt-1.d-block")[0]
        .textContent.split("|")[0]
        .trim();*/
      data.author = author;
      data.published = Number(date);
      return data;
    });
    temp[i].author = temp2.author;
    temp[i].published = temp2.published;

  }
  return temp;
}

const indMonyData = async (url,page)=>{
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  await Sleep(5000);

  let temp = await page.evaluate(async () => {

    let sel = document.querySelectorAll("section .row")[1].children;

    let data = [];
    let length = 3;
    if(sel.length < 3){
      length = sel.length
    }
    for (let i = 0; i < length; i++) {
      let url = sel[i].querySelector("a").href;
      let image = sel[i].querySelector("img").src;
      let title = sel[i].querySelector("h2").textContent;
      let date = sel[i].querySelector(".card-body > span").textContent.split("|")[0].trim();
      date = new Date(date).getTime();

      let topic = "";

      data.push({
        originId: url,
        id:title,
        title,
        image,
        topic,
        published:Number(date),
        source: {
          image: "https://www.indmoney.com/favicon.ico",
          url: "https://www.indmoney.com/articles",
          title: "indmoney blog",
          id: "https://www.indmoney.com/articles",
        },
      });
    }
    return data;
  });
  for (let i = 0; i < temp.length; i++) {
    const post = temp[i];

    await page.goto(`${post.originId}`, {
      waitUntil: "networkidle2",
    });
    await Sleep(5000);

    let temp2 = await page.evaluate(async () => {
      let data = {};
      let topic = document.querySelector("div.max-w-4xl > div.flex.flex-row.my-3 > a > div").textContent;
      data.topic = topic;
      return data;
    });
    temp[i].topic = temp2.topic;
  }
  return temp;
}
const getdata = async (data) => {
  const browser = await puppeteer.launch({ headless: true });
  await Sleep(2000);
  let page = await browser.newPage();
  await Sleep(3000);

  let finology=[] ,indMony=[];
  for (let i = 0; i < data.length; i++) {
    const source = data[i];
    console.log(source);
    let d = [];
    if(source.name == "finology"){

      finology = await finologyData(source.url,page);
    }
    else if(source.name == "indMony"){
      indMony = await indMonyData(source.url,page);
    }
  }
  console.log("final",finology.length,indMony.length);
  browser.close();
  return [...finology,...indMony];
};
console.log("start web server");
cron.schedule("0 11 * * *", async () => {
  console.log("web scrapper run 11");
  try {
    const uri = "mongodb+srv://shivam:shivam4799@daily-finance.ylo7q.mongodb.net/production?retryWrites=true&w=majority";

    let db = await mongoose.connect(uri)

    let data = await getdata([{name:"finology",url:"https://blog.finology.in/investing"},{name:"indMony",url:"https://www.indmoney.com/articles"}]);
    // console.log(data);
    let postData = [];
    let popularData = [];

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    shuffleArray(data);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      let source = await Source.findOne({ id: item.source.id });
      if(!source){
        await Source.create({
          id:item.source.id,
          title:item.source.title,
          url:item.source.url,
          categories: [],
          topics: [],
          updated:"",
          image:item.source.image,
          posts: [],
          items:[]
        });
      }

      let post = await Post.findOne({ id: item.id });
      let newPost = null;
      if (!post) {
        let { id, topic, published, originId, title, author, image, source } = item;
        newPost = {
          id,
          keywords: [topic],
          originId,
          published,
          title,
          author,
          canonicalUrl: "",
          image,
          source,
        };
        postData.push(newPost);
      }

      let popular = await Popular.findOne({ name: item.id });

      if (!popular) {
        popularData.push({ name: item.id });
      }
    }

    Promise.all([await Post.create(postData), await Popular.create(popularData)]).then((values) => {
      console.log("success popular", postData.length, popularData.length);
      db.disconnect();
    });
  } catch (error) {
    console.log(error);
  }
});

cron.schedule("0 15 * * *", async () => {
  console.log("web scrapper run 15");
  try {
    const uri = "mongodb+srv://shivam:shivam4799@daily-finance.ylo7q.mongodb.net/production?retryWrites=true&w=majority";

    let db = await mongoose.connect(uri)

    let data = await getdata([{name:"finology",url:"https://blog.finology.in/finance"}]);
    // console.log(data);
    let postData = [];
    let popularData = [];

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    shuffleArray(data);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      let source = await Source.findOne({ id: item.source.id });
      if(!source){
        await Source.create({
          id:item.source.id,
          title:item.source.title,
          url:item.source.url,
          categories: [],
          topics: [],
          updated:"",
          image:item.source.image,
          posts: [],
          items:[]
        });
      }

      let post = await Post.findOne({ id: item.id });
      let newPost = null;
      if (!post) {
        let { id, topic, published, originId, title, author, image, source } = item;
        newPost = {
          id,
          keywords: [topic],
          originId,
          published,
          title,
          author,
          canonicalUrl: "",
          image,
          source,
        };
        postData.push(newPost);
      }

      let popular = await Popular.findOne({ name: item.id });

      if (!popular) {
        popularData.push({ name: item.id });
      }
    }

    Promise.all([await Post.create(postData), await Popular.create(popularData)]).then((values) => {
      console.log("success popular", postData.length, popularData.length);
      db.disconnect();
    });
  } catch (error) {
    console.log(error);
  }
});

cron.schedule("0 20 * * *", async () => {
  console.log("web scrapper run 20");
  try {
    const uri = "mongodb+srv://shivam:shivam4799@daily-finance.ylo7q.mongodb.net/production?retryWrites=true&w=majority";

    let db = await mongoose.connect(uri)

    let data = await getdata([{name:"finology",url:"https://blog.finology.in/ticker-talks"}]);
    // console.log(data);
    let postData = [];
    let popularData = [];

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    shuffleArray(data);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      let source = await Source.findOne({ id: item.source.id });
      if(!source){
        await Source.create({
          id:item.source.id,
          title:item.source.title,
          url:item.source.url,
          categories: [],
          topics: [],
          updated:"",
          image:item.source.image,
          posts: [],
          items:[]
        });
      }

      let post = await Post.findOne({ id: item.id });
      let newPost = null;
      if (!post) {
        let { id, topic, published, originId, title, author, image, source } = item;
        newPost = {
          id,
          keywords: [topic],
          originId,
          published,
          title,
          author,
          canonicalUrl: "",
          image,
          source,
        };
        postData.push(newPost);
      }

      let popular = await Popular.findOne({ name: item.id });

      if (!popular) {
        popularData.push({ name: item.id });
      }
    }

    Promise.all([await Post.create(postData), await Popular.create(popularData)]).then((values) => {
      console.log("success popular", postData.length, popularData.length);
      db.disconnect();
    });
  } catch (error) {
    console.log(error);
  }
});


