
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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";


const donorMessage = document.getElementById("donorMessage");
const donorRequestList = document.getElementById("donorRequestList");
const COORDINATOR_UID = "UyzkC46RbjTMWw6wvxSgjCXUH0a2";

let unsubscribeListings = null;
let unsubscribeResponses = null;

function addText(parent, text, tag = "p") {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
}


onAuthStateChanged(auth, user => {

    // Stop old listeners if the login state changes.
    if (unsubscribeListings) unsubscribeListings();
    if (unsubscribeResponses) unsubscribeResponses();

    donorRequestList.replaceChildren();

    if (!user) {
        donorMessage.textContent = "Please log in to view requests.";
        addText(donorRequestList, "Log in using your LifeLink account.");
        return;
    }
    if (user.uid === COORDINATOR_UID) {
    donorMessage.textContent =
        "Coordinator accounts cannot submit donor responses.";

    addText(
        donorRequestList,
        "Please use a donor account to respond to requests."
    );

    return;
}

    donorMessage.textContent = "Loading available demo requests...";

    let listings = [];
    let myResponses = [];

    function displayListings() {

        donorRequestList.replaceChildren();

        const responseMap = new Map(
            myResponses.map(response => [
                response.requestId,
                response.response
            ])
        );

        if (listings.length === 0) {
            addText(donorRequestList, "No available requests right now.");
            return;
        }

        listings.forEach(listing => {

            const card = document.createElement("div");
            card.className = "request-card";

            addText(card, "Blood group: " + listing.bloodGroup, "h3");
            addText(card, "Units requested: " + listing.units);
            addText(card, "Area: " + listing.area);
            addText(card, "Required date: " + listing.requiredDate);

            const previousResponse = responseMap.get(listing.id);

            if (previousResponse) {

                addText(
                    card,
                    "Your response: " + previousResponse
                );

            } else {

                const interestedButton = document.createElement("button");
                interestedButton.textContent = "Interested";
                interestedButton.className = "verify-btn";

                interestedButton.addEventListener("click", () => {
                    saveResponse(listing, user.uid, "Interested");
                });

                const unavailableButton = document.createElement("button");
                unavailableButton.textContent = "Not Available";
                unavailableButton.className = "reject-btn";

                unavailableButton.addEventListener("click", () => {
                    saveResponse(listing, user.uid, "Not Available");
                });

                card.appendChild(interestedButton);
                card.appendChild(unavailableButton);
            }

            donorRequestList.appendChild(card);
        });
    }


    async function saveResponse(listing, donorUid, response) {

        try {

            donorMessage.textContent = "Saving your response...";

            // One response document per donor per request.
            const responseId = listing.id + "_" + donorUid;

            await setDoc(
                doc(db, "donorResponses", responseId),
                {
                    requestId: listing.id,
                    bloodGroup: listing.bloodGroup,
                    area: listing.area,
                    donorUid: donorUid,
                    response: response,
                    createdAt: serverTimestamp()
                }
            );

            donorMessage.textContent = "Your response has been saved!";

        } catch (error) {

            console.error("Response error:", error);

            donorMessage.textContent =
                "Could not save your response. You may have already responded, or this request may no longer be open.";
        }
    }


    // Get only open, coordinator-approved demo listings.
    const listingsQuery = query(
        collection(db, "donorListings"),
        where("status", "==", "Open")
    );

    unsubscribeListings = onSnapshot(
        listingsQuery,
        snapshot => {

            listings = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data()
            }));

            displayListings();
        },
        error => {
            console.error("Listing error:", error);
            donorMessage.textContent = "Unable to load requests.";
        }
    );


    // Get this donor's own previous responses.
    const responsesQuery = query(
        collection(db, "donorResponses"),
        where("donorUid", "==", user.uid)
    );

    unsubscribeResponses = onSnapshot(
        responsesQuery,
        snapshot => {

            myResponses = snapshot.docs.map(document => document.data());

            displayListings();
        },
        error => {
            console.error("Response loading error:", error);
        }
    );

});
