
/* DAY 5 - FIREBASE AUTHENTICATION */

// 1. Import Firebase functions

import {auth} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


// 2. Firebase configuration
// Replace these example values with YOUR Firebase config.

const firebaseConfig = {

    apiKey: "AIzaSyDM49zvcawytuTaxd_QJVSvJIPwGplXF6M",

    authDomain: "lifelink-6b880.firebaseapp.com",

    projectId: "lifelink-6b880",

    storageBucket: "lifelink-6b880.firebasestorage.app",

    messagingSenderId: "676147018221",

    appId: "1:676147018221:web:19e2aeebee60556b2c8fe4"

};

// 4. Get HTML elements

const registerForm =
    document.getElementById("registerForm");

const loginForm =
    document.getElementById("loginForm");

const showLogin =
    document.getElementById("showLogin");

const authSwitch =
    document.getElementById("authSwitch");

const authDescription =
    document.getElementById("authDescription");

const authMessage =
    document.getElementById("authMessage");

const userSection =
    document.getElementById("userSection");

const userInfo =
    document.getElementById("userInfo");

const logoutButton =
    document.getElementById("logoutButton");


// 5. Display feedback

function showMessage(message, isError = false) {

    authMessage.textContent = message;

    authMessage.style.color =
        isError ? "#c62828" : "#16803d";

}


// 6. Switch between Login and Registration

showLogin.addEventListener("click", function () {

    registerForm.hidden = true;

    loginForm.hidden = false;

    authSwitch.hidden = true;

    authDescription.textContent =
        "Login to your LifeLink account.";

    showMessage("");

});


// 7. Registration

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    if (!name) {
        showMessage("Please enter your name.", true);
        return;
    }

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        // Save the user's display name
        await updateProfile(userCredential.user, {
            displayName: name
        });

        registerForm.reset();

        showMessage("Account created successfully!");

    } catch (error) {

        showMessage(error.message, true);

    }

});


// 8. Login

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginForm.reset();

        showMessage("Login successful!");

    } catch (error) {

        showMessage(error.message, true);

    }

});


// 9. Monitor login session

onAuthStateChanged(auth, function (user) {

    if (user) {

        // User is logged in

        registerForm.hidden = true;

        loginForm.hidden = true;

        authSwitch.hidden = true;

        userSection.hidden = false;

        authDescription.textContent =
            "Your LifeLink account is active.";

        userInfo.textContent =
            "Welcome, " +
            (user.displayName || user.email) +
            " (" + user.email + ")";

    } else {

        // User is logged out

        userSection.hidden = true;

        registerForm.hidden = false;

        loginForm.hidden = true;

        authSwitch.hidden = false;

        authDescription.textContent =
            "Create an account to get started.";

    }

});


// 10. Logout

logoutButton.addEventListener("click", async function () {

    try {

        await signOut(auth);

        showMessage("You have logged out successfully.");

    } catch (error) {

        showMessage(error.message, true);

    }

});

