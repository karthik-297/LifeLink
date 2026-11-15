
// LifeLink - Day 1

console.log("Welcome to LifeLink!");

const exploreButton = document.querySelector(".primary-btn");

exploreButton.addEventListener("click", function () {
    console.log("Exploring LifeLink features!");
});

// DONOR REGISTRATION

const donorForm = document.querySelector("#donorForm");

if (donorForm) {

    donorForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const name = document.querySelector("#name").value;
        const bloodGroup = document.querySelector("#bloodGroup").value;
        const availability = document.querySelector("#availability").value;

        const message = document.querySelector("#message");

        message.textContent =
            "Demo profile created successfully for " +
            name + "! Blood group: " + bloodGroup +
            ". Availability: " + availability + ".";

        donorForm.reset();

    });

}

/* DAY 3 - REQUESTER MODULE */


/* DAY 3 - REQUESTER MODULE */

const requestForm = document.getElementById("requestForm");

if (requestForm) {

    requestForm.addEventListener("submit", function(event) {

        event.preventDefault();

        // Collect form information
        const request = {
            id: "REQ" + Date.now(),

            name: document.getElementById("referenceName").value.trim(),

            blood: document.getElementById("bloodGroup").value,

            units: Number(document.getElementById("units").value),

            hospital: document.getElementById("hospital").value.trim(),

            date: document.getElementById("requiredDate").value,

            email: document.getElementById("email").value.trim(),

            details: document.getElementById("details").value.trim(),

            status: "Pending Verification",

            submittedAt: new Date().toLocaleString()
        };

        // Get previously saved requests
        let requests = JSON.parse(
            localStorage.getItem("lifeLinkRequests") || "[]"
        );

        // Add the new request
        requests.push(request);

        // Save updated requests
        localStorage.setItem(
            "lifeLinkRequests",
            JSON.stringify(requests)
        );

        // Display success message
        const message = document.getElementById("requestMessage");

        message.textContent =
            "Request submitted successfully! Reference ID: " +
            request.id +
            " | Status: Pending Verification";

        requestForm.reset();

    });

}

/* DAY 4 - COORDINATOR DASHBOARD */

(function () {

    const requestList = document.getElementById("requestList");

    // Run only on coordinator.html
    if (!requestList) {
        return;
    }

    const totalElement =
        document.getElementById("totalRequests");

    const pendingElement =
        document.getElementById("pendingRequests");

    const verifiedElement =
        document.getElementById("verifiedRequests");

    const rejectedElement =
        document.getElementById("rejectedRequests");


    // Read requests from localStorage
    function getRequests() {

        return JSON.parse(
            localStorage.getItem("lifeLinkRequests") || "[]"
        );

    }


    // Save requests to localStorage
    function saveRequests(requests) {

        localStorage.setItem(
            "lifeLinkRequests",
            JSON.stringify(requests)
        );

    }


    // Create a text element safely
    function addText(parent, tag, value) {

        const element = document.createElement(tag);

        element.textContent = value;

        parent.appendChild(element);

        return element;

    }


    // Display all requests
    function displayRequests() {

        const requests = getRequests();

        // Update dashboard numbers
        totalElement.textContent = requests.length;

        pendingElement.textContent =
            requests.filter(r =>
                r.status === "Pending Verification"
            ).length;

        verifiedElement.textContent =
            requests.filter(r =>
                r.status === "Verified"
            ).length;

        rejectedElement.textContent =
            requests.filter(r =>
                r.status === "Rejected"
            ).length;


        // Clear old request cards
        requestList.replaceChildren();


        // If no requests exist
        if (requests.length === 0) {

            const empty = document.createElement("p");

            empty.className = "empty-message";

            empty.textContent =
                "No requests received yet. Submit a demo request first.";

            requestList.appendChild(empty);

            return;

        }


        // Display each request
        requests.forEach(function (request) {

            const card = document.createElement("div");

            card.className = "request-card";


            addText(
                card,
                "h3",
                "Request ID: " + request.id
            );

            addText(
                card,
                "p",
                "Reference Name: " + request.name
            );

            addText(
                card,
                "p",
                "Blood Group: " + request.blood
            );

            addText(
                card,
                "p",
                "Units Requested: " + request.units
            );

            addText(
                card,
                "p",
                "Hospital / Area: " + request.hospital
            );

            addText(
                card,
                "p",
                "Required Date: " + request.date
            );

            addText(
                card,
                "p",
                "Submitted: " + request.submittedAt
            );

            addText(
                card,
                "p",
                "Additional Information: " +
                    (request.details || "None")
            );


            // Display current status
            const status = addText(
                card,
                "p",
                "Status: " + request.status
            );

            status.className = "request-status";


            if (request.status === "Verified") {

                status.classList.add("status-verified");

            } else if (request.status === "Rejected") {

                status.classList.add("status-rejected");

            } else {

                status.classList.add("status-pending");

            }


            // Action buttons
            const actions = document.createElement("div");

            actions.className = "request-actions";


            const verifyButton =
                document.createElement("button");

            verifyButton.textContent = "Verify";

            verifyButton.className = "verify-btn";

            verifyButton.dataset.action = "verify";

            verifyButton.dataset.id = request.id;


            const rejectButton =
                document.createElement("button");

            rejectButton.textContent = "Reject";

            rejectButton.className = "reject-btn";

            rejectButton.dataset.action = "reject";

            rejectButton.dataset.id = request.id;


            // Disable buttons after a decision
            const alreadyReviewed =
                request.status !== "Pending Verification";

            verifyButton.disabled = alreadyReviewed;

            rejectButton.disabled = alreadyReviewed;


            actions.appendChild(verifyButton);

            actions.appendChild(rejectButton);

            card.appendChild(actions);

            requestList.appendChild(card);

        });

    }


    // Handle Verify and Reject button clicks
    requestList.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button || !requestList.contains(button)) {
            return;
        }

        const action = button.dataset.action;

        const id = button.dataset.id;

        const requests = getRequests();

        const selectedRequest = requests.find(
            request => request.id === id
        );

        if (!selectedRequest) {
            return;
        }

        // Only pending requests can be reviewed
        if (selectedRequest.status !== "Pending Verification") {
            return;
        }


        if (action === "verify") {

            selectedRequest.status = "Verified";

        } else if (action === "reject") {

            selectedRequest.status = "Rejected";

        } else {

            return;

        }


        // Save updated status
        saveRequests(requests);

        // Refresh dashboard
        displayRequests();

    });


    // Refresh button
    document.getElementById("refreshRequests")
        .addEventListener("click", displayRequests);


    // Load requests when dashboard opens
    displayRequests();

})();
