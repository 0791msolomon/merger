import * as firebase from 'firebase'

var config = {
  apiKey: "AIzaSyCXXDxahLPWWiHDiTjPRZWcefuIkUHVd9U",
  authDomain: "rtr-dash-demo-221116.firebaseapp.com",
  databaseURL: "https://rtr-dash-demo-221116.firebaseio.com",
  projectId: "rtr-dash-demo-221116",
  storageBucket: "rtr-dash-demo-221116.appspot.com",
  messagingSenderId: "973489559318"
};
firebase.initializeApp(config);

const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

const googleAuthProvider = new firebase.auth.GoogleAuthProvider();


export { firebase, db, auth, storage, googleAuthProvider };
