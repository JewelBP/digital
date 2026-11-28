import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCizLhGsdZXyiJvGkebputzI8-7gWx0Gks",
    authDomain: "rmpmt-digital-phonebook.firebaseapp.com",
    databaseURL: "https://rmpmt-digital-phonebook-default-rtdb.firebaseio.com",
    projectId: "rmpmt-digital-phonebook",
    storageBucket: "rmpmt-digital-phonebook.appspot.com",
    messagingSenderId: "559683777015",
    appId: "1:559683777015:web:6d4e6669c7071e7f523ef2"
}; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
