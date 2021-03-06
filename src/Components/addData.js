// Copyright limyifan1 <limyifan1@gmail.com> 2020. All Rights Reserved.
// Node module: hawkercentral
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

let cheerio = require("cheerio");
const axios = require("axios");

const firebase = require("firebase");
require("firebase/firestore");
const data = require("../mrt_stations.json");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

firebase.initializeApp({
  apiKey: `${process.env.FIRESTORE_KEY}`,
  authDomain: "hawkercentral.firebaseapp.com",
  databaseURL: "https://hawkercentral.firebaseio.com",
  projectId: "hawkercentral",
  storageBucket: "hawkercentral.appspot.com",
  messagingSenderId: "596185831538",
  appId: "1:596185831538:web:9cbfb234d1fff146cf8aeb",
  measurementId: "G-Z220VNJFT9",
});

const db = firebase.firestore();

function capitalize_Words(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const addData = (data) => {
  let name;
  let line;
  let coords;
  data[0].data.allData.forEach((element) => {
    name = capitalize_Words(element[2].slice(0, -12));
    line = element[3];
    coords = element[0]["geometry"]["coordinates"];
    console.log(name, line, coords);
    db.collection("mrt")
      .add({
        name: name,
        station: line,
        coords: coords,
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
        // alert("Sent")
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        // alert("Failed")
      });
  });
};

const addCuisine = (data) => {
  data.forEach((element) => {
    db.collection("cuisine")
      .add({
        label: element.charAt(0).toUpperCase() + element.slice(1),
        value: element,
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
        // alert("Sent")
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
        // alert("Failed")
      });
  });
};

const getDoc = async () => {
  await db
    .collection("hawkers")
    .doc("3XC0EDF2stjpBDVCGAFu")
    .get()
    .then((snapshot) => {
      if (snapshot.exists) {
        console.log(snapshot.id);

        console.log(snapshot.data());
      }
      console.log("Fetched successfully!");
      return true;
    })
    .catch((error) => {
      console.log(error);
    });
};

// getData()
// addData(data)

var cuisines = [
  "American",
  "Healthy",
  "Sandwiches",
  "Asian",
  "Indian",
  "Seafood",
  "Bakery and Cakes",
  "Indonesia",
  "Local",
  "Beverages",
  "Italian",
  "Sushi",
  "Burgers",
  "Japanese",
  "Thai",
  "Chicken",
  "Korean",
  "Vegetarian",
  "Vegan",
  "Chinese",
  "Malay",
  "Vietnamese",
  "Dessert",
  "Malaysian",
  "Western",
  "Fast Food",
  "Meat",
  "Halal",
  "Pizza",
];
// addCuisine(cuisines)

function addData3({
  url,
  image2,
  image3,
  image4,
  image5,
  image6,
  name,
  cuisine,
  postal,
  street,
  unit,
  description,
  description_detailed,
  north,
  south,
  east,
  west,
  islandwide,
  delivery,
  price,
  contact,
  latitude,
  longitude,
  call,
  whatsapp,
  sms,
  inperson,
  opening,
  closing,
}) {
  console.log(name);
}

async function fetchHTML(url) {
  const { data } = await axios.get(url);
  return cheerio.load(data);
}

let callPostal = (postal) => {
  return fetch(
    "https://developers.onemap.sg/commonapi/search?searchVal=" +
      postal +
      "&returnGeom=Y&getAddrDetails=Y"
  )
    .then(function (response) {
      return response.json();
    })
    .then(
      function (jsonResponse) {
        return jsonResponse["results"][0];
      },
      (error) => {
        console.log(error);
      }
    );
};

async function getPostal(postal) {
  return await callPostal(postal).then((data) => {
    return {
      street: data["ADDRESS"],
      longitude: data["LONGITUDE"],
      latitude: data["LATITUDE"],
    };
  });
}

async function scrape(page) {
  const $ = await fetchHTML("https://thesmartlocal.com/delivery?page=" + page);
  var data = [];
  // Print the full HTML
  // console.log(`Site HTML: ${$.html()}\n\n`);
  // Print some specific page content
  $(".card").each(async (index, e) => {
    let address = $(e).find("a").text();
    let postalcode = $(e)
      .find("a")
      .text()
      .slice(address.length - 8, address.length);
    if (postalcode !== "") {
      postalcode = postalcode.slice(1, 7);
      var morePostal = await getPostal(postalcode);
      // console.log(morePostal);
      // data.push({
      //   description: $(e).find(".mb-1").text(),
      //   description_detailed: $(e).find(".mb-0").last().text(),
      //   lastmodified: new Date(),
      //   url: $(e).find("img").attr("src"),
      //   postal: postalcode,
      //   latitude: morePostal.latitude,
      //   longitude: morePostal.longitude,
      //   name: $(e).find(".card-title").text(),
      //   opening: $(e).find(".mb-0").eq(1).text(),
      //   street: morePostal.street,
      // });
      var region = $(e).find(".status").text();
      region =
        region === "Multiple"
          ? [{ label: "Islandwide", value: "islandwide" }]
          : [
              {
                label: region,
                value: region.toLowerCase(),
              },
            ];

      await db
        .collection("hawkers")
        .add({
          image2: "",
          image3: "",
          image4: "",
          image5: "",
          image6: "",
          unit: "",
          delivery: [],
          cuisine: [],
          region: region,
          price: "",
          contact: "",
          call: false,
          whatsapp: false,
          sms: false,
          inperson: true,
          website: "",
          promo: "",
          condition: "",
          description: $(e).find(".mb-1").text(),
          delivery_detail: $(e).find(".mb-0").last().text(),
          lastmodified: new Date(),
          url: $(e).find("img").attr("src"),
          postal: postalcode,
          latitude: morePostal.latitude,
          longitude: morePostal.longitude,
          name: $(e).find(".card-title").text(),
          opening: $(e).find(".mb-0").eq(1).text(),
          street: morePostal.street,
          delivery_option: true,
          pickup_option: true,
        })
        .then((snapshot) => {
          console.log("Fetched successfully!");
          return true;
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });
  return data;
}

// async function startScrape() {
//   let data = scrape()
//   return data
// }

// const addData2 = async () => {
//   var data = await scrape().then((d) => {
//     console.log(d);
//   });
//   // await db
//   //   .collection("hawkers")
//   //   .add({
//   //     name: "hi",
//   //   })
//   //   .then((snapshot) => {
//   //     snapshot.forEach((doc) => {
//   //       if (doc.exists) {
//   //         console.log(doc.id);
//   //         console.log(doc.data());
//   //       }
//   //     });
//   //     console.log("Fetched successfully!");
//   //     return true;
//   //   })
//   //   .catch((error) => {
//   //     console.log(error);
//   //   });
// };

// for(var i = 3; i <=14 ;i=i+1){
//   scrape(i);
// }

const getData = async () => {
  await db
    .collection("hawkers")
    .get()
    .then((snapshot) => {
      snapshot.forEach(async (doc) => {
        if (doc.exists) {
          await db
            .collection("hawkers")
            .doc(doc.id)
            .update({
              menu: false,
              menuitem: [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
              menuprice: [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
            });
        }
      });
      console.log("Fetched successfully!");
      return true;
    })
    .catch((error) => {
      console.log(error);
    });
};

const changeData = async () => {
  await db
    .collection("hawkers")
    .get()
    .then((snapshot) => {
      snapshot.forEach(async (doc) => {
        if (doc.exists) {
          let postal = await getPostal(doc.data().postal);

          console.log(postal.latitude, postal.latitude);
          if (postal !== undefined) {
            await db
              .collection("hawkers")
              .doc(doc.id)
              .update({
                longitude: postal.longitude,
                latitude: postal.latitude,
              })
              .catch((error) => {
                console.log(error);
              });
          }
          // let opening = doc.data().opening.slice(0,1) === '\n' ? doc.data().opening.slice(1,doc.data().opening.length) === '\n':doc.data().opening
        }
      });
      console.log("Fetched successfully!");
      return true;
    })
    .catch((error) => {
      console.log(error);
    });
};

// changeData();

const test = async () => {
  console.log(await getPostal(730366));
};

// changeData();

const retrieveData = async () => {
  let data = [];
  const csvWriter = createCsvWriter({
    path: "out.csv",
    header: [
      { id: "sms", title: "sms" },
      { id: "opening", title: "opening" },
      { id: "lastmodified", title: "lastmodified" },
      { id: "image3", title: "image3" },
      { id: "postal", title: "postal" },
      { id: "latitude", title: "latitude" },
      { id: "image6", title: "image6" },
      { id: "name", title: "name" },
      { id: "whatsapp", title: "whatsapp" },
      { id: "street", title: "street" },
      { id: "cuisine", title: "cuisine" },
      { id: "image4", title: "image4" },
      { id: "image5", title: "image5" },
      { id: "inperson", title: "inperson" },
      { id: "menuitem", title: "menuitem" },
      { id: "pickup_option", title: "pickup_option" },
      { id: "website", title: "website" },
      { id: "delivery_detail", title: "delivery_detail" },
      { id: "unit", title: "unit" },
      { id: "call", title: "call" },
      { id: "longitude", title: "longitude" },
      { id: "image2", title: "image2" },
      { id: "description", title: "description" },
      { id: "claps", title: "claps" },
      { id: "condition", title: "condition" },
      { id: "delivery", title: "delivery" },
      { id: "url", title: "url" },
      { id: "region", title: "region" },
      { id: "description_detail", title: "description_detail" },
      { id: "menuprice", title: "menuprice" },
      { id: "promo", title: "promo" },
      { id: "menu", title: "menu" },
      { id: "delivery_option", title: "delivery_option" },
      { id: "contact", title: "contact" },
      { id: "price", title: "price" },
    ],
  });
  await db
    .collection("hawkers")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        if (doc.exists) {
          let temp = doc.data();
          temp["lastmodified"] = "";
          temp["cuisine"] = "";
          temp["menuprice"] = "";
          temp["menuitem"] = "";
          temp["region"] = "";
          temp["delivery"] = "";
          data.push(temp);
        }
      });
      console.log("Fetched successfully!");
      return true;
    })
    .catch((error) => {
      console.log(error);
    });
  console.log(data);
  csvWriter
    .writeRecords(data) // returns a promise
    .then(() => {
      console.log("...Done");
    })
    .catch((error) => {
      console.log(error);
    });
};

retrieveData();
