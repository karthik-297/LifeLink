
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    collection,
    onSnapshot,
    doc,
    writeBatch,
    serverTimestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { sendLifeLinkEmail } from "./email.js";


// Approved coordinator UID
const COORDINATOR_UID = "UyzkC46RbjTMWw6wvxSgjCXUH0a2";


// HTML elements
const requestList = document.getElementById("requestList");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const verifiedCount = document.getElementById("verifiedCount");
const rejectedCount = document.getElementById("rejectedCount");

const refreshButton = document.getElementById("refreshButton");
const donorResponseList = document.getElementById("donorResponseList");


// Check HTML elements
const requiredElements = {
    requestList,
    totalCount,
    pendingCount,
    verifiedCount,
    rejectedCount,
    refreshButton,
    donorResponseList
};

for (const [name, element] of Object.entries(requiredElements)) {
    if (!element) {
        console.error(`Missing HTML element: ${name}`);
    }
}


// Helper function
function addText(parent, text, tag = "p") {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
}


// Display requests and statistics
function displayRequests(requests) {

    requestList.replaceChildren();

    totalCount.textContent = requests.length;

    pendingCount.textContent =
        requests.filter(r => r.status === "Pending Verification").length;

    verifiedCount.textContent =
        requests.filter(r => r.status === "Verified").length;

    rejectedCount.textContent =
        requests.filter(r => r.status === "Rejected").length;


    if (requests.length === 0) {
        addText(requestList, "No requests found.");
        return;
    }


    requests.forEach(request => {

        const card = document.createElement("div");
        card.className = "request-card";

        addText(card, "Reference: " + request.name, "h3");
        addText(card, "Blood group: " + request.blood);
        addText(card, "Units: " + request.units);
        addText(card, "Area: " + request.hospital);
        addText(card, "Required date: " + request.date);
        addText(card, "Status: " + request.status);


        if (request.status === "Pending Verification") {

            const verifyButton = document.createElement("button");
            verifyButton.textContent = "Mark Verified";
            verifyButton.className = "verify-btn";

            verifyButton.addEventListener("click", () => {
                changeStatus(request, "Verified");
            });


            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Mark Rejected";
            rejectButton.className = "reject-btn";

            rejectButton.addEventListener("click", () => {
                changeStatus(request, "Rejected");
            });


            card.appendChild(verifyButton);
            card.appendChild(rejectButton);
        }

        requestList.appendChild(card);
    });
}


// Update request status and create a safe donor listing

async function changeStatus(request, newStatus) {

    try {

        const batch = writeBatch(db);

        const requestRef = doc(db, "requests", request.id);

        batch.update(requestRef, {
            status: newStatus
        });

        // Create donor listing only when verified
        if (newStatus === "Verified") {

            const listingRef = doc(
                db,
                "donorListings",
                request.id
            );

            batch.set(listingRef, {
                bloodGroup: request.blood,
                units: request.units,
                area: request.hospital,
                requiredDate: request.date,
                status: "Open",
                createdAt: serverTimestamp()
            });
        }

        // Save the request status and donor listing
        await batch.commit();

        console.log("Request status updated successfully.");

        // Prepare notification message
        let notificationMessage = "";

        if (newStatus === "Verified") {
            notificationMessage =
                "Good news! Your blood request has been verified.";
        }
        else if (newStatus === "Rejected") {
            notificationMessage =
                "Your blood request has been rejected. Please contact the coordinator.";
        }

        // Create notification for requester
        await createNotification(
            request.createdBy,
            request.id,
            notificationMessage
        );

        // Send email notification to requester
await sendLifeLinkEmail(
    request.email,
    notificationMessage,
    request.id
);

    } catch (error) {

        console.error("Status update failed:", error);

        alert("Could not update the request. Check Firestore permissions.");

    }
}



// Display donor responses
function displayDonorResponses(responses) {

    donorResponseList.replaceChildren();

    if (responses.length === 0) {
        addText(donorResponseList, "No donor responses yet.");
        return;
    }

    responses.forEach(response => {

        const card = document.createElement("div");
        card.className = "request-card";

        addText(card, "Blood group: " + response.bloodGroup, "h3");
        addText(card, "Area: " + response.area);
        addText(card, "Response: " + response.response);

        donorResponseList.appendChild(card);
    });
}


// Manage live Firestore listeners
let unsubscribeRequests = null;
let unsubscribeResponses = null;


onAuthStateChanged(auth, user => {

    // Stop old listeners when the login state changes.
    if (unsubscribeRequests) unsubscribeRequests();
    if (unsubscribeResponses) unsubscribeResponses();


    if (!user) {
        requestList.replaceChildren();
        donorResponseList.replaceChildren();

        addText(requestList, "Please log in first.");
        return;
    }


    if (user.uid !== COORDINATOR_UID) {
        requestList.replaceChildren();
        donorResponseList.replaceChildren();

        addText(
            requestList,
            "Access denied. Coordinator permission required."
        );

        return;
    }


    // Listen for requests.
    unsubscribeRequests = onSnapshot(
        collection(db, "requests"),

        snapshot => {

            const requests = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));

            requests.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() ?? 0;
                const timeB = b.createdAt?.toMillis?.() ?? 0;

                return timeB - timeA;
            });

            displayRequests(requests);
        },

        error => {
            console.error("Request loading error:", error);
            requestList.textContent =
                "Unable to load requests. Check permissions.";
        }
    );


    // Listen for donor responses.
    unsubscribeResponses = onSnapshot(
        collection(db, "donorResponses"),

        snapshot => {

            const responses = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));

            displayDonorResponses(responses);
        },

        error => {
            console.error("Donor response loading error:", error);
            donorResponseList.textContent =
                "Unable to load donor responses. Check permissions.";
        }
    );

});


// Refresh dashboard
refreshButton.addEventListener("click", () => {
    window.location.reload();
});

// Create a notification for the requester
async function createNotification(userId, requestId, message) {

    try {

        await addDoc(collection(db, "notifications"), {
            userId: userId,
            requestId: requestId,
            message: message,
            isRead: false,
            createdAt: serverTimestamp()
        });

        console.log("Notification created successfully");

    } catch (error) {

        console.error("Notification error:", error);

    }
}

