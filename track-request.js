
import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const trackingMessage = document.getElementById("trackingMessage");
const myRequestList = document.getElementById("myRequestList");
const refreshButton = document.getElementById("refreshButton");
const notificationMessage =
    document.getElementById("notificationMessage");

const notificationList =
    document.getElementById("notificationList");

let unsubscribeRequests = null;
let unsubscribeNotifications = null;
let unsubscribeResponseListeners = [];

let responseStats = {};

// Helper function to safely display text
function addText(parent, text, tag = "p") {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
}

// Display the requester's own requests

function displayRequests(requests) {
    myRequestList.replaceChildren();

    if (requests.length === 0) {
        addText(myRequestList, "You haven't submitted any requests yet.");
        return;
    }

    requests.forEach(request => {
        const card = document.createElement("div");
        card.className = "request-card";

        addText(card, "Blood Group: " + request.blood, "h3");
        addText(card, "Units Required: " + request.units);
        addText(card, "Hospital / Area: " + request.hospital);
        addText(card, "Required Date: " + request.date);

        const status = document.createElement("span");

status.textContent = request.status;
status.className = "status-badge";

if (request.status === "Verified") {
    status.classList.add("status-verified");
} 
else if (request.status === "Rejected") {
    status.classList.add("status-rejected");
} 
else {
    status.classList.add("status-pending");
}

card.appendChild(status);


// Request progress timeline
const timeline = document.createElement("div");
timeline.className = "request-timeline";

const stages = [
    "Request Submitted",
    "Coordinator Verification",
    "Donor Responses"
];

let completedStages = 1;

if (request.status === "Verified") {
    completedStages = 2;
}

const stats = responseStats[request.id] || {
    interested: 0,
    unavailable: 0
};

if (
    request.status === "Verified" &&
    (stats.interested + stats.unavailable) > 0
) {
    completedStages = 3;
}

stages.forEach((stage, index) => {
    const stageElement = document.createElement("div");
    stageElement.className = "timeline-stage";

    const marker = document.createElement("span");
    marker.className = "timeline-marker";

    if (index < completedStages) {
        marker.classList.add("completed");
        marker.textContent = "✓";
    } else {
        marker.textContent = index + 1;
    }

    const stageText = document.createElement("span");
    stageText.textContent = stage;

    stageElement.appendChild(marker);
    stageElement.appendChild(stageText);

    timeline.appendChild(stageElement);
});

card.appendChild(timeline);


        // Display donor response counts
        addText(
            card,
            "Interested donors: " + stats.interested
        );

        addText(
            card,
            "Not available: " + stats.unavailable
        );

        myRequestList.appendChild(card);
    });

}

function displayNotifications(notifications) {

    // Clear previously displayed notifications
    notificationList.replaceChildren();

    // Check whether notifications exist
    if (notifications.length === 0) {
        addText(
            notificationList,
            "You have no notifications yet."
        );
        return;
    }

    // Display each notification
    notifications.forEach(notification => {

        const card = document.createElement("div");
        card.className = "request-card";

        // Display notification message
        addText(card, notification.message, "p");

        // Display read/unread status
        addText(
            card,
            notification.isRead ? "Read" : "Unread"
        );

        // Show button only for unread notifications
        if (!notification.isRead) {

            const readButton = document.createElement("button");
            readButton.textContent = "Mark as Read";

            readButton.addEventListener("click", async () => {

                try {
                    await updateDoc(
                        doc(db, "notifications", notification.id),
                        { isRead: true }
                    );

                } catch (error) {
                    console.error(
                        "Read status update failed:",
                        error
                    );
                }

            });

            card.appendChild(readButton);
        }

        notificationList.appendChild(card);
    });
}


// Check login and load only this user's requests
onAuthStateChanged(auth, user => {
    if (unsubscribeRequests) {
        unsubscribeRequests();
        unsubscribeRequests = null;
    }
    // Stop old donor response listeners
unsubscribeResponseListeners.forEach(unsubscribe => {
    unsubscribe();
});

unsubscribeResponseListeners = [];
responseStats = {};

    if (unsubscribeNotifications) {
    unsubscribeNotifications();
    unsubscribeNotifications = null;
}

    myRequestList.replaceChildren();

    if (!user) {
        notificationMessage.textContent =
        "Please log in to view notifications.";

notificationList.replaceChildren();
        trackingMessage.textContent =
            "Please log in to track your requests.";
        return;
    }

    trackingMessage.textContent = "Loading your requests...";
    // Load notifications belonging to the logged-in requester
notificationMessage.textContent = "Loading notifications...";

const myNotificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", user.uid)
);

unsubscribeNotifications = onSnapshot(
    myNotificationsQuery,

    snapshot => {

        const notifications = snapshot.docs.map(document => ({
            id: document.id,
            ...document.data()
        }));

        // Sort newest notifications first
        notifications.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() ?? 0;
            const timeB = b.createdAt?.toMillis?.() ?? 0;

            return timeB - timeA;
        });

        notificationMessage.textContent =
            "Your notifications are up to date.";

        displayNotifications(notifications);
    },

    error => {

        console.error("Notification loading error:", error);

        notificationMessage.textContent =
            "Unable to load notifications. Check Firestore permissions.";
    }
);

    const myRequestsQuery = query(
        collection(db, "requests"),
        where("createdBy", "==", user.uid)
    );

    unsubscribeRequests = onSnapshot(
        myRequestsQuery,
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

            trackingMessage.textContent =
                "Your requests are up to date.";

            
// Stop old response listeners
unsubscribeResponseListeners.forEach(unsubscribe => {
    unsubscribe();
});

unsubscribeResponseListeners = [];
responseStats = {};

// Listen for donor responses for each request
requests.forEach(request => {

    const responsesQuery = query(
        collection(db, "donorResponses"),
        where("requestId", "==", request.id)
    );

    const unsubscribe = onSnapshot(
        responsesQuery,
        snapshot => {

            const responses = snapshot.docs.map(document =>
                document.data()
            );

            responseStats[request.id] = {
                interested: responses.filter(
                    r => r.response === "Interested"
                ).length,

                unavailable: responses.filter(
                    r => r.response === "Not Available"
                ).length
            };

            displayRequests(requests);
        },
        error => {
            console.error("Donor response error:", error);
        }
    );

    unsubscribeResponseListeners.push(unsubscribe);
});

displayRequests(requests);

        },
        error => {
            console.error("Tracking error:", error);

            trackingMessage.textContent =
                "Unable to load your requests. Check your Firestore permissions.";
        }
    );
});

// Manual refresh
refreshButton.addEventListener("click", () => {
    window.location.reload();
});
