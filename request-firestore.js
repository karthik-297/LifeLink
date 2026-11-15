
import { auth, db } from "./firebase-config.js";

import { onAuthStateChanged } from
"https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const requestForm = document.getElementById("requestForm");
const requestMessage = document.getElementById("requestMessage");

requestForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Check whether the user is logged in.
    const user = auth.currentUser;

    if (!user) {
        requestMessage.textContent =
            "Please log in before submitting a request.";

        return;
    }

    // Collect the form values.
    const requestData = {
        name: document.getElementById("referenceName").value.trim(),

        blood: document.getElementById("bloodGroup").value,

        units: Number(document.getElementById("units").value),

        hospital: document.getElementById("hospital").value.trim(),

        date: document.getElementById("requiredDate").value,

        email: document.getElementById("email").value.trim(),

        details: document.getElementById("details").value.trim(),

        status: "Pending Verification",

        createdBy: user.uid,

        createdAt: serverTimestamp()
    };

    try {
        requestMessage.textContent = "Submitting your request...";

        // Save the request in Firestore.
        const documentReference = await addDoc(
            collection(db, "requests"),
            requestData
        );

        console.log("Request saved with ID:", documentReference.id);

        requestMessage.textContent =
            "Demo request submitted successfully!";

        requestForm.reset();

    } catch (error) {
        console.error("Firestore error:", error);

        requestMessage.textContent =
            "Could not submit the request. Please try again.";

    }
});
