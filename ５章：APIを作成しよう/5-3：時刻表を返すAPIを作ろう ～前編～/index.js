const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.hello = functions.https.onRequest((request,response) => {
  if(request.query.name !== undefined){
    response.send("Hello " + request.query.name + " !");
  } else {
    response.send("Hello from Firebase!");
  }
});

// timetableapi関数の定義
exports.timetableapi = functions.https.onRequest((request,response) => {

  // CORS用にAccess-Control-Allow系ヘッダを追加
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
  response.set('Access-Control-Allow-Headers', 'Content-Type');

  let stoptimesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fstop_times.json?alt=media';
  let calendarurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar.json?alt=media';
  let calendar_datesurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Fcalendar_dates.json?alt=media';
  let tripsurl = 'https://firebasestorage.googleapis.com/v0/b/[Firebaseのプロジェクト名].appspot.com/o/'+request.query.agency_id+'%2Ftrips.json?alt=media'; 

  const https = require('https');

  https.get(stoptimesurl, function (res) {
    let buf = [];
    res.on('data', function(chunk) {
      buf.push(chunk);
    }).on('end', function() {
      let text   = Buffer.concat(buf);
      let stoptimes_result = JSON.parse(text);
      let a = [];
      for(let i=0;i<stoptimes_result.length;i++){
        if(stoptimes_result[i].stop_id!==request.query.stop_id) continue;
        a.push(stoptimes_result[i]);
      }
      
      // このパートでは、ここに追記していきます

      response.send(JSON.stringify(a));
      return;
    });
  });
  return;
});